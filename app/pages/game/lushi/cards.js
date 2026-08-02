/**
 * 犬夜叉主题 · 类炉石卡牌数据
 * 本文件仅服务于 pages/game/lushi 游戏，不对外部目录产生依赖。
 *
 * 卡牌字段说明：
 *  id        唯一标识
 *  name      卡牌名
 *  art       插画路径（public/game/ 下），缺失时回退文字
 *  cost      法力消耗
 *  type      'minion' 随从 | 'spell' 法术 | 'weapon' 武器
 *  attack    攻击力（随从/武器）
 *  health    生命值（随从）
 *  durability武器耐久
 *  rarity    'common' | 'rare' | 'epic' | 'legendary'
 *  clan      族群（妖怪/巫女/半妖/人类/神器）
 *  text      卡牌描述
 *  keywords  关键词数组：taunt 嘲讽 / charge 冲锋 / divineShield 圣盾 /
 *            windfury 风怒 / stealth 潜行 / lifesteal 吸血 / poison 剧毒 / rush 突袭
 *  battlecry 战吼 { kind, ... }
 *  deathrattle 亡语 { kind, ... }
 *  spell     法术效果 { kind, ... }
 *  target    需要指定目标时的目标规则
 */

export const HERO_MAX_HEALTH = 30;
export const MAX_MANA = 10;
export const MAX_HAND = 10;
export const MAX_BOARD = 7;
export const DECK_SIZE = 30;
export const MAX_COPIES = 2;
export const FATIGUE_START = 1;

/** 图片根目录（public 下，运行时通过 baseURL 拼接） */
export const ART_BASE = "/game/";

/** 目标规则常量 */
export const TARGET = {
  NONE: "none",
  ANY: "any", // 任意角色（英雄 + 随从）
  ANY_MINION: "anyMinion",
  ENEMY: "enemy", // 敌方角色
  ENEMY_MINION: "enemyMinion",
  FRIENDLY_MINION: "friendlyMinion",
};

/** 英雄职业（对应炉石职业） */
export const HEROES = [
  {
    id: "hero_inuyasha",
    name: "犬夜叉",
    title: "半妖 · 铁碎牙",
    desc: "以铁碎牙的力量硬撼一切，越是绝境越是强大。",
    color: "#c62828",
    art: "inuyasha.png",
    power: {
      name: "风之伤",
      cost: 2,
      text: "对敌方英雄造成 1 点伤害，并使你的一个随从获得 +1 攻击力。",
      kind: "windScar",
    },
  },
  {
    id: "hero_kagome",
    name: "日暮戈薇",
    title: "巫女 · 破魔之矢",
    desc: "破魔之矢净化一切妖气，也守护同伴的生命。",
    color: "#e91e63",
    art: "kagome.png",
    power: {
      name: "破魔之矢",
      cost: 2,
      text: "造成 1 点伤害；若目标是随从则改为 2 点。",
      kind: "sacredArrow",
      target: TARGET.ANY,
    },
  },
  {
    id: "hero_sesshomaru",
    name: "杀生丸",
    title: "大妖怪 · 天生牙",
    desc: "冷酷的大妖，天生牙可救人，斗鬼神能焚尽万物。",
    color: "#5c6bc0",
    art: "sesshomaru.png",
    power: {
      name: "天生牙",
      cost: 2,
      text: "恢复一个友方角色 3 点生命值。",
      kind: "tenseiga",
      target: TARGET.ANY,
    },
  },
  {
    id: "hero_miroku",
    name: "弥勒",
    title: "法师 · 风穴",
    desc: "以风穴吞噬敌人，以符咒扭转战局。",
    color: "#7b1fa2",
    art: "miroku.png",
    power: {
      name: "风穴",
      cost: 2,
      text: "抽一张牌，并对自身英雄造成 1 点伤害。",
      kind: "windTunnel",
    },
  },
];

/** 卡池：所有玩家可用卡牌 */
export const CARD_POOL = [
  // ============ 1 费 ============
  {
    id: "c_myouga",
    name: "冥加爷爷",
    cost: 1,
    type: "minion",
    attack: 1,
    health: 1,
    rarity: "common",
    clan: "妖怪",
    art: "myoga.png",
    text: "战吼：抽一张牌。",
    keywords: [],
    battlecry: { kind: "draw", amount: 1 },
  },
  {
    id: "c_shippo",
    name: "七宝",
    cost: 1,
    type: "minion",
    attack: 1,
    health: 2,
    rarity: "common",
    clan: "妖怪",
    art: "shippo.png",
    text: "战吼：使一个友方随从获得 +1 生命值。",
    keywords: [],
    battlecry: { kind: "buff", attack: 0, health: 1, target: TARGET.FRIENDLY_MINION },
    target: TARGET.FRIENDLY_MINION,
  },
  {
    id: "c_soul_collector",
    name: "死魂虫",
    cost: 1,
    type: "minion",
    attack: 1,
    health: 1,
    rarity: "common",
    clan: "妖怪",
    art: "kanna.png",
    text: "潜行。亡语：恢复你的英雄 2 点生命值。",
    keywords: ["stealth"],
    deathrattle: { kind: "healHero", amount: 2 },
  },
  {
    id: "c_jaken",
    name: "邪见",
    cost: 1,
    type: "minion",
    attack: 1,
    health: 3,
    rarity: "common",
    clan: "妖怪",
    art: "jaken.png",
    text: "嘲讽。",
    keywords: ["taunt"],
  },
  {
    id: "c_purify",
    name: "净化符咒",
    cost: 1,
    type: "spell",
    rarity: "common",
    clan: "巫女",
    art: "purifying_arrow.png",
    text: "对一个随从造成 2 点伤害。",
    spell: { kind: "damage", amount: 2 },
    target: TARGET.ANY_MINION,
  },

  // ============ 2 费 ============
  {
    id: "c_kirara",
    name: "云母",
    cost: 2,
    type: "minion",
    attack: 2,
    health: 2,
    rarity: "common",
    clan: "妖怪",
    art: "kirara.png",
    text: "突袭。",
    keywords: ["rush"],
  },
  {
    id: "c_kohaku",
    name: "琥珀",
    cost: 2,
    type: "minion",
    attack: 2,
    health: 3,
    rarity: "rare",
    clan: "人类",
    art: "kohaku.png",
    text: "亡语：为你的英雄恢复 3 点生命值（鬼蜘蛛的碎片）。",
    keywords: [],
    deathrattle: { kind: "healHero", amount: 3 },
  },
  {
    id: "c_kaede",
    name: "枫婆婆",
    cost: 2,
    type: "minion",
    attack: 1,
    health: 4,
    rarity: "common",
    clan: "巫女",
    art: "kaede.png",
    text: "嘲讽。战吼：恢复一个友方角色 2 点生命值。",
    keywords: ["taunt"],
    battlecry: { kind: "heal", amount: 2, target: TARGET.ANY },
    target: TARGET.ANY,
  },
  {
    id: "c_hiraikotsu",
    name: "飞来骨",
    cost: 2,
    type: "weapon",
    attack: 2,
    durability: 2,
    rarity: "rare",
    clan: "神器",
    art: "hiraikotsu.png",
    text: "装备后，你的英雄可以进行攻击。",
  },
  {
    id: "c_sacred_arrow",
    name: "破魔之矢",
    cost: 2,
    type: "spell",
    rarity: "common",
    clan: "巫女",
    art: "purifying_arrow.png",
    text: "造成 3 点伤害。",
    spell: { kind: "damage", amount: 3 },
    target: TARGET.ANY,
  },
  {
    id: "c_shikon_shard",
    name: "四魂之玉碎片",
    cost: 2,
    type: "spell",
    rarity: "rare",
    clan: "神器",
    art: "shikon.png",
    text: "使一个随从获得 +2/+2。",
    spell: { kind: "buff", attack: 2, health: 2 },
    target: TARGET.ANY_MINION,
  },

  // ============ 3 费 ============
  {
    id: "c_miroku_monk",
    name: "法师弥勒",
    cost: 3,
    type: "minion",
    attack: 2,
    health: 4,
    rarity: "rare",
    clan: "人类",
    art: "miroku.png",
    text: "战吼：抽一张牌。",
    keywords: [],
    battlecry: { kind: "draw", amount: 1 },
  },
  {
    id: "c_sango",
    name: "退治屋珊瑚",
    cost: 3,
    type: "minion",
    attack: 3,
    health: 3,
    rarity: "rare",
    clan: "人类",
    art: "sango.png",
    text: "战吼：对一个敌方随从造成 2 点伤害。",
    keywords: [],
    battlecry: { kind: "damage", amount: 2, target: TARGET.ENEMY_MINION },
    target: TARGET.ENEMY_MINION,
  },
  {
    id: "c_kagura",
    name: "神乐",
    cost: 3,
    type: "minion",
    attack: 3,
    health: 2,
    rarity: "epic",
    clan: "妖怪",
    art: "kagura.png",
    text: "冲锋。",
    keywords: ["charge"],
  },
  {
    id: "c_thunder_hiten",
    name: "雷兽兄弟 · 飞天",
    cost: 3,
    type: "minion",
    attack: 2,
    health: 3,
    rarity: "rare",
    clan: "妖怪",
    art: "wind_tunnel.png",
    text: "风怒。",
    keywords: ["windfury"],
  },
  {
    id: "c_dragon_scaled",
    name: "龙鳞之铁碎牙",
    cost: 3,
    type: "weapon",
    attack: 3,
    durability: 2,
    rarity: "epic",
    clan: "神器",
    art: "dragon_scale.png",
    text: "装备后，你的英雄可以进行攻击。",
  },
  {
    id: "c_shrine_barrier",
    name: "结界札",
    cost: 3,
    type: "spell",
    rarity: "common",
    clan: "巫女",
    art: "barrier.png",
    text: "使一个友方随从获得圣盾与嘲讽。",
    spell: { kind: "grantKeywords", keywords: ["divineShield", "taunt"] },
    target: TARGET.FRIENDLY_MINION,
  },

  // ============ 4 费 ============
  {
    id: "c_kikyo",
    name: "巫女桔梗",
    cost: 4,
    type: "minion",
    attack: 3,
    health: 4,
    rarity: "legendary",
    clan: "巫女",
    art: "kikyo.png",
    text: "战吼：恢复所有友方角色 2 点生命值。",
    keywords: [],
    battlecry: { kind: "healAllFriendly", amount: 2 },
  },
  {
    id: "c_koga",
    name: "狼妖钢牙",
    cost: 4,
    type: "minion",
    attack: 4,
    health: 3,
    rarity: "epic",
    clan: "妖怪",
    art: "ginga.png",
    text: "冲锋。战吼：本回合他获得 +1 攻击力。",
    keywords: ["charge"],
    battlecry: { kind: "selfBuff", attack: 1, health: 0 },
  },
  {
    id: "c_inuyasha",
    name: "半妖犬夜叉",
    cost: 4,
    type: "minion",
    attack: 4,
    health: 4,
    rarity: "legendary",
    clan: "半妖",
    art: "inuyasha.png",
    text: "突袭。亡语：抽一张牌。",
    keywords: ["rush"],
    deathrattle: { kind: "draw", amount: 1 },
  },
  {
    id: "c_wind_scar",
    name: "风之伤",
    cost: 4,
    type: "spell",
    rarity: "epic",
    clan: "神器",
    art: "windscar.png",
    text: "对所有敌方随从造成 3 点伤害。",
    spell: { kind: "aoe", amount: 3, side: "enemy" },
  },
  {
    id: "c_wolf_pack",
    name: "狼妖群",
    cost: 4,
    type: "spell",
    rarity: "common",
    clan: "妖怪",
    art: "ginga.png",
    text: "召唤三个 2/2 的狼妖。",
    spell: { kind: "summon", token: "t_wolf", count: 3 },
  },
  {
    id: "c_totosai",
    name: "刀刀斋",
    cost: 4,
    type: "minion",
    attack: 2,
    health: 5,
    rarity: "rare",
    clan: "妖怪",
    art: "tenseiga.png",
    text: "战吼：使你的所有其他友方随从获得 +1 攻击力。",
    keywords: [],
    battlecry: { kind: "buffAllFriendly", attack: 1, health: 0 },
  },

  // ============ 5 费 ============
  {
    id: "c_sesshomaru",
    name: "大妖杀生丸",
    cost: 5,
    type: "minion",
    attack: 5,
    health: 5,
    rarity: "legendary",
    clan: "妖怪",
    art: "sesshomaru.png",
    text: "圣盾。",
    keywords: ["divineShield"],
  },
  {
    id: "c_kanna",
    name: "神无",
    cost: 5,
    type: "minion",
    attack: 2,
    health: 6,
    rarity: "epic",
    clan: "妖怪",
    art: "kanna.png",
    text: "嘲讽。战吼：沉默一个敌方随从（清除其增益与关键词）。",
    keywords: ["taunt"],
    battlecry: { kind: "silence", target: TARGET.ENEMY_MINION },
    target: TARGET.ENEMY_MINION,
  },
  {
    id: "c_goshinki",
    name: "牙狩",
    cost: 5,
    type: "minion",
    attack: 6,
    health: 4,
    rarity: "rare",
    clan: "妖怪",
    art: "bankotsu.png",
    text: "战吼：对你的英雄造成 2 点伤害。",
    keywords: [],
    battlecry: { kind: "damageSelfHero", amount: 2 },
  },
  {
    id: "c_backlash_wave",
    name: "爆流破",
    cost: 5,
    type: "spell",
    rarity: "epic",
    clan: "神器",
    art: "windscar.png",
    text: "消灭一个随从。",
    spell: { kind: "destroy" },
    target: TARGET.ANY_MINION,
  },
  {
    id: "c_tessaiga",
    name: "铁碎牙",
    cost: 5,
    type: "weapon",
    attack: 4,
    durability: 3,
    rarity: "legendary",
    clan: "神器",
    art: "tessaiga.png",
    text: "装备后，你的英雄可以进行攻击。",
  },

  // ============ 6 费及以上 ============
  {
    id: "c_naraku",
    name: "奈落",
    cost: 6,
    type: "minion",
    attack: 5,
    health: 6,
    rarity: "legendary",
    clan: "半妖",
    art: "naraku.png",
    text: "战吼：对所有其他角色造成 1 点伤害。亡语：召唤一个 3/3 的分身。",
    keywords: [],
    battlecry: { kind: "damageAllOthers", amount: 1 },
    deathrattle: { kind: "summon", token: "t_naraku_clone", count: 1 },
  },
  {
    id: "c_hakudoshi",
    name: "白童子",
    cost: 6,
    type: "minion",
    attack: 4,
    health: 5,
    rarity: "epic",
    clan: "妖怪",
    art: "hakakoji.png",
    text: "吸血。",
    keywords: ["lifesteal"],
  },
  {
    id: "c_saimyosho",
    name: "毒虫赛鸣丸",
    cost: 6,
    type: "minion",
    attack: 3,
    health: 5,
    rarity: "rare",
    clan: "妖怪",
    art: "naraku_clone.png",
    text: "剧毒。突袭。",
    keywords: ["poison", "rush"],
  },
  {
    id: "c_meidou",
    name: "冥道残月破",
    cost: 6,
    type: "spell",
    rarity: "legendary",
    clan: "神器",
    art: "tenseiga.png",
    text: "消灭所有敌方随从。",
    spell: { kind: "destroyAll", side: "enemy" },
  },
  {
    id: "c_ryukotsusei",
    name: "龙骨精",
    cost: 7,
    type: "minion",
    attack: 7,
    health: 7,
    rarity: "epic",
    clan: "妖怪",
    art: "dragon_scale.png",
    text: "嘲讽。",
    keywords: ["taunt"],
  },
  {
    id: "c_moryomaru",
    name: "魍魉丸",
    cost: 8,
    type: "minion",
    attack: 8,
    health: 8,
    rarity: "legendary",
    clan: "妖怪",
    art: "moryomaru.png",
    text: "嘲讽。战吼：获得 +1/+1（每个已阵亡的友方随从）。",
    keywords: ["taunt"],
    battlecry: { kind: "buffPerDeath" },
  },
];

/** 衍生物（不可加入牌组） */
export const TOKENS = {
  t_wolf: {
    id: "t_wolf",
    name: "狼妖",
    cost: 2,
    type: "minion",
    attack: 2,
    health: 2,
    rarity: "common",
    clan: "妖怪",
    art: "ginga.png",
    text: "",
    keywords: [],
    token: true,
  },
  t_naraku_clone: {
    id: "t_naraku_clone",
    name: "奈落的分身",
    cost: 3,
    type: "minion",
    attack: 3,
    health: 3,
    rarity: "common",
    clan: "半妖",
    art: "naraku_clone.png",
    text: "",
    keywords: [],
    token: true,
  },
};

const CARD_INDEX = new Map();
for (const c of CARD_POOL) CARD_INDEX.set(c.id, c);
for (const k of Object.keys(TOKENS)) CARD_INDEX.set(k, TOKENS[k]);

export function getCardById(id) {
  return CARD_INDEX.get(id) || null;
}

/** 关键词中文名 */
export const KEYWORD_LABEL = {
  taunt: "嘲讽",
  charge: "冲锋",
  rush: "突袭",
  divineShield: "圣盾",
  windfury: "风怒",
  stealth: "潜行",
  lifesteal: "吸血",
  poison: "剧毒",
};

export const RARITY_LABEL = {
  common: "普通",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说",
};

export const RARITY_COLOR = {
  common: "#9e9e9e",
  rare: "#2196f3",
  epic: "#9c27b0",
  legendary: "#ff9800",
};

/** 默认预设牌组（30 张） */
export function defaultDeck() {
  const list = [
    ["c_myouga", 2],
    ["c_shippo", 2],
    ["c_jaken", 2],
    ["c_purify", 2],
    ["c_kirara", 2],
    ["c_kaede", 2],
    ["c_sacred_arrow", 2],
    ["c_shikon_shard", 2],
    ["c_sango", 2],
    ["c_kagura", 2],
    ["c_miroku_monk", 2],
    ["c_koga", 2],
    ["c_wind_scar", 2],
    ["c_inuyasha", 1],
    ["c_kikyo", 1],
    ["c_sesshomaru", 1],
    ["c_tessaiga", 1],
    ["c_backlash_wave", 1],
    ["c_naraku", 1],
    ["c_ryukotsusei", 1],
  ];
  const deck = [];
  for (const [id, n] of list) for (let i = 0; i < n; i++) deck.push(id);
  return deck;
}

/** AI 使用的牌组 */
export function aiDeck() {
  const list = [
    ["c_soul_collector", 2],
    ["c_jaken", 2],
    ["c_purify", 2],
    ["c_kirara", 2],
    ["c_kohaku", 2],
    ["c_hiraikotsu", 2],
    ["c_sacred_arrow", 2],
    ["c_thunder_hiten", 2],
    ["c_dragon_scaled", 2],
    ["c_wolf_pack", 2],
    ["c_totosai", 2],
    ["c_kanna", 2],
    ["c_goshinki", 2],
    ["c_hakudoshi", 2],
    ["c_saimyosho", 1],
    ["c_moryomaru", 1],
    ["c_naraku", 1],
    ["c_meidou", 1],
  ];
  const deck = [];
  for (const [id, n] of list) for (let i = 0; i < n; i++) deck.push(id);
  return deck;
}
