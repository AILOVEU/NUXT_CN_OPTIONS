/**
 * 和纸胶带素材（18 款）
 * 本地坐标系：0 0 200 56
 */
export const TAPE_W = 200;
export const TAPE_H = 56;

const r2 = Math.round;

function tile(cols, rows, fn) {
  const out = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      out.push(fn((i + 0.5) * (TAPE_W / cols), (j + 0.5) * (TAPE_H / rows), i, j));
    }
  }
  return out.join("");
}

const DECO = {
  dots: (c) => tile(8, 3, (x, y) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="5" fill="${c}"/>`),
  smallDots: (c) => tile(12, 4, (x, y) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="2.6" fill="${c}"/>`),
  stripes: (c) => {
    const out = [];
    for (let x = -40; x < TAPE_W + 40; x += 22) {
      out.push(`<rect x="${x}" y="-20" width="8" height="110" fill="${c}" transform="rotate(18 ${x + 4} 28)"/>`);
    }
    return out.join("");
  },
  checks: (c) => tile(10, 3, (x, y, i, j) => ((i + j) % 2 === 0 ? `<rect x="${r2(x - 10)}" y="${r2(y - 9)}" width="20" height="19" fill="${c}"/>` : "")),
  flowers: (c, c2) =>
    tile(5, 2, (x, y) => {
      const p = [];
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        p.push(`<circle cx="${r2(x + Math.cos(a) * 6)}" cy="${r2(y + Math.sin(a) * 6)}" r="5" fill="${c}"/>`);
      }
      p.push(`<circle cx="${r2(x)}" cy="${r2(y)}" r="3.4" fill="${c2}"/>`);
      return p.join("");
    }),
  hearts: (c) =>
    tile(6, 3, (x, y) => {
      const s = 0.55;
      return `<path d="M${r2(x)} ${r2(y + 6 * s)}c${r2(-9 * s)}-${r2(7 * s)} ${r2(-10 * s)}-${r2(14 * s)} 0-${r2(10 * s)} ${r2(10 * s)}-${r2(4 * s)} ${r2(9 * s)} ${r2(11 * s)} 0 ${r2(10 * s)}z" fill="${c}"/>`;
    }),
  stars: (c) =>
    tile(7, 3, (x, y, i, j) => {
      const r = (i + j) % 2 === 0 ? 8 : 5.5;
      const v = [];
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k / 5) * Math.PI * 2;
        const b = a + Math.PI / 5;
        v.push(`${r2(x + Math.cos(a) * r)},${r2(y + Math.sin(a) * r)}`);
        if (k < 4) v.push(`${r2(x + Math.cos(b) * r * 0.45)},${r2(y + Math.sin(b) * r * 0.45)}`);
      }
      return `<polygon points="${v.join(" ")}" fill="${c}"/>`;
    }),
  clouds: (c) =>
    tile(4, 2, (x, y) => `<g transform="translate(${r2(x)},${r2(y)})"><circle cx="-10" cy="2" r="7" fill="${c}"/><circle cx="0" cy="-3" r="9" fill="${c}"/><circle cx="11" cy="2" r="7" fill="${c}"/><rect x="-10" y="0" width="22" height="9" rx="4.5" fill="${c}"/></g>`),
  waves: (c) => {
    const out = [];
    for (let y = 14; y < TAPE_H; y += 16) {
      let d = `M-4 ${y}`;
      for (let x = 0; x <= TAPE_W + 30; x += 16) d += `q8 -10 16 0`;
      out.push(`<path d="${d}" fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/>`);
    }
    return out.join("");
  },
  plaid: (c) => {
    const out = [];
    for (let x = 10; x < TAPE_W; x += 34) out.push(`<rect x="${x}" y="0" width="6" height="${TAPE_H}" fill="${c}"/>`);
    for (let y = 8; y < TAPE_H; y += 26) out.push(`<rect x="0" y="${y}" width="${TAPE_W}" height="5" fill="${c}"/>`);
    return out.join("");
  },
  leaves: (c) =>
    tile(6, 2, (x, y, i) => {
      const rot = i % 2 === 0 ? -28 : 28;
      return `<path d="M${r2(x)} ${r2(y + 9)}c0-9 6-14 13-15 0 9-5 15-13 15z" fill="${c}" transform="rotate(${rot} ${r2(x)} ${r2(y)})"/>`;
    }),
  rainbow: (c, c2) =>
    tile(3, 1, (x, y) => {
      const g = [];
      const cols = [c, c2, c];
      cols.forEach((col, i) => {
        g.push(`<path d="M${r2(x - 16)} ${r2(y + 14)}a${16 - i * 5} ${16 - i * 5} 0 0 1 ${(16 - i * 5) * 2} 0" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round"/>`);
      });
      return g.join("");
    }),
  bubbles: (c) =>
    tile(9, 3, (x, y, i, j) => `<circle cx="${r2(x)}" cy="${r2(y)}" r="${((i + j) % 3) + 2.4}" fill="none" stroke="${c}" stroke-width="2.4"/>`),
  crosses: (c) =>
    tile(8, 3, (x, y) => `<g stroke="${c}" stroke-width="3" stroke-linecap="round"><path d="M${r2(x - 4)} ${r2(y)}h8M${r2(x)} ${r2(y - 4)}v8"/></g>`),
  cherries: (c, c2) =>
    tile(4, 1, (x, y) => `<g><circle cx="${r2(x - 6)}" cy="${r2(y + 8)}" r="7" fill="${c}"/><circle cx="${r2(x + 7)}" cy="${r2(y + 11)}" r="6" fill="${c}"/><path d="M${r2(x - 6)} ${r2(y + 2)}q3-10 12-12M${r2(x + 7)} ${r2(y + 5)}q-1-10-3-14" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/></g>`),
  grid: (c) => {
    const out = [];
    for (let x = 0; x <= TAPE_W; x += 16) out.push(`<path d="M${x} 0v${TAPE_H}" stroke="${c}" stroke-width="2"/>`);
    for (let y = 0; y <= TAPE_H; y += 14) out.push(`<path d="M0 ${y}h${TAPE_W}" stroke="${c}" stroke-width="2"/>`);
    return out.join("");
  },
  seeds: (c) => tile(10, 3, (x, y, i, j) => `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="3.6" ry="5.4" fill="${c}" transform="rotate(${(i + j) % 2 ? 30 : -30} ${r2(x)} ${r2(y)})"/>`),
  arcs: (c) =>
    tile(5, 2, (x, y, i) => `<path d="M${r2(x - 14)} ${r2(y + 8)}a14 14 0 0 1 28 0" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"${i % 2 ? ` transform="rotate(180 ${r2(x)} ${r2(y)})"` : ""}/>`),
  notes: (c) =>
    tile(6, 2, (x, y) => `<g fill="${c}"><ellipse cx="${r2(x - 4)}" cy="${r2(y + 7)}" rx="6" ry="4.6"/><rect x="${r2(x + 1)}" y="${r2(y - 11)}" width="3" height="18" rx="1.5"/><path d="M${r2(x + 4)} ${r2(y - 11)}q7 1.5 7 6 0 3-3.5 2 1.5-3-3.5-4.5z"/></g>`),
};

const RAW = [
  { name: "抹茶碎花", base: "#FBE9EA", edge: "#F3D2D6", deco: "flowers", c: "#A9D3A2", c2: "#FDF6D8" },
  { name: "蜜桃点点", base: "#FCE7EA", edge: "#F4CBD3", deco: "dots", c: "#F29AAE" },
  { name: "葡萄小圆", base: "#EBE6FB", edge: "#D9D0F6", deco: "smallDots", c: "#9C86E3" },
  { name: "海盐条纹", base: "#E6F1FB", edge: "#CFE3F7", deco: "stripes", c: "#8FBFE6" },
  { name: "薰衣草花", base: "#F2EFFD", edge: "#E0D9FA", deco: "flowers", c: "#B3A2EE", c2: "#FFF8C8" },
  { name: "红心方格", base: "#FDE9E9", edge: "#F6CFCF", deco: "hearts", c: "#F26D6D" },
  { name: "焦糖格纹", base: "#F7EDE2", edge: "#EBD9C6", deco: "plaid", c: "#D3A97A" },
  { name: "云朵蓝", base: "#EAF4FD", edge: "#D3E7F9", deco: "clouds", c: "#A9CFEE" },
  { name: "海边波浪", base: "#E8F6F7", edge: "#CDE9EC", deco: "waves", c: "#7FC3CA" },
  { name: "森林绿叶", base: "#EDF7E9", edge: "#D7ECD1", deco: "leaves", c: "#8FC98A" },
  { name: "彩虹弧线", base: "#FFF6E8", edge: "#F6E5C8", deco: "rainbow", c: "#F5A26B", c2: "#A8D5A2" },
  { name: "泡泡糖", base: "#FDF0F6", edge: "#F7D9E8", deco: "bubbles", c: "#E88CB4" },
  { name: "十字奶咖", base: "#FAF3EA", edge: "#EFE1CD", deco: "crosses", c: "#C9A87C" },
  { name: "樱桃小语", base: "#FDEFEF", edge: "#F7D8D8", deco: "cherries", c: "#EE7B7B", c2: "#7FB77E" },
  { name: "薄荷网格", base: "#EAF8F3", edge: "#D2EEF4", deco: "grid", c: "#A3DCD3" },
  { name: "柠檬籽", base: "#FEFAE6", edge: "#F5EEC4", deco: "seeds", c: "#EFC95C" },
  { name: "半圆花边", base: "#F1F0FB", edge: "#DEDDF5", deco: "arcs", c: "#A9A3E6" },
  { name: "音符黄", base: "#FFF8E4", edge: "#F6E9C2", deco: "notes", c: "#E8B44F" },
];

/** rounded=true 用于选择器预览；rounded=false 用于画布平铺（无缝拼接） */
function buildBody(t, inner, rounded) {
  return (
    `<rect x="0" y="0" width="${TAPE_W}" height="${TAPE_H}"${rounded ? ' rx="3"' : ""} fill="${t.base}"/>` +
    `<rect x="0" y="0" width="${TAPE_W}" height="3" fill="${t.edge}"/>` +
    `<rect x="0" y="${TAPE_H - 3}" width="${TAPE_W}" height="3" fill="${t.edge}"/>` +
    `<g opacity="0.78">${inner}</g>`
  );
}

export const TAPES = RAW.map((t, i) => {
  const inner = (DECO[t.deco] ? DECO[t.deco](t.c, t.c2) : "").replace(/\s+/g, " ").trim();
  return {
    id: `tape-${i + 1}`,
    name: t.name,
    base: t.base,
    edge: t.edge,
    svg: buildBody(t, inner, true),
    tile: buildBody(t, inner, false),
  };
});
