/**
 * 犬夜叉卡牌对战 · AI 对手
 * 采用「贪心评分 + 逐步决策」策略：每次只决定下一个动作，
 * 由 UI 层按间隔驱动，形成可观察的出牌节奏。
 * 本文件仅服务于 pages/game/lushi。
 */
import { TARGET, MAX_BOARD } from "./cards.js";
import {
  legalTargets,
  playCard,
  useHeroPower,
  performAttack,
  endTurn,
  attackersOf,
  canAttackTarget,
  heroTarget,
  minionTarget,
  opponentOf,
  hasTaunt,
  attackValueOf,
  powerNeedsTarget,
} from "./engine.js";

const ME = "ai";

/** 随从威胁度评分 */
function threat(m) {
  let s = m.attack * 2 + m.health;
  if (m.keywords.includes("taunt")) s += 2;
  if (m.keywords.includes("divineShield")) s += 3;
  if (m.keywords.includes("windfury")) s += m.attack;
  if (m.keywords.includes("poison")) s += 4;
  if (m.keywords.includes("lifesteal")) s += 2;
  return s;
}

/** 为需要目标的效果挑选最优目标 */
function pickTarget(g, rule, effectKind) {
  const options = legalTargets(g, ME, rule);
  if (options.length === 0) return null;
  const beneficial = ["heal", "buff", "grantKeywords"].includes(effectKind);

  const scored = options.map((t) => {
    let s = 0;
    if (t.kind === "hero") {
      const me = t.owner === ME;
      if (beneficial) s = me ? (g.players[ME].maxHealth - g.players[ME].health) * 2 : -100;
      else s = me ? -100 : 30;
    } else {
      const mine = t.owner === ME;
      if (beneficial) s = mine ? threat(t.minion) : -100;
      else s = mine ? -100 : threat(t.minion);
    }
    return { t, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored[0].s <= -100 ? null : scored[0].t;
}

/** 手牌打出价值评分 */
function cardScore(g, card) {
  const me = g.players[ME];
  const foe = g.players[opponentOf(ME)];
  let s = 0;
  if (card.type === "minion") {
    if (me.board.length >= MAX_BOARD) return -Infinity;
    s = card.attack * 2 + card.health * 1.5 + card.keywords.length * 2;
    if (card.keywords.includes("taunt") && foe.board.length > 1) s += 4;
    if (card.keywords.includes("charge") || card.keywords.includes("rush")) s += 3;
  } else if (card.type === "weapon") {
    s = me.weapon ? 1 : card.attack * card.durability * 1.5;
  } else if (card.type === "spell") {
    const k = card.spell?.kind;
    if (k === "aoe" || k === "destroyAll") {
      s = foe.board.length >= 2 ? 10 + foe.board.length * 5 : -5;
    } else if (k === "destroy") {
      const best = foe.board.length ? Math.max(...foe.board.map(threat)) : 0;
      s = best >= 8 ? best : -3;
    } else if (k === "damage") {
      s = foe.board.length ? 8 : 4;
    } else if (k === "summon") {
      s = me.board.length <= 4 ? 12 : -5;
    } else if (k === "buff" || k === "grantKeywords") {
      s = me.board.length ? 7 : -Infinity;
    } else {
      s = 6;
    }
  }
  // 尽量吃满水晶
  s += card.cost * 0.6;
  return s;
}

/** 决定下一步动作。返回 true 表示执行了一个动作，false 表示无事可做。 */
export function aiStep(g) {
  if (g.over || g.current !== ME) return false;
  const me = g.players[ME];
  const foeKey = opponentOf(ME);
  const foe = g.players[foeKey];

  // 1) 检查斩杀线：能一波带走就直接打脸
  if (!hasTaunt(foe)) {
    const total =
      attackersOf(g, ME).reduce((sum, a) => {
        if (a.kind === "hero") return sum + attackValueOf(me);
        const m = a.minion;
        if (m.summonedThisTurn && m.keywords.includes("rush") && !m.keywords.includes("charge")) return sum;
        const times = m.keywords.includes("windfury") ? 2 - m.attacksThisTurn : 1 - m.attacksThisTurn;
        return sum + m.attack * Math.max(0, times);
      }, 0);
    if (total >= foe.health + foe.armor) {
      const lethal = nextAttack(g, true);
      if (lethal) return true;
    }
  }

  // 2) 出牌：按评分从高到低尝试，直到成功打出一张
  const playable = me.hand
    .filter((c) => c.cost <= me.mana)
    .map((c) => ({ c, s: cardScore(g, c) }))
    .filter((x) => x.s > -Infinity)
    .sort((a, b) => b.s - a.s);

  for (const { c } of playable) {
    const rule = c.target || TARGET.NONE;
    let target = null;
    if (rule !== TARGET.NONE) {
      const kind = c.type === "spell" ? c.spell?.kind : c.battlecry?.kind;
      target = pickTarget(g, rule, kind);
      // 法术必须有合法目标才值得打出；随从没有目标也能入场（放弃战吼）
      if (!target && c.type === "spell") continue;
    }
    const res = playCard(g, ME, c.uid, { target });
    if (res && res.ok) return true;
  }

  // 3) 攻击
  if (nextAttack(g, false)) return true;

  // 4) 英雄技能
  const power = me.hero.power;
  if (!me.powerUsed && me.mana >= power.cost) {
    if (power.kind === "windTunnel" && me.health <= 6) {
      // 血量过低时不自伤抽牌
    } else if (powerNeedsTarget(g, ME)) {
      const kind = power.kind === "tenseiga" ? "heal" : "damage";
      const t = pickTarget(g, power.target, kind);
      if (t) {
        useHeroPower(g, ME, t);
        return true;
      }
    } else {
      useHeroPower(g, ME);
      return true;
    }
  }

  return false;
}

/** 选择并执行一次最优攻击 */
function nextAttack(g, faceOnly) {
  const me = g.players[ME];
  const foeKey = opponentOf(ME);
  const foe = g.players[foeKey];
  const attackers = attackersOf(g, ME);
  if (attackers.length === 0) return false;

  const targets = [];
  targets.push(heroTarget(foeKey));
  foe.board.forEach((m) => targets.push(minionTarget(foeKey, m)));

  let best = null;
  for (const a of attackers) {
    const atkValue = a.kind === "hero" ? attackValueOf(me) : a.minion.attack;
    for (const t of targets) {
      if (!canAttackTarget(g, ME, a, t)) continue;
      let s;
      if (t.kind === "hero") {
        s = faceOnly ? 1000 : atkValue * 2.2;
      } else {
        if (faceOnly) continue;
        const d = t.minion;
        const kills = atkValue >= d.health && !d.keywords.includes("divineShield");
        const survives = a.kind === "hero" ? true : d.attack < a.minion.health;
        s = threat(d) * (kills ? 1.6 : 0.5);
        if (kills && survives) s += 8;
        if (!kills && !survives) s -= 10;
        if (a.kind === "hero" && d.attack > 0) s -= d.attack * 1.5;
        if (a.kind === "minion" && a.minion.keywords.includes("poison") && d.health > 3) s += 10;
      }
      if (!best || s > best.s) best = { a, t, s };
    }
  }
  if (!best) return false;
  if (!faceOnly && best.s <= 0) return false;
  return performAttack(g, ME, best.a, best.t);
}

/** 让 AI 走完整个回合（由 UI 分步调用，返回是否还有后续动作） */
export function aiTakeTurn(g) {
  const acted = aiStep(g);
  if (!acted && !g.over && g.current === ME) {
    endTurn(g);
    return false;
  }
  return acted;
}
