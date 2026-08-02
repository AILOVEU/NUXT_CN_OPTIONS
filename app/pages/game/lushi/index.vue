<script setup>
import { ref, reactive, computed, nextTick, watch, onBeforeUnmount } from "vue";
import {
  HEROES,
  getCardById,
  defaultDeck,
  aiDeck,
  ART_BASE,
  MAX_MANA,
  MAX_HAND,
} from "./cards.js";
import {
  createGame,
  endTurn,
  playCard,
  useHeroPower,
  canAttackTarget,
  performAttack,
  cardNeedsTarget,
  legalTargets,
  heroTarget,
  minionTarget,
  opponentOf,
} from "./engine.js";
import { aiTakeTurn } from "./ai.js";
import GameCard from "./GameCard.vue";
import MinionView from "./MinionView.vue";
import DeckBuilder from "./DeckBuilder.vue";

const STORAGE_KEY = "lushi_deck_v1";

const screen = ref("menu"); // menu | deck | help | game | gameover
const playerDeck = ref([]);
const playerHeroId = ref(HEROES[0].id);
const aiHeroId = ref("hero_sesshomaru");
const aiDeckIds = ref(aiDeck());

const game = ref(null);
const log = ref([]);
const selectedHandUid = ref(null);
const showTargeting = ref(false);
const targetRule = ref(null); // { kind:'card'|'attack'|'heroPower', cardUid?, attackerUid? }
const pendingPosition = ref(null);

// ---- 动画状态 ----
const fx = reactive({
  minions: {}, // uid -> fx class
  floats: [], // 飘字 {id,x,y,text,kind}
  ghosts: [], // 死亡幽灵 {id,x,y,name,art}
  dragGhost: null, // {type,uid,x,y,data}
  attackSwing: null, // {x1,y1,x2,y2}
});
let floatId = 0;

// 之前渲染的战场 uid 集合（用于入场/死亡动画）
const seenUids = reactive({ player: new Set(), ai: new Set() });
let lastLogLen = 0;

// ============ 本地工具 ============
function isHero(ent) {
  if (!ent) return false;
  if (ent.key === "player" || ent.key === "ai") return true; // player 对象
  return !!(ent.power && !ent.cardId && !("maxMana" in ent)); // 英雄定义对象
}
function canPlayLocal(g, key, uid) {
  if (!g || g.over || g.current !== key) return { ok: false };
  const p = g.players[key];
  const c = p.hand.find((x) => x.uid === uid);
  if (!c) return { ok: false };
  if (c.cost > p.mana) return { ok: false };
  // 战场满且是随从
  if (c.type === "minion" && p.board.length >= 7) return { ok: false, reason: "战场已满" };
  return { ok: true };
}

// ============ 菜单 / 牌组 ============
function initDeck() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) playerDeck.value = JSON.parse(saved);
  } catch (e) {}
  if (!playerDeck.value || playerDeck.value.length === 0)
    playerDeck.value = defaultDeck();
}
initDeck();

function startWithDeck() {
  if (playerDeck.value.length < 1) playerDeck.value = defaultDeck();
  startNewGame();
}
function openDeckBuilder() {
  screen.value = "deck";
}
function onDeckSaved(d, hid) {
  playerDeck.value = d;
  if (hid) playerHeroId.value = hid;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  screen.value = "menu";
}

function startNewGame() {
  const g = createGame({
    playerHeroId: playerHeroId.value,
    aiHeroId: aiHeroId.value,
    playerDeck: playerDeck.value,
    aiDeckIds: aiDeckIds.value,
  });
  game.value = g;
  log.value = [];
  syncLog();
  screen.value = "game";
  // 初始战场为空
  seenUids.player = new Set();
  seenUids.ai = new Set();
  if (g.current === "ai") scheduleAI();
}

// ============ 日志同步（从引擎 g.log 读取新增条目） ============
function syncLog() {
  const arr = game.value.log;
  for (let i = lastLogLen; i < arr.length; i++) {
    log.value.push({ id: arr[i].id, text: arr[i].text });
  }
  lastLogLen = arr.length;
  if (log.value.length > 120) log.value.shift();
}

// ============ 视图辅助 ============
function heroName(key) {
  const h = HEROES.find((x) => x.id === game.value?.players[key].hero.id);
  return h ? h.name : "??";
}
const player = computed(() => game.value?.players.player);
const ai = computed(() => game.value?.players.ai);
const isPlayerTurn = computed(() => game.value?.current === "player");
const pView = computed(() => structuredView(player.value));
const aView = computed(() => structuredView(ai.value));
const pHand = computed(() => player.value?.hand || []);
const aHandCount = computed(() => ai.value?.hand.length || 0);

function structuredView(p) {
  if (!p) return null;
  return {
    hero: p.hero,
    mana: p.mana,
    maxMana: p.maxMana,
    handCount: p.hand.length,
    deckCount: p.deck.length,
    fatigue: p.fatigue,
    board: p.board.map((m) => ({ ...m })),
    weapon: p.hero.weapon,
  };
}

function manaCrystals(p) {
  if (!p) return [];
  const arr = [];
  for (let i = 0; i < MAX_MANA; i++) {
    arr.push({ filled: i < p.mana, empty: i >= p.mana && i < p.maxMana });
  }
  return arr;
}

// ============ 飘字 / FX ============
function floatText(side, target, text, kind) {
  const el = resolveEl(side, target);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const id = ++floatId;
  fx.floats.push({
    id,
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    text,
    kind,
  });
  setTimeout(() => {
    fx.floats = fx.floats.filter((f) => f.id !== id);
  }, 900);
}
function resolveEl(side, target) {
  if (isHero(target)) return document.querySelector(`#${side}-hero`);
  return document.querySelector(`[data-uid="${target.uid}"][data-side="${side}"]`);
}
function setMinionFx(uid, cls, ms = 400) {
  fx.minions[uid] = cls;
  setTimeout(() => {
    if (fx.minions[uid] === cls) delete fx.minions[uid];
  }, ms);
}

// ============ target 构造 ============
function sideOfEntity(ent) {
  if (ent && (ent.key === "player" || ent.key === "ai")) return ent.key; // player 对象
  if (isHero(ent)) {
    // 英雄定义对象，对比引用
    if (game.value.players.player.hero === ent) return "player";
    return "ai";
  }
  // minion
  for (const side of ["player", "ai"]) {
    if (game.value.players[side].board.some((m) => m.uid === ent.uid)) return side;
  }
  return "player";
}
function toTarget(ent) {
  const side = sideOfEntity(ent);
  return isHero(ent) ? heroTarget(side) : minionTarget(side, ent);
}

// ============ 拖拽系统 ============
let dragStart = null;
function onCardPointerDown({ event, card }) {
  if (screen.value !== "game") return;
  if (!isPlayerTurn.value || game.value.over) return;
  const c = player.value.hand.find((x) => x.uid === card.uid);
  if (!c || !canPlayLocal(game.value, "player", card.uid).ok) return;
  event.preventDefault();
  startDrag({ type: "card", uid: card.uid, card }, event);
}
function onMinionPointerDown({ event, minion }) {
  if (screen.value !== "game") return;
  if (!isPlayerTurn.value || game.value.over) return;
  const m = player.value.board.find((x) => x.uid === minion.uid);
  if (!m || !m.canAttack) return;
  event.preventDefault();
  startDrag({ type: "minion", uid: minion.uid, minion }, event);
}
function startDrag(payload, event) {
  dragStart = payload;
  fx.dragGhost = {
    type: payload.type,
    uid: payload.uid,
    x: event.clientX,
    y: event.clientY,
    data: payload.type === "card" ? payload.card : payload.minion,
  };
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
}
function onDragMove(e) {
  if (!fx.dragGhost) return;
  fx.dragGhost.x = e.clientX;
  fx.dragGhost.y = e.clientY;
}
function onDragEnd(e) {
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
  const ghost = fx.dragGhost;
  fx.dragGhost = null;
  if (!ghost) return;
  const target = document.elementFromPoint(e.clientX, e.clientY);
  const drop = findDrop(target);
  if (ghost.type === "card") handleCardDrop(ghost, drop);
  else if (ghost.type === "minion") handleMinionDrop(ghost, drop);
  dragStart = null;
}
function findDrop(el) {
  if (!el) return { type: null };
  const board = el.closest("[data-board]");
  if (board) {
    const side = board.getAttribute("data-board");
    if (side === "player") {
      const slot = el.closest("[data-slot]");
      const pos = slot ? parseInt(slot.getAttribute("data-slot")) : -1;
      return { type: "player-board", pos };
    }
    return { type: "enemy-board" };
  }
  const minionEl = el.closest("[data-uid]");
  if (minionEl)
    return {
      type: "minion",
      side: minionEl.getAttribute("data-side"),
      uid: minionEl.getAttribute("data-uid"),
    };
  const heroEl = el.closest("[data-hero]");
  if (heroEl) return { type: "hero", side: heroEl.getAttribute("data-hero") };
  return { type: null };
}

function handleCardDrop(ghost, drop) {
  const uid = ghost.uid;
  const card = player.value.hand.find((c) => c.uid === uid);
  if (!card) return;
  const need = cardNeedsTarget(game.value, "player", card);
  if (need) {
    if (drop.type === "minion" || drop.type === "hero") {
      const tgt = drop.type === "hero"
        ? game.value.players[drop.side]
        : game.value.players[drop.side].board.find((m) => m.uid === drop.uid);
      if (tgt && legalTargets(game.value, "player", card.target || TARGET.NONE).some((t) => sameTarget(t, tgt))) {
        resolvePlay(uid, need, { target: toTarget(tgt) });
        return;
      }
    }
    enterTargeting(uid, need);
  } else if (drop.type === "player-board") {
    doPlay(uid, { position: drop.pos });
  } else {
    doPlay(uid, {});
  }
}
function handleMinionDrop(ghost, drop) {
  const attacker = player.value.board.find((m) => m.uid === ghost.uid);
  if (!attacker) return;
  if (drop.type === "hero" || drop.type === "minion") {
    const tgt = drop.type === "hero"
      ? game.value.players[drop.side]
      : game.value.players[drop.side].board.find((m) => m.uid === drop.uid);
    if (tgt && canAttackTarget(game.value, "player", toTarget(attacker), toTarget(tgt)).ok) {
      doAttack(attacker, tgt);
      return;
    }
  }
}
function sameTarget(t, ent) {
  if (isHero(ent)) return t.kind === "hero" && t.owner === sideOfEntity(ent);
  return t.kind === "minion" && t.minion && t.minion.uid === ent.uid;
}

// ============ 出牌 ============
function onCardClick(card) {
  if (!isPlayerTurn.value || game.value.over) return;
  const c = player.value.hand.find((x) => x.uid === card.uid);
  if (!c || !canPlayLocal(game.value, "player", c.uid).ok) return;
  if (selectedHandUid.value === c.uid && !showTargeting.value) {
    selectedHandUid.value = null;
    return;
  }
  const need = cardNeedsTarget(c);
  if (need) enterTargeting(c.uid, need);
  else {
    selectedHandUid.value = c.uid;
    showTargeting.value = false;
  }
}
function enterTargeting(uid, need) {
  selectedHandUid.value = uid;
  showTargeting.value = true;
  targetRule.value = { kind: "card", cardUid: uid };
}
function onTargetClick(target) {
  if (!showTargeting.value) return;
  const card = player.value.hand.find((c) => c.uid === selectedHandUid.value);
  resolvePlay(selectedHandUid.value, card, { target: toTarget(target) });
}
function resolvePlay(uid, card, opts) {
  selectedHandUid.value = null;
  showTargeting.value = false;
  targetRule.value = null;
  if (!card || !canPlayLocal(game.value, "player", uid).ok) return;
  const before = snapshotHp();
  const res = playCard(game.value, "player", uid, opts);
  if (res && res.ok) {
    animateDamage(before);
    detectBoardChanges();
    syncLog();
    if (game.value.over) onGameOver();
  }
}
function doPlay(uid, opts) {
  const before = snapshotHp();
  const res = playCard(game.value, "player", uid, opts);
  if (res && res.ok) {
    animateDamage(before);
    detectBoardChanges();
    syncLog();
    if (game.value.over) onGameOver();
  }
}

// ============ 攻击 ============
function onMinionClick(minion) {
  if (showTargeting.value) {
    onTargetClick(minion);
    return;
  }
  if (!isPlayerTurn.value || game.value.over) return;
  const m = player.value.board.find((x) => x.uid === minion.uid);
  if (!m || !m.canAttack) return;
  selectedHandUid.value = null;
  showTargeting.value = true;
  targetRule.value = { kind: "attack", attackerUid: minion.uid };
}
function toTargetForRule() {
  if (!targetRule.value) return null;
  if (targetRule.value.kind === "attack") {
    const m = player.value.board.find((x) => x.uid === targetRule.value.attackerUid);
    return m ? toTarget(m) : null;
  }
  if (targetRule.value.kind === "card") {
    const c = player.value.hand.find((x) => x.uid === targetRule.value.cardUid);
    return c ? toTarget(c) : null;
  }
  return null;
}
function onHeroClick(side) {
  if (showTargeting.value) {
    const heroObj = game.value.players[side];
    onTargetClick(heroObj);
  }
}
function doAttack(attacker, target) {
  const before = snapshotHp();
  const res = performAttack(game.value, "player", toTarget(attacker), toTarget(target));
  showTargeting.value = false;
  targetRule.value = null;
  selectedHandUid.value = null;
  if (res) {
    swingFx(attacker, target);
    if (attacker.uid) setMinionFx(attacker.uid, "fx-attack", 320);
    if (target.uid) setMinionFx(target.uid, "fx-hit", 340);
    animateDamage(before);
    detectBoardChanges();
    syncLog();
    if (game.value.over) setTimeout(onGameOver, 560);
  }
}

// ============ 英雄技能 ============
function onHeroPower() {
  if (!isPlayerTurn.value || game.value.over) return;
  const power = player.value.hero.power;
  if (player.value.powerUsed || player.value.mana < power.cost) return;
  if (power.target) {
    selectedHandUid.value = null;
    showTargeting.value = true;
    targetRule.value = { kind: "heroPower" };
  } else {
    doHeroPower(null);
  }
}
function doHeroPower(target) {
  const before = snapshotHp();
  const res = useHeroPower(game.value, "player", target ? toTarget(target) : undefined);
  showTargeting.value = false;
  targetRule.value = null;
  if (res && res.ok) {
    animateDamage(before);
    animateDamage(before);
    detectBoardChanges();
    syncLog();
    if (game.value.over) onGameOver();
  }
}

// ============ 结束回合 / AI ============
function onEndTurn() {
  if (!isPlayerTurn.value || game.value.over) return;
  selectedHandUid.value = null;
  showTargeting.value = false;
  targetRule.value = null;
  endTurn(game.value);
  syncLog();
  scheduleAI();
}
function scheduleAI() {
  if (game.value.over) return;
  setTimeout(runAITurn, 750);
}
function runAITurn() {
  if (game.value.over || game.value.current !== "ai") {
    if (game.value.over) onGameOver();
    else maybeStartPlayerTurn();
    return;
  }
  const before = snapshotHp();
  const acted = aiTakeTurn(game.value);
  animateDamage(before);
  detectBoardChanges();
  syncLog();
  if (game.value.over) {
    setTimeout(onGameOver, 600);
    return;
  }
  if (acted) setTimeout(runAITurn, 650);
  else {
    // AI 已 endTurn（在 aiTakeTurn 内）
    maybeStartPlayerTurn();
  }
}
function maybeStartPlayerTurn() {
  if (game.value.over) return;
  nextTick(() => {
    if (isPlayerTurn.value) {
      detectBoardChanges();
      syncLog();
    }
  });
}

// ============ 动画：HP 快照 diff ============
function snapshotHp() {
  const snap = { player: {}, ai: {} };
  for (const side of ["player", "ai"]) {
    const p = game.value.players[side];
    snap[side].hero = p.health;
    p.board.forEach((m) => (snap[side][m.uid] = m.health));
  }
  return snap;
}
function animateDamage(before) {
  for (const side of ["player", "ai"]) {
    const p = game.value.players[side];
    const now = p.health;
    const prev = before[side].hero;
    if (prev != null && now < prev) floatText(side, p.hero, "-" + (prev - now), "damage");
    else if (prev != null && now > prev) floatText(side, p.hero, "+" + (now - prev), "heal");
    p.board.forEach((m) => {
      const prevH = before[side][m.uid];
      if (prevH == null) return;
      if (m.health < prevH) {
        floatText(side, m, "-" + (prevH - m.health), "damage");
        setMinionFx(m.uid, "fx-hit", 340);
      } else if (m.health > prevH) {
        floatText(side, m, "+" + (m.health - prevH), "heal");
      }
    });
  }
}

// 入场 / 死亡动画：对比 uid 集合
function detectBoardChanges() {
  for (const side of ["player", "ai"]) {
    const uids = game.value.players[side].board.map((m) => m.uid);
    const set = new Set(uids);
    // 新增 -> 入场
    uids.forEach((uid) => {
      if (!seenUids[side].has(uid)) {
        const m = game.value.players[side].board.find((x) => x.uid === uid);
        if (m) {
          setMinionFx(uid, "fx-enter", 380);
          // 衍生物/召唤位置
          m._entered = true;
        }
      }
    });
    // 消失 -> 死亡幽灵
    seenUids[side].forEach((uid) => {
      if (!set.has(uid)) spawnDeathGhost(side, uid);
    });
    seenUids[side] = set;
  }
  syncLog();
}
function spawnDeathGhost(side, uid) {
  // 查找之前的 DOM 元素位置（调用前已记录？此处 DOM 可能已更新）
  const el = document.querySelector(`[data-uid="${uid}"][data-side="${side}"]`);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const id = ++floatId;
  fx.ghosts.push({ id, x: rect.left, y: rect.top, w: rect.width, h: rect.height });
  setTimeout(() => {
    fx.ghosts = fx.ghosts.filter((g) => g.id !== id);
  }, 520);
}
function swingFx(attacker, target) {
  const aEl = document.querySelector(`[data-uid="${attacker.uid}"][data-side="player"]`);
  let tx = 0, ty = 0;
  if (isHero(target)) {
    const h = document.querySelector(`#ai-hero`);
    if (h) { const r = h.getBoundingClientRect(); tx = r.left + r.width / 2; ty = r.top + r.height / 2; }
  } else {
    const t = document.querySelector(`[data-uid="${target.uid}"][data-side="ai"]`);
    if (t) { const r = t.getBoundingClientRect(); tx = r.left + r.width / 2; ty = r.top + r.height / 2; }
  }
  if (!aEl) return;
  const r = aEl.getBoundingClientRect();
  fx.attackSwing = { x1: r.left + r.width / 2, y1: r.top + r.height / 2, x2: tx, y2: ty, id: ++floatId };
  setTimeout(() => { fx.attackSwing = null; }, 280);
}

// ============ 游戏结束 ============
function onGameOver() {
  if (screen.value === "gameover") return;
  pushEndLog();
  screen.value = "gameover";
}
function pushEndLog() {
  const w = game.value.winner;
  log.value.push({ id: Date.now() + Math.random(), text: w === "player" ? "🏆 胜利！奈落退散！" : "💀 你被击败了……" });
}
function backToMenu() {
  game.value = null;
  screen.value = "menu";
}

function heroArt(id) {
  const h = HEROES.find((x) => x.id === id);
  return h && h.art ? ART_BASE + h.art : "";
}
function artOf(ent) {
  if (isHero(ent)) return heroArt(ent.hero ? ent.hero.id : ent.id);
  const def = getCardById(ent.cardId);
  return def && def.art ? ART_BASE + def.art : "";
}

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
});
</script>

<template>
  <!-- ============ 菜单 ============ -->
  <div v-if="screen === 'menu'" class="menu">
    <div class="menu-bg"></div>
    <h1 class="title">犬夜叉 · 妖乱斗</h1>
    <p class="subtitle">类炉石卡牌对战 · 犬夜叉主题</p>

    <div class="hero-pick">
      <div
        v-for="h in HEROES"
        :key="h.id"
        class="hero-opt"
        :class="{ active: playerHeroId === h.id }"
        @click="playerHeroId = h.id"
      >
        <div class="hero-portrait">
          <img v-if="heroArt(h.id)" :src="heroArt(h.id)" :alt="h.name" />
          <div v-else class="pf">{{ h.name[0] }}</div>
        </div>
        <div class="hero-meta">
          <div class="hn">{{ h.name }}</div>
          <div class="ht">{{ h.title }}</div>
          <div class="hpw">技能：{{ h.power.name }}</div>
        </div>
      </div>
    </div>

    <div class="menu-actions">
      <button class="btn primary" @click="startWithDeck">开始游戏</button>
      <button class="btn" @click="openDeckBuilder">设置牌组</button>
      <button class="btn" @click="screen = 'help'">玩法说明</button>
    </div>
    <p class="deck-hint">当前牌组：{{ playerDeck.length }} 张 · 英雄：{{ HEROES.find(h=>h.id===playerHeroId)?.name }}</p>
  </div>

  <!-- ============ 牌组编辑器 ============ -->
  <DeckBuilder
    v-else-if="screen === 'deck'"
    :initial="playerDeck"
    :hero-id="playerHeroId"
    @saved="onDeckSaved"
    @cancel="screen = 'menu'"
  />

  <!-- ============ 说明 ============ -->
  <div v-else-if="screen === 'help'" class="help">
    <h2>玩法说明</h2>
    <ul>
      <li>目标：将敌方英雄生命值降到 0。</li>
      <li>每回合法力水晶 +1（上限 10），先手 3 张后手 4 张起手。</li>
      <li>从手牌<b>拖拽</b>随从到己方战场，或拖拽法术/武器到目标释放；也可点击卡牌再点目标。</li>
      <li>随从召唤当回合有"召唤失调"，无法攻击（冲锋/突袭除外）。</li>
      <li>拖拽己方随从到敌方英雄/随从发动攻击；嘲讽随从必须优先被攻击。</li>
      <li>关键词：嘲讽 / 冲锋 / 突袭 / 圣盾 / 风怒 / 潜行 / 吸血 / 剧毒。</li>
      <li>英雄技能每回合可用一次。弥勒「风穴」抽牌需自伤 1 点。</li>
      <li>手牌上限 10，牌库耗尽后每次抽牌受到疲劳伤害（递增）。</li>
    </ul>
    <button class="btn" @click="screen = 'menu'">返回</button>
  </div>

  <!-- ============ 对战 ============ -->
  <div v-else-if="screen === 'game' || screen === 'gameover'" class="battle">
    <!-- 敌方 -->
    <section class="row enemy">
      <div class="hero-card" :id="'ai-hero'" data-hero="ai"
           :class="{ targetable: showTargeting }"
           @click="onHeroClick('ai')">
        <img v-if="heroArt(ai?.hero.id)" class="hero-img" :src="heroArt(ai?.hero.id)" :alt="ai?.hero.name" />
        <div class="hero-info">
          <div class="hero-name">{{ ai?.hero.name }}</div>
          <div class="hp-badge">{{ ai?.health }}</div>
          <div class="mana-badge">{{ ai?.mana }}/{{ ai?.maxMana }}</div>
        </div>
        <div class="hero-power" :class="{ used: ai?.powerUsed }" :title="ai?.hero.power.name">
          {{ ai?.hero.power.name }}
        </div>
      </div>

      <div class="board" :id="'a-board'" data-board="ai">
        <MinionView
          v-for="m in aView?.board"
          :key="m.uid"
          :minion="m"
          :controllable="false"
          :can-attack="false"
          :targetable="showTargeting && targetRule && targetRule.kind === 'attack' && canAttackTarget(game, 'player', toTargetForRule(), toTarget(m)).ok"
          :fx="fx.minions[m.uid] || ''"
          :data-uid="m.uid"
          :data-side="'ai'"
          @click="onMinionClick(m)"
        />
      </div>

      <div class="enemy-hand">
        <div v-for="n in aHandCount" :key="n" class="enemy-card-back"></div>
      </div>
    </section>

    <!-- 中部 -->
    <section class="mid">
      <div class="deck-piles">
        <div class="pile" :title="'敌方牌库 ' + ai?.deckCount">敌库 {{ ai?.deckCount }}</div>
        <div class="fatigue" v-if="ai?.fatigue > 1">疲劳 {{ ai?.fatigue }}</div>
        <div class="turn-tag">回合 {{ game?.turn }}</div>
        <div class="fatigue" v-if="player?.fatigue > 1">疲劳 {{ player?.fatigue }}</div>
        <div class="pile" :title="'你的牌库 ' + player?.deckCount">你库 {{ player?.deckCount }}</div>
      </div>
      <div class="log-box">
        <div v-for="l in log" :key="l.id" class="log-line">{{ l.text }}</div>
      </div>
    </section>

    <!-- 己方 -->
    <section class="row self">
      <div class="board" :id="'p-board'" data-board="player">
        <div v-for="(m, i) in pView?.board" :key="m.uid" class="slot" :data-slot="i">
          <MinionView
            :minion="m"
            :controllable="true"
            :can-attack="m.canAttack"
            :selected="false"
            :targetable="showTargeting && targetRule && targetRule.kind === 'attack' && selectedHandUid !== m.uid && canAttackTarget(game, 'player', toTargetForRule(), toTarget(m)).ok"
            :fx="fx.minions[m.uid] || ''"
            :data-uid="m.uid"
            :data-side="'player'"
            @pointerdown="onMinionPointerDown"
            @click="onMinionClick(m)"
          />
        </div>
      </div>

      <div class="self-bar">
        <div class="hero-card self-hero" :id="'player-hero'" data-hero="player">
          <img v-if="heroArt(player?.hero.id)" class="hero-img" :src="heroArt(player?.hero.id)" :alt="player?.hero.name" />
          <div class="hero-info">
            <div class="hero-name">{{ player?.hero.name }}</div>
            <div class="hp-badge">{{ player?.health }}</div>
          </div>
          <button class="hero-power-btn"
                  :class="{ used: player?.powerUsed, ready: !player?.powerUsed && player?.mana >= player?.hero.power.cost }"
                  :title="player?.hero.power.name + '：' + player?.hero.power.text"
                  @click="onHeroPower">
            <span class="pw-name">{{ player?.hero.power.name }}</span>
            <span class="pw-cost">{{ player?.hero.power.cost }}</span>
          </button>
        </div>

        <div class="mana-row">
          <span v-for="(c, i) in manaCrystals(player)" :key="i"
                class="crystal" :class="{ filled: c.filled }"></span>
          <span class="mana-text">{{ player?.mana }}/{{ player?.maxMana }}</span>
        </div>

        <div class="hand" :id="'p-hand'">
          <GameCard
            v-for="c in pHand"
            :key="c.uid"
            :card="c"
            mode="hand"
            :playable="canPlayLocal(game, 'player', c.uid).ok && isPlayerTurn"
            :selected="selectedHandUid === c.uid"
            @pointerdown="onCardPointerDown"
            @click="onCardClick(c)"
          />
        </div>

        <button class="end-turn" :disabled="!isPlayerTurn || game?.over" @click="onEndTurn">
          结束回合
        </button>
      </div>
    </section>

    <!-- 目标提示遮罩 -->
    <div v-if="showTargeting" class="targeting-hint">
      选择目标（点击敌方英雄/随从，或拖拽释放）
      <button class="btn small" @click="() => { showTargeting=false; selectedHandUid=null; targetRule=null; }">取消</button>
    </div>
  </div>

  <!-- ============ 游戏结束 ============ -->
  <div v-if="screen === 'gameover'" class="gameover">
    <div class="go-panel" :class="game?.winner">
      <h2>{{ game?.winner === 'player' ? '🏆 胜利！' : '💀 战败' }}</h2>
      <p>{{ game?.winner === 'player' ? '奈落已被净化。' : '妖气笼罩了战场……' }}</p>
      <button class="btn primary" @click="startNewGame">再来一局</button>
      <button class="btn" @click="backToMenu">返回菜单</button>
    </div>
  </div>

  <!-- 拖拽残影 -->
  <div v-if="fx.dragGhost" class="drag-ghost"
       :style="{ left: fx.dragGhost.x + 'px', top: fx.dragGhost.y + 'px' }">
    <GameCard v-if="fx.dragGhost.type === 'card'" :card="fx.dragGhost.data" mode="hand" :dragging="true" />
    <MinionView v-else :minion="fx.dragGhost.data" :controllable="true" :dragging="true" />
  </div>

  <!-- 死亡幽灵 -->
  <div v-for="g in fx.ghosts" :key="g.id" class="death-ghost"
       :style="{ left: g.x + 'px', top: g.y + 'px', width: g.w + 'px', height: g.h + 'px' }"></div>

  <!-- 飘字 -->
  <div v-for="f in fx.floats" :key="f.id" class="float"
       :class="f.kind"
       :style="{ left: f.x + 'px', top: f.y + 'px' }">
    {{ f.text }}
  </div>

  <!-- 挥击特效 -->
  <svg v-if="fx.attackSwing" class="swing" :style="{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }">
    <line :x1="fx.attackSwing.x1" :y1="fx.attackSwing.y1"
          :x2="fx.attackSwing.x2" :y2="fx.attackSwing.y2"
          stroke="#fff3c4" stroke-width="5" stroke-linecap="round" opacity="0.9" />
  </svg>
</template>

<style scoped>
* { box-sizing: border-box; }
.menu, .battle, .help {
  min-height: 100vh;
  color: #f5f5f5;
  font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}
.menu {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  position: relative;
  background: radial-gradient(circle at 50% 20%, #3a1d4d 0%, #140d1f 60%, #0a0710 100%);
  padding: 24px;
}
.menu-bg {
  position: absolute; inset: 0;
  background: repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 12px);
  pointer-events: none;
}
.title {
  font-size: 46px; margin: 0; letter-spacing: 4px;
  background: linear-gradient(90deg, #ff8a65, #ffd54f, #ba68c8);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 2px 12px rgba(255, 213, 79, 0.25); z-index: 1;
}
.subtitle { color: #b39ddb; margin: 6px 0 24px; z-index: 1; }

.hero-pick { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; z-index: 1; max-width: 880px; }
.hero-opt {
  display: flex; gap: 10px; width: 400px; padding: 10px; border-radius: 14px;
  background: rgba(255,255,255,0.05); border: 2px solid transparent; cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, background 0.15s;
}
.hero-opt:hover { transform: translateY(-4px); background: rgba(255,255,255,0.09); }
.hero-opt.active { border-color: #ffd54f; box-shadow: 0 0 16px rgba(255,213,79,0.4); background: rgba(255,213,79,0.08); }
.hero-portrait { width: 64px; height: 90px; border-radius: 10px; overflow: hidden; background: #1a1422; flex-shrink: 0; border: 2px solid #7e57c2; }
.hero-portrait img { width: 100%; height: 100%; object-fit: cover; object-position: top center; }
.pf { width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700; }
.hero-meta { display: flex; flex-direction: column; gap: 3px; }
.hn { font-size: 18px; font-weight: 700; }
.ht { font-size: 12px; color: #ce93d8; }
.hpw { font-size: 12px; color: #90caf9; }

.menu-actions { display: flex; gap: 14px; margin-top: 28px; z-index: 1; }
.btn {
  padding: 10px 22px; border-radius: 10px; border: 1px solid #7e57c2;
  background: rgba(126,87,194,0.15); color: #fff; font-size: 15px; cursor: pointer;
  transition: transform 0.12s, background 0.12s;
}
.btn:hover { transform: translateY(-2px); background: rgba(126,87,194,0.32); }
.btn.primary { background: linear-gradient(135deg, #ff8a65, #e53935); border-color: #ff8a65; font-weight: 700; }
.btn.small { padding: 5px 12px; font-size: 13px; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.deck-hint { color: #b39ddb; margin-top: 18px; z-index: 1; }

.help { max-width: 720px; margin: 0 auto; padding: 40px 24px; background: #16121f; }
.help h2 { color: #ffd54f; }
.help li { line-height: 1.9; margin-bottom: 4px; }
.help b { color: #ff8a65; }

/* 对战布局 */
.battle {
  display: flex; flex-direction: column; min-height: 100vh;
  background: linear-gradient(180deg, #2a1633 0%, #1a1020 50%, #120a18 100%);
  position: relative; overflow: hidden;
}
.row { display: flex; align-items: center; gap: 14px; padding: 10px 18px; min-height: 130px; position: relative; }
.row.enemy { background: rgba(120, 20, 30, 0.18); }
.row.self { background: rgba(20, 60, 120, 0.18); flex-wrap: wrap; align-items: flex-end; }

.hero-card {
  position: relative; width: 130px; min-width: 130px; height: 120px; border-radius: 14px;
  overflow: hidden; cursor: pointer; background: #1c1526; border: 2px solid #ef5350;
  transition: transform 0.15s, box-shadow 0.15s;
}
.hero-card.targetable { box-shadow: 0 0 0 3px #ef5350, 0 0 18px rgba(239,83,80,0.8); }
.hero-img { width: 100%; height: 100%; object-fit: cover; object-position: top center; position: absolute; inset: 0; }
.hero-info { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 4px; }
.hero-name { font-weight: 700; font-size: 14px; text-shadow: 0 1px 3px #000; background: rgba(0,0,0,0.35); border-radius: 6px; padding: 0 4px; width: fit-content; }
.hp-badge { align-self: flex-end; background: radial-gradient(circle at 35% 30%, #ef5350, #b71c1c); color: #fff; border: 2px solid #fff; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-weight: 800; }
.mana-badge { position: absolute; top: 4px; right: 4px; background: rgba(33,150,243,0.85); border-radius: 6px; padding: 0 6px; font-size: 12px; font-weight: 700; }
.hero-power { position: absolute; bottom: 4px; left: 4px; right: 4px; font-size: 11px; background: rgba(0,0,0,0.6); border-radius: 6px; text-align: center; padding: 2px; color: #ffd54f; }

.board { display: flex; gap: 10px; align-items: flex-end; flex: 1; min-height: 120px; flex-wrap: wrap; }
.slot { min-width: 96px; min-height: 116px; display: flex; align-items: flex-end; }

.enemy-hand { display: flex; gap: 4px; }
.enemy-card-back {
  width: 26px; height: 38px; border-radius: 4px;
  background: repeating-linear-gradient(45deg, #4a148c 0 6px, #6a1b9a 6px 12px);
  border: 1px solid #ce93d8;
}

.mid { display: flex; gap: 14px; align-items: center; padding: 4px 18px; min-height: 70px; }
.deck-piles { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
.pile { background: rgba(255,255,255,0.08); border-radius: 8px; padding: 4px 8px; border: 1px solid #7e57c2; }
.fatigue { color: #ff8a65; }
.turn-tag { background: #ffd54f; color: #000; font-weight: 700; border-radius: 8px; padding: 4px 10px; }
.log-box { flex: 1; height: 64px; overflow-y: auto; background: rgba(0,0,0,0.35); border-radius: 8px; padding: 6px 10px; font-size: 12px; line-height: 1.5; color: #e1bee7; }
.log-line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.self-bar { display: flex; align-items: center; gap: 14px; width: 100%; padding: 6px 18px 14px; flex-wrap: wrap; }
.self-hero { border-color: #42a5f5; }
.mana-row { display: flex; align-items: center; gap: 3px; flex-wrap: wrap; max-width: 200px; }
.crystal { width: 14px; height: 14px; border-radius: 50%; background: #263238; border: 1px solid #4fc3f7; }
.crystal.filled { background: radial-gradient(circle at 35% 30%, #80d8ff, #0288d1); box-shadow: 0 0 6px #4fc3f7; }
.mana-text { font-size: 12px; color: #4fc3f7; margin-left: 4px; }

.hand { display: flex; gap: 8px; align-items: flex-end; flex: 1; min-height: 210px; padding-top: 16px; }
.hand .card { transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1); }
.hand .card.deal-in { animation: dealIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes dealIn {
  from { transform: translateY(60px) scale(0.5) rotate(-8deg); opacity: 0; }
  to { transform: translateY(0) scale(1) rotate(0); opacity: 1; }
}

.end-turn {
  padding: 14px 20px; border-radius: 12px; font-size: 16px; font-weight: 700;
  background: linear-gradient(135deg, #66bb6a, #2e7d32); color: #fff; border: none; cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4); transition: transform 0.12s;
}
.end-turn:hover:not(:disabled) { transform: translateY(-3px); }
.end-turn:disabled { opacity: 0.4; cursor: not-allowed; }

.hero-power-btn {
  position: absolute; bottom: 4px; left: 4px; right: 4px;
  border: none; border-radius: 8px; padding: 3px; cursor: pointer;
  display: flex; align-items: center; justify-content: space-between;
  background: rgba(255,213,79,0.85); color: #000; font-weight: 700; font-size: 12px;
  transition: transform 0.12s, box-shadow 0.12s;
}
.hero-power-btn.ready { box-shadow: 0 0 10px rgba(255,213,79,0.9); }
.hero-power-btn.used { background: rgba(120,120,120,0.7); color: #ddd; }
.pw-cost { background: #1565c0; color: #fff; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 11px; }

.targeting-hint {
  position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
  background: rgba(239,83,80,0.92); color: #fff; padding: 8px 16px; border-radius: 10px;
  z-index: 80; display: flex; align-items: center; gap: 10px; font-weight: 600;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}

/* 拖拽残影 */
.drag-ghost {
  position: fixed; transform: translate(-50%, -50%); pointer-events: none;
  z-index: 70; filter: drop-shadow(0 10px 18px rgba(0,0,0,0.6));
}

/* 死亡幽灵 */
.death-ghost {
  position: fixed; pointer-events: none; z-index: 55;
  border-radius: 12px;
  background: radial-gradient(circle at 50% 40%, rgba(120,20,30,0.7), rgba(0,0,0,0.9));
  border: 2px solid #ef5350;
  animation: dieGhost 0.5s ease forwards;
}
@keyframes dieGhost {
  0% { transform: scale(1); opacity: 0.9; filter: brightness(1.5); }
  100% { transform: scale(0.2) rotate(18deg); opacity: 0; }
}

/* 飘字 */
.float {
  position: fixed; transform: translate(-50%, -50%); pointer-events: none;
  font-size: 26px; font-weight: 800; z-index: 75;
  text-shadow: 0 2px 6px #000; animation: floatUp 0.9s ease-out forwards;
}
.float.damage { color: #ff5252; }
.float.heal { color: #69f0ae; }
@keyframes floatUp {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
  20% { opacity: 1; transform: translate(-50%, -90%) scale(1.2); }
  100% { opacity: 0; transform: translate(-50%, -160%) scale(1); }
}

/* 游戏结束 */
.gameover { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 90; }
.go-panel {
  background: #1c1526; border: 2px solid #ffd54f; border-radius: 16px;
  padding: 30px 50px; text-align: center; display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 0 40px rgba(255,213,79,0.4); animation: pop 0.4s ease;
}
.go-panel.win h2 { color: #ffd54f; }
.go-panel.lose h2 { color: #ef5350; }
@keyframes pop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
