/**
 * 犬夜叉卡牌对战 · 核心引擎
 * 纯函数式状态机，UI 层只负责渲染与派发动作。
 * 本文件仅服务于 pages/game/lushi。
 */
import {
  CARD_POOL,
  TOKENS,
  HEROES,
  getCardById,
  HERO_MAX_HEALTH,
  MAX_MANA,
  MAX_HAND,
  MAX_BOARD,
  TARGET,
} from "./cards.js";

let UID = 1;
export function nextUid() {
  return UID++;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 由卡牌定义创建一个手牌/场上实例 */
export function instantiate(cardId) {
  const def = getCardById(cardId);
  if (!def) return null;
  return {
    uid: nextUid(),
    cardId: def.id,
    name: def.name,
    cost: def.cost,
    type: def.type,
    rarity: def.rarity,
    clan: def.clan,
    text: def.text,
    token: !!def.token,
    attack: def.attack ?? 0,
    health: def.health ?? 0,
    maxHealth: def.health ?? 0,
    durability: def.durability ?? 0,
    keywords: (def.keywords || []).slice(),
    battlecry: def.battlecry || null,
    deathrattle: def.deathrattle || null,
    spell: def.spell || null,
    target: def.target || TARGET.NONE,
    // 场上状态
    canAttack: false,
    attacksThisTurn: 0,
    summonedThisTurn: true,
    silenced: false,
    frozen: false,
    tempAttack: 0,
  };
}

function makePlayer(key, heroId, deckIds, name) {
  const hero = HEROES.find((h) => h.id === heroId) || HEROES[0];
  return {
    key,
    name,
    hero,
    health: HERO_MAX_HEALTH,
    maxHealth: HERO_MAX_HEALTH,
    armor: 0,
    mana: 0,
    maxMana: 0,
    overload: 0,
    deck: shuffle(deckIds).map((id) => instantiate(id)),
    hand: [],
    board: [],
    weapon: null,
    heroAttacksThisTurn: 0,
    heroCanAttack: false,
    powerUsed: false,
    fatigue: 0,
    deaths: 0,
  };
}

export function createGame(opts = {}) {
  const {
    playerHeroId = "hero_inuyasha",
    aiHeroId = "hero_sesshomaru",
    playerDeck = [],
    aiDeckIds = [],
    playerName = "你",
    aiName = "对手",
  } = opts;

  const p = makePlayer("player", playerHeroId, playerDeck, playerName);
  const a = makePlayer("ai", aiHeroId, aiDeckIds, aiName);

  // 先手随机
  const playerFirst = Math.random() < 0.5;

  const g = {
    players: { player: p, ai: a },
    current: playerFirst ? "player" : "ai",
    turn: 1,
    log: [],
    winner: null,
    over: false,
    pendingTarget: null, // { source:'card'|'power', uid, rule }
  };

  // 起手：先手 3 张，后手 4 张 + 幸运币效果简化为额外 1 水晶（此处直接多抽一张）
  drawCards(g, playerFirst ? "player" : "ai", 3);
  drawCards(g, playerFirst ? "ai" : "player", 4);

  pushLog(g, "system", `对战开始！${playerFirst ? p.name : a.name} 先手。`);
  startTurn(g, g.current);
  return g;
}

export function pushLog(g, type, text) {
  g.log.push({ id: nextUid(), type, text });
  if (g.log.length > 200) g.log.shift();
}

export function opponentOf(key) {
  return key === "player" ? "ai" : "player";
}

/* ------------------------------------------------------------------ */
/* 抽牌 / 疲劳                                                          */
/* ------------------------------------------------------------------ */

export function drawCards(g, key, n = 1) {
  const p = g.players[key];
  for (let i = 0; i < n; i++) {
    if (p.deck.length === 0) {
      p.fatigue += 1;
      damageHero(g, key, p.fatigue, "疲劳");
      pushLog(g, key, `${p.name} 牌库耗尽，受到 ${p.fatigue} 点疲劳伤害。`);
      continue;
    }
    const card = p.deck.shift();
    if (p.hand.length >= MAX_HAND) {
      pushLog(g, key, `${p.name} 手牌已满，${card.name} 被烧掉了。`);
      continue;
    }
    p.hand.push(card);
  }
}

/* ------------------------------------------------------------------ */
/* 回合流程                                                             */
/* ------------------------------------------------------------------ */

export function startTurn(g, key) {
  const p = g.players[key];
  p.maxMana = Math.min(MAX_MANA, p.maxMana + 1);
  const locked = Math.min(p.overload, p.maxMana);
  p.mana = p.maxMana - locked;
  p.overload = 0;
  p.powerUsed = false;
  p.heroAttacksThisTurn = 0;
  p.heroCanAttack = !!p.weapon && p.weapon.durability > 0;

  for (const m of p.board) {
    m.attacksThisTurn = 0;
    m.summonedThisTurn = false;
    m.canAttack = !m.frozen;
    m.frozen = false;
  }
  drawCards(g, key, 1);
  pushLog(g, "system", `—— ${p.name} 的回合（${p.mana}/${p.maxMana} 水晶）——`);
  checkGameOver(g);
}

export function endTurn(g) {
  if (g.over) return g;
  const key = g.current;
  const p = g.players[key];
  // 清理本回合临时增益
  for (const m of p.board) {
    if (m.tempAttack) {
      m.attack -= m.tempAttack;
      m.tempAttack = 0;
    }
  }
  g.pendingTarget = null;
  const next = opponentOf(key);
  g.current = next;
  if (next === "player") g.turn += 1;
  startTurn(g, next);
  return g;
}

/* ------------------------------------------------------------------ */
/* 伤害 / 治疗                                                          */
/* ------------------------------------------------------------------ */

export function damageHero(g, key, amount, _source) {
  if (amount <= 0) return 0;
  const p = g.players[key];
  let remain = amount;
  if (p.armor > 0) {
    const used = Math.min(p.armor, remain);
    p.armor -= used;
    remain -= used;
  }
  p.health -= remain;
  return amount;
}

export function healHero(g, key, amount) {
  const p = g.players[key];
  const before = p.health;
  p.health = Math.min(p.maxHealth, p.health + amount);
  return p.health - before;
}

/** 对一个角色（英雄或随从）造成伤害 */
export function damageCharacter(g, target, amount, opts = {}) {
  if (!target || amount <= 0) return 0;
  if (target.kind === "hero") {
    damageHero(g, target.owner, amount);
    pushLog(g, target.owner, `${g.players[target.owner].name} 受到 ${amount} 点伤害。`);
    return amount;
  }
  const m = target.minion;
  if (!m || m.dead) return 0;
  if (m.keywords.includes("divineShield")) {
    m.keywords = m.keywords.filter((k) => k !== "divineShield");
    pushLog(g, "system", `${m.name} 的圣盾被打破。`);
    return 0;
  }
  m.health -= amount;
  if (opts.poison) m.poisoned = true;
  pushLog(g, "system", `${m.name} 受到 ${amount} 点伤害（剩余 ${Math.max(0, m.health)}）。`);
  return amount;
}

export function healCharacter(g, target, amount) {
  if (!target || amount <= 0) return 0;
  if (target.kind === "hero") {
    const healed = healHero(g, target.owner, amount);
    if (healed > 0) pushLog(g, target.owner, `${g.players[target.owner].name} 恢复 ${healed} 点生命。`);
    return healed;
  }
  const m = target.minion;
  if (!m || m.dead) return 0;
  const before = m.health;
  m.health = Math.min(m.maxHealth, m.health + amount);
  const healed = m.health - before;
  if (healed > 0) pushLog(g, "system", `${m.name} 恢复 ${healed} 点生命。`);
  return healed;
}

/* ------------------------------------------------------------------ */
/* 死亡结算                                                             */
/* ------------------------------------------------------------------ */

export function cleanupDeaths(g) {
  let loop = 0;
  while (loop++ < 10) {
    const dying = [];
    for (const key of ["player", "ai"]) {
      const p = g.players[key];
      for (const m of p.board) {
        if (m.health <= 0 || m.poisoned) dying.push({ key, minion: m });
      }
    }
    if (dying.length === 0) break;
    for (const d of dying) {
      const p = g.players[d.key];
      const idx = p.board.indexOf(d.minion);
      if (idx === -1) continue;
      p.board.splice(idx, 1);
      p.deaths += 1;
      d.minion.dead = true;
      pushLog(g, d.key, `${d.minion.name} 阵亡。`);
      if (d.minion.deathrattle && !d.minion.silenced) {
        resolveEffect(g, d.key, d.minion.deathrattle, null, d.minion);
      }
    }
  }
  checkGameOver(g);
}

export function checkGameOver(g) {
  const pDead = g.players.player.health <= 0;
  const aDead = g.players.ai.health <= 0;
  if (!pDead && !aDead) return;
  g.over = true;
  if (pDead && aDead) g.winner = "draw";
  else if (pDead) g.winner = "ai";
  else g.winner = "player";
  pushLog(
    g,
    "system",
    g.winner === "draw" ? "平局！" : `${g.players[g.winner].name} 获得胜利！`
  );
}

/* ------------------------------------------------------------------ */
/* 目标工具                                                             */
/* ------------------------------------------------------------------ */

export function heroTarget(key) {
  return { kind: "hero", owner: key };
}
export function minionTarget(key, minion) {
  return { kind: "minion", owner: key, minion };
}

export function hasTaunt(p) {
  return p.board.some((m) => m.keywords.includes("taunt") && !m.keywords.includes("stealth"));
}

/** 校验一次攻击是否合法 */
export function canAttackTarget(g, attackerKey, attacker, target) {
  if (g.over) return false;
  const enemyKey = opponentOf(attackerKey);
  if (target.owner !== enemyKey) return false;
  const enemy = g.players[enemyKey];
  if (target.kind === "minion" && target.minion.keywords.includes("stealth")) return false;
  if (hasTaunt(enemy)) {
    if (target.kind !== "minion" || !target.minion.keywords.includes("taunt")) return false;
  }
  if (attacker.kind === "hero") {
    const p = g.players[attackerKey];
    return !!p.weapon && p.weapon.durability > 0 && p.heroAttacksThisTurn < 1 && attackValueOf(p) > 0;
  }
  const m = attacker.minion;
  if (m.frozen) return false;
  if (m.attack <= 0) return false;
  const maxAttacks = m.keywords.includes("windfury") ? 2 : 1;
  if (m.attacksThisTurn >= maxAttacks) return false;
  if (m.summonedThisTurn && !m.keywords.includes("charge") && !m.keywords.includes("rush")) return false;
  if (m.summonedThisTurn && m.keywords.includes("rush") && !m.keywords.includes("charge") && target.kind === "hero")
    return false;
  return true;
}

export function attackValueOf(p) {
  return (p.weapon ? p.weapon.attack : 0) + (p.heroTempAttack || 0);
}

/** 获取某方所有可攻击的己方角色 */
export function attackersOf(g, key) {
  const p = g.players[key];
  const list = p.board
    .filter((m) => {
      const maxAttacks = m.keywords.includes("windfury") ? 2 : 1;
      if (m.attack <= 0 || m.frozen) return false;
      if (m.attacksThisTurn >= maxAttacks) return false;
      if (m.summonedThisTurn && !m.keywords.includes("charge") && !m.keywords.includes("rush")) return false;
      return true;
    })
    .map((m) => minionTarget(key, m));
  if (p.weapon && p.weapon.durability > 0 && p.heroAttacksThisTurn < 1 && attackValueOf(p) > 0) {
    list.push(heroTarget(key));
  }
  return list;
}

/* ------------------------------------------------------------------ */
/* 攻击结算                                                             */
/* ------------------------------------------------------------------ */

export function performAttack(g, attackerKey, attacker, target) {
  if (!canAttackTarget(g, attackerKey, attacker, target)) return false;
  const p = g.players[attackerKey];
  const atkName = attacker.kind === "hero" ? p.hero.name : attacker.minion.name;
  const defName = target.kind === "hero" ? g.players[target.owner].hero.name : target.minion.name;
  const atkValue = attacker.kind === "hero" ? attackValueOf(p) : attacker.minion.attack;
  const defValue = target.kind === "hero" ? 0 : target.minion.attack;
  const atkPoison = attacker.kind === "minion" && attacker.minion.keywords.includes("poison");
  const defPoison = target.kind === "minion" && target.minion.keywords.includes("poison");
  const atkLifesteal = attacker.kind === "minion" && attacker.minion.keywords.includes("lifesteal");

  pushLog(g, attackerKey, `${atkName} 攻击 ${defName}。`);

  // 潜行在攻击后失效
  if (attacker.kind === "minion") {
    attacker.minion.keywords = attacker.minion.keywords.filter((k) => k !== "stealth");
    attacker.minion.attacksThisTurn += 1;
  } else {
    p.heroAttacksThisTurn += 1;
  }

  const dealt = damageCharacter(g, target, atkValue, { poison: atkPoison && target.kind === "minion" });
  if (atkLifesteal && dealt > 0) healHero(g, attackerKey, dealt);

  if (defValue > 0) {
    const back =
      attacker.kind === "hero" ? heroTarget(attackerKey) : minionTarget(attackerKey, attacker.minion);
    damageCharacter(g, back, defValue, { poison: defPoison && attacker.kind === "minion" });
    if (target.kind === "minion" && target.minion.keywords.includes("lifesteal")) {
      healHero(g, target.owner, defValue);
    }
  }

  // 武器耐久
  if (attacker.kind === "hero" && p.weapon) {
    p.weapon.durability -= 1;
    if (p.weapon.durability <= 0) {
      pushLog(g, attackerKey, `${p.weapon.name} 破损了。`);
      p.weapon = null;
      p.heroCanAttack = false;
    }
  }

  cleanupDeaths(g);
  return true;
}

/* ------------------------------------------------------------------ */
/* 出牌                                                                 */
/* ------------------------------------------------------------------ */

/** 该卡是否需要玩家指定目标 */
export function cardNeedsTarget(g, key, card) {
  const rule = card.target || TARGET.NONE;
  if (rule === TARGET.NONE) return false;
  return legalTargets(g, key, rule).length > 0;
}

export function legalTargets(g, key, rule) {
  const me = g.players[key];
  const foeKey = opponentOf(key);
  const foe = g.players[foeKey];
  const visible = (m) => !m.keywords.includes("stealth");
  const out = [];
  switch (rule) {
    case TARGET.ANY:
      out.push(heroTarget(key), heroTarget(foeKey));
      me.board.forEach((m) => out.push(minionTarget(key, m)));
      foe.board.filter(visible).forEach((m) => out.push(minionTarget(foeKey, m)));
      break;
    case TARGET.ANY_MINION:
      me.board.forEach((m) => out.push(minionTarget(key, m)));
      foe.board.filter(visible).forEach((m) => out.push(minionTarget(foeKey, m)));
      break;
    case TARGET.ENEMY:
      out.push(heroTarget(foeKey));
      foe.board.filter(visible).forEach((m) => out.push(minionTarget(foeKey, m)));
      break;
    case TARGET.ENEMY_MINION:
      foe.board.filter(visible).forEach((m) => out.push(minionTarget(foeKey, m)));
      break;
    case TARGET.FRIENDLY_MINION:
      me.board.forEach((m) => out.push(minionTarget(key, m)));
      break;
    default:
      break;
  }
  return out;
}

/**
 * 打出手牌
 * @param position 随从入场位置（可选）
 * @param target   目标（可选）
 */
export function playCard(g, key, uid, { target = null, position = null } = {}) {
  if (g.over || g.current !== key) return { ok: false, reason: "现在不是你的回合" };
  const p = g.players[key];
  const idx = p.hand.findIndex((c) => c.uid === uid);
  if (idx === -1) return { ok: false, reason: "手牌不存在" };
  const card = p.hand[idx];
  if (card.cost > p.mana) return { ok: false, reason: "水晶不足" };
  if (card.type === "minion" && p.board.length >= MAX_BOARD) return { ok: false, reason: "战场已满" };

  p.hand.splice(idx, 1);
  p.mana -= card.cost;
  pushLog(g, key, `${p.name} 使用了 ${card.name}。`);

  if (card.type === "minion") {
    card.summonedThisTurn = true;
    card.attacksThisTurn = 0;
    const pos = position == null ? p.board.length : Math.max(0, Math.min(position, p.board.length));
    p.board.splice(pos, 0, card);
    if (card.battlecry) resolveEffect(g, key, card.battlecry, target, card);
  } else if (card.type === "weapon") {
    p.weapon = { name: card.name, attack: card.attack, durability: card.durability };
    p.heroCanAttack = true;
    p.heroAttacksThisTurn = 0;
    pushLog(g, key, `${p.name} 装备了 ${card.name}（${card.attack}/${card.durability}）。`);
  } else if (card.type === "spell") {
    if (card.spell) resolveEffect(g, key, card.spell, target, card);
  }

  cleanupDeaths(g);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* 英雄技能                                                             */
/* ------------------------------------------------------------------ */

export function powerNeedsTarget(g, key) {
  const p = g.players[key];
  const rule = p.hero.power.target || TARGET.NONE;
  if (rule === TARGET.NONE) return false;
  return legalTargets(g, key, rule).length > 0;
}

export function useHeroPower(g, key, target = null) {
  if (g.over || g.current !== key) return { ok: false, reason: "现在不是你的回合" };
  const p = g.players[key];
  const power = p.hero.power;
  if (p.powerUsed) return { ok: false, reason: "本回合已使用" };
  if (p.mana < power.cost) return { ok: false, reason: "水晶不足" };
  p.mana -= power.cost;
  p.powerUsed = true;
  pushLog(g, key, `${p.name} 发动【${power.name}】。`);
  const foeKey = opponentOf(key);

  switch (power.kind) {
    case "windScar": {
      damageCharacter(g, heroTarget(foeKey), 1);
      const buffTarget = p.board.find((m) => !m.silenced) || p.board[0];
      if (buffTarget) {
        buffTarget.attack += 1;
        pushLog(g, key, `${buffTarget.name} 获得 +1 攻击力。`);
      }
      break;
    }
    case "sacredArrow": {
      if (!target) {
        p.mana += power.cost;
        p.powerUsed = false;
        return { ok: false, reason: "需要目标" };
      }
      damageCharacter(g, target, target.kind === "minion" ? 2 : 1);
      break;
    }
    case "tenseiga": {
      if (!target) {
        p.mana += power.cost;
        p.powerUsed = false;
        return { ok: false, reason: "需要目标" };
      }
      healCharacter(g, target, 3);
      break;
    }
    case "windTunnel": {
      drawCards(g, key, 1);
      damageCharacter(g, heroTarget(key), 1);
      break;
    }
    default:
      break;
  }
  cleanupDeaths(g);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* 效果解析                                                             */
/* ------------------------------------------------------------------ */

export function resolveEffect(g, key, effect, target, source) {
  if (!effect) return;
  const p = g.players[key];
  const foeKey = opponentOf(key);
  const foe = g.players[foeKey];

  switch (effect.kind) {
    case "draw":
      drawCards(g, key, effect.amount || 1);
      break;

    case "damage":
      if (target) damageCharacter(g, target, effect.amount);
      break;

    case "damageSelfHero":
      damageCharacter(g, heroTarget(key), effect.amount);
      break;

    case "damageAllOthers": {
      const all = [];
      p.board.forEach((m) => m !== source && all.push(minionTarget(key, m)));
      foe.board.forEach((m) => all.push(minionTarget(foeKey, m)));
      all.push(heroTarget(key), heroTarget(foeKey));
      all.forEach((t) => damageCharacter(g, t, effect.amount));
      break;
    }

    case "aoe": {
      const side = effect.side === "enemy" ? foe : p;
      const sideKey = effect.side === "enemy" ? foeKey : key;
      side.board.slice().forEach((m) => damageCharacter(g, minionTarget(sideKey, m), effect.amount));
      break;
    }

    case "destroy":
      if (target && target.kind === "minion") {
        target.minion.health = 0;
        pushLog(g, "system", `${target.minion.name} 被消灭。`);
      }
      break;

    case "destroyAll": {
      const side = effect.side === "enemy" ? foe : p;
      side.board.slice().forEach((m) => {
        m.health = 0;
      });
      pushLog(g, "system", "战场被冥道吞噬！");
      break;
    }

    case "heal":
      if (target) healCharacter(g, target, effect.amount);
      break;

    case "healHero":
      healHero(g, key, effect.amount);
      pushLog(g, key, `${p.name} 恢复 ${effect.amount} 点生命。`);
      break;

    case "healAllFriendly": {
      healCharacter(g, heroTarget(key), effect.amount);
      p.board.forEach((m) => healCharacter(g, minionTarget(key, m), effect.amount));
      break;
    }

    case "buff":
      if (target && target.kind === "minion") {
        target.minion.attack += effect.attack || 0;
        target.minion.maxHealth += effect.health || 0;
        target.minion.health += effect.health || 0;
        pushLog(g, key, `${target.minion.name} 获得 +${effect.attack || 0}/+${effect.health || 0}。`);
      }
      break;

    case "selfBuff":
      if (source) {
        source.attack += effect.attack || 0;
        source.tempAttack = (source.tempAttack || 0) + (effect.attack || 0);
        source.maxHealth += effect.health || 0;
        source.health += effect.health || 0;
      }
      break;

    case "buffAllFriendly":
      p.board.forEach((m) => {
        if (m === source) return;
        m.attack += effect.attack || 0;
        m.maxHealth += effect.health || 0;
        m.health += effect.health || 0;
      });
      pushLog(g, key, `友方随从获得 +${effect.attack || 0}/+${effect.health || 0}。`);
      break;

    case "buffPerDeath":
      if (source) {
        const n = p.deaths;
        source.attack += n;
        source.maxHealth += n;
        source.health += n;
        pushLog(g, key, `${source.name} 吸收了 ${n} 个亡魂，获得 +${n}/+${n}。`);
      }
      break;

    case "grantKeywords":
      if (target && target.kind === "minion") {
        for (const k of effect.keywords || []) {
          if (!target.minion.keywords.includes(k)) target.minion.keywords.push(k);
        }
        pushLog(g, key, `${target.minion.name} 得到结界守护。`);
      }
      break;

    case "silence":
      if (target && target.kind === "minion") {
        const m = target.minion;
        m.keywords = [];
        m.deathrattle = null;
        m.battlecry = null;
        m.silenced = true;
        const def = getCardById(m.cardId);
        if (def) {
          m.attack = def.attack ?? m.attack;
          m.maxHealth = def.health ?? m.maxHealth;
          m.health = Math.min(m.health, m.maxHealth);
        }
        pushLog(g, key, `${m.name} 被神无的魔镜沉默。`);
      }
      break;

    case "summon": {
      const count = effect.count || 1;
      for (let i = 0; i < count; i++) {
        if (p.board.length >= MAX_BOARD) break;
        const tok = instantiate(effect.token);
        if (!tok) break;
        tok.summonedThisTurn = true;
        p.board.push(tok);
      }
      pushLog(g, key, `召唤了 ${TOKENS[effect.token]?.name || "衍生物"} ×${count}。`);
      break;
    }

    default:
      break;
  }
}

/* ------------------------------------------------------------------ */
/* 牌组校验                                                             */
/* ------------------------------------------------------------------ */

export function validateDeck(deckIds, size, maxCopies) {
  const counts = {};
  for (const id of deckIds) counts[id] = (counts[id] || 0) + 1;
  const errors = [];
  if (deckIds.length !== size) errors.push(`牌组需要 ${size} 张卡，当前 ${deckIds.length} 张。`);
  for (const [id, n] of Object.entries(counts)) {
    const def = getCardById(id);
    const limit = def && def.rarity === "legendary" ? 1 : maxCopies;
    if (n > limit) errors.push(`${def ? def.name : id} 超出上限（最多 ${limit} 张）。`);
  }
  return errors;
}

export function randomDeck(size) {
  const pool = CARD_POOL.filter((c) => !c.token);
  const deck = [];
  const counts = {};
  let guard = 0;
  while (deck.length < size && guard++ < 2000) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    const limit = c.rarity === "legendary" ? 1 : 2;
    if ((counts[c.id] || 0) >= limit) continue;
    counts[c.id] = (counts[c.id] || 0) + 1;
    deck.push(c.id);
  }
  return deck;
}
