/**
 * 手帐相框形状生成器（矢量，坐标系 0 0 800 1050）
 * 所有形状都会自动缩放平移到安全框内，保证不超出纸张
 */
export const PAGE_W = 800;
export const PAGE_H = 1050;

const SAFE = { x0: 34, y0: 30, x1: PAGE_W - 34, y1: PAGE_H - 30 };

const f = (n) => Math.round(n * 100) / 100;

/** Catmull-Rom 平滑闭合曲线 */
function smoothPath(pts, t) {
  const n = pts.length;
  if (n < 3) return "";
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * t;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * t;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * t;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * t;
    d += `C${f(c1x)},${f(c1y)} ${f(c2x)},${f(c2y)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + "Z";
}

const bez = (a, b, c, dd, t) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * dd;
};

/** 采样实际曲线，得到真实包围盒 */
function pathBounds(pts, t) {
  const n = pts.length;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * t;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * t;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * t;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * t;
    for (let s = 0; s <= 8; s++) {
      const tt = s / 8;
      const x = bez(p1[0], c1x, c2x, p2[0], tt);
      const y = bez(p1[1], c1y, c2y, p2[1], tt);
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  return { x0, y0, x1, y1 };
}

/** 生成形状路径：自动缩放平移至安全框内 */
function fit(ptsBuilder, tension) {
  const t = tension === undefined ? 0.55 : tension;
  let pts = ptsBuilder();
  for (let k = 0; k < 6; k++) {
    const bb = pathBounds(pts, t);
    const bw = Math.max(1e-6, bb.x1 - bb.x0);
    const bh = Math.max(1e-6, bb.y1 - bb.y0);
    const s = Math.min((SAFE.x1 - SAFE.x0) / bw, (SAFE.y1 - SAFE.y0) / bh);
    const cx = (bb.x0 + bb.x1) / 2;
    const cy = (bb.y0 + bb.y1) / 2;
    const tx = (SAFE.x0 + SAFE.x1) / 2;
    const ty = (SAFE.y0 + SAFE.y1) / 2;
    const dx = tx - cx;
    const dy = ty - cy;
    if (Math.abs(s - 1) < 0.002 && Math.abs(dx) < 0.6 && Math.abs(dy) < 0.6) break;
    if (!isFinite(s) || s <= 0) break;
    pts = pts.map(([x, y]) => [tx + (x - cx) * s, ty + (y - cy) * s]);
  }
  return smoothPath(pts, t);
}

/** 波浪矩形周边点 */
function rectWave(m, amp, bumps, n) {
  const total = n || 108;
  const x0 = m;
  const y0 = m;
  const x1 = PAGE_W - m;
  const y1 = PAGE_H - m;
  const w = x1 - x0;
  const h = y1 - y0;
  const per = 2 * (w + h);
  const pts = [];
  for (let i = 0; i < total; i++) {
    const s = i / total;
    const d = s * per;
    let x;
    let y;
    let nx = 0;
    let ny = 0;
    if (d < w) {
      x = x0 + d;
      y = y0;
      ny = -1;
    } else if (d < w + h) {
      x = x1;
      y = y0 + (d - w);
      nx = 1;
    } else if (d < 2 * w + h) {
      x = x1 - (d - w - h);
      y = y1;
      ny = 1;
    } else {
      x = x0;
      y = y1 - (d - 2 * w - h);
      nx = -1;
    }
    const o = amp * Math.abs(Math.sin(Math.PI * bumps * s));
    pts.push([x + nx * o, y + ny * o]);
  }
  return pts;
}

/** 圆角矩形周边点 */
function roundRectPts(x, y, w, h, r, per = 4, seg = 9) {
  const pts = [];
  const push = (px, py) => pts.push([px, py]);
  const corners = [
    { cx: x + w - r, cy: y + r, a0: -Math.PI / 2, a1: 0 },
    { cx: x + w - r, cy: y + h - r, a0: 0, a1: Math.PI / 2 },
    { cx: x + r, cy: y + h - r, a0: Math.PI / 2, a1: Math.PI },
    { cx: x + r, cy: y + r, a0: Math.PI, a1: Math.PI * 1.5 },
  ];
  for (let i = 0; i < per; i++) push(x + r + ((w - 2 * r) * i) / per, y);
  for (let s = 0; s <= seg; s++) {
    const a = corners[0].a0 + ((corners[0].a1 - corners[0].a0) * s) / seg;
    push(corners[0].cx + Math.cos(a) * r, corners[0].cy + Math.sin(a) * r);
  }
  for (let i = 1; i <= per; i++) push(x + w, y + r + ((h - 2 * r) * i) / per);
  for (let s = 0; s <= seg; s++) {
    const a = corners[1].a0 + ((corners[1].a1 - corners[1].a0) * s) / seg;
    push(corners[1].cx + Math.cos(a) * r, corners[1].cy + Math.sin(a) * r);
  }
  for (let i = 1; i <= per; i++) push(x + w - r - ((w - 2 * r) * i) / per, y + h);
  for (let s = 0; s <= seg; s++) {
    const a = corners[2].a0 + ((corners[2].a1 - corners[2].a0) * s) / seg;
    push(corners[2].cx + Math.cos(a) * r, corners[2].cy + Math.sin(a) * r);
  }
  for (let i = 1; i <= per; i++) push(x, y + h - r - ((h - 2 * r) * i) / per);
  for (let s = 0; s <= seg; s++) {
    const a = corners[3].a0 + ((corners[3].a1 - corners[3].a0) * s) / seg;
    push(corners[3].cx + Math.cos(a) * r, corners[3].cy + Math.sin(a) * r);
  }
  return pts;
}

/** 椭圆 + 正弦波纹 */
function ellipseRipple(cx, cy, rx, ry, bumps, amp, n, absMode) {
  const total = n || 96;
  const pts = [];
  for (let i = 0; i < total; i++) {
    const a = (i / total) * Math.PI * 2;
    const raw = Math.sin(bumps * a);
    const k = 1 + amp * (absMode ? Math.abs(raw) - 0.5 : raw);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
}

function ellipsePts(cx, cy, rx, ry, n) {
  return ellipseRipple(cx, cy, rx, ry, 2, 0, n || 96, false);
}

/** 多边形按边细分（保持直边） */
function polyPts(verts, per) {
  const seg = per || 10;
  const pts = [];
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    for (let j = 0; j < seg; j++) {
      const t = j / seg;
      pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return pts;
}

function regularVerts(cx, cy, r, sides, rot) {
  const start = rot === undefined ? -Math.PI / 2 : rot;
  const v = [];
  for (let i = 0; i < sides; i++) {
    const a = start + (i / sides) * Math.PI * 2;
    v.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return v;
}

function starVerts(cx, cy, r1, r2, points) {
  const v = [];
  for (let i = 0; i < points * 2; i++) {
    const a = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? r1 : r2;
    v.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return v;
}

function heartPts(cx, cy, rx, ry, n) {
  const total = n || 120;
  const pts = [];
  for (let i = 0; i < total; i++) {
    const t = (i / total) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push([cx + (x / 16) * rx, cy + ((y + 6) / 11) * ry]);
  }
  return pts;
}

/** 拱门：上方半圆 + 直边 */
function archPts(m, n) {
  const seg = n || 24;
  const x0 = m;
  const x1 = PAGE_W - m;
  const y1 = PAGE_H - m;
  const rad = (x1 - x0) / 2;
  const cy = m + rad;
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const a = Math.PI + (i / 48) * Math.PI;
    pts.push([PAGE_W / 2 + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  for (let i = 1; i <= seg; i++) pts.push([x1, cy + ((y1 - cy) * i) / seg]);
  for (let i = 1; i <= 12; i++) pts.push([x1 - ((x1 - x0) * i) / 12, y1]);
  for (let i = 1; i <= seg; i++) pts.push([x0, y1 - ((y1 - cy) * i) / seg]);
  return pts;
}

export const FRAME_SHAPES = {
  wave: () => fit(() => rectWave(52, 34, 7), 0.6),
  bubble: () => fit(() => rectWave(60, 22, 17), 0.6),
  petal: () => fit(() => ellipseRipple(400, 525, 336, 458, 14, 0.09, 150, true), 0.6),
  blob: () => fit(() => ellipseRipple(400, 525, 344, 462, 7, 0.05), 0.6),
  cloud: () => fit(() => ellipseRipple(400, 525, 330, 442, 5, 0.085), 0.6),
  heart: () => fit(() => heartPts(400, 520, 350, 400), 0.45),
  star: () => fit(() => polyPts(starVerts(400, 525, 400, 232, 6), 10), 0.16),
  hex: () => fit(() => polyPts(regularVerts(400, 525, 400, 6), 10), 0.16),
  round: () => fit(() => ellipsePts(400, 525, 330, 456), 0.5),
  arch: () => fit(() => archPts(62), 0.5),
  soft: () => fit(() => roundRectPts(60, 60, PAGE_W - 120, PAGE_H - 120, 54), 0.5),
  ticket: () => fit(() => roundRectPts(60, 60, PAGE_W - 120, PAGE_H - 120, 26), 0.5),
};

export const SHAPE_KEYS = Object.keys(FRAME_SHAPES);
