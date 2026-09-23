/**
 * 手帐贴纸素材库
 * 每个素材：{ id, name, cat, catName, svg }
 * svg 为 viewBox="0 0 100 100" 的内部标记
 */
import { FOREST } from "./stickers-forest.js";
import { MUSIC } from "./stickers-music.js";
import { FOOD } from "./stickers-food.js";
import { ANIMAL } from "./stickers-animal.js";
import { DAILY } from "./stickers-daily.js";
import { FESTIVAL } from "./stickers-festival.js";

let _seq = 0;

/** 分类内的每个素材都会带上唯一 id，供画布引用 */
export const STICKER_CATEGORIES = [
  { key: "forest", name: "小森林", items: FOREST },
  { key: "music", name: "音乐会", items: MUSIC },
  { key: "food", name: "美食家", items: FOOD },
  { key: "animal", name: "萌宠屋", items: ANIMAL },
  { key: "daily", name: "小日常", items: DAILY },
  { key: "festival", name: "节日季", items: FESTIVAL },
].map((c) => ({
  ...c,
  items: c.items.map((it) => ({
    ...it,
    id: `${c.key}-${++_seq}`,
    cat: c.key,
    catName: c.name,
  })),
}));

export const ALL_STICKERS = STICKER_CATEGORIES.flatMap((c) => c.items);

export const STICKER_MAP = Object.fromEntries(ALL_STICKERS.map((s) => [s.id, s]));

export const STICKER_TOTAL = ALL_STICKERS.length;
