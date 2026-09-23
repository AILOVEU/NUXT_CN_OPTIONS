/** 涂抹 / 导出相关的公共渲染工具 */
import { OUTLINE } from "./patterns.js";

/** 生成涂色线稿标记：fills 为 { [index]: color } */
export function renderPatternSvg(shapes, fills) {
  return shapes
    .map((s, i) => {
      const fillable = !s.noFill;
      const fill = fillable ? fills[i] || "#FFFFFF" : "none";
      const sw = s.sw || (fillable ? 2.8 : 2.6);
      const attrs = `fill="${fill}" stroke="${OUTLINE}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" data-i="${fillable ? i : -1}"`;
      if (s.tag === "circle") return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" ${attrs}/>`;
      if (s.tag === "ellipse")
        return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}"${
          s.rot ? ` transform="rotate(${s.rot} ${s.cx} ${s.cy})"` : ""
        } ${attrs}/>`;
      if (s.tag === "rect")
        return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.rx0 || 0}" ${attrs}/>`;
      if (s.tag === "polygon") return `<polygon points="${(s.pts || []).join(" ")}" ${attrs}/>`;
      return `<path d="${s.d}" ${attrs}/>`;
    })
    .join("");
}

/** 参考图配色 */
export function referenceFills(shapes) {
  const out = {};
  shapes.forEach((s, i) => {
    if (!s.noFill) out[i] = s.ref || "#FFFFFF";
  });
  return out;
}

const PAINTS = [
  "#F98A9E",
  "#FFB8C9",
  "#F26D6D",
  "#FFD98E",
  "#F5A26B",
  "#E8B96A",
  "#A8D5A2",
  "#8FC98A",
  "#7FB77E",
  "#B7D8F5",
  "#8FC9F5",
  "#7FA9DE",
  "#C7B4F2",
  "#B3A2EE",
  "#C6905E",
  "#F0D3AE",
  "#FFF6E5",
  "#DFF1FF",
  "#3E4A5A",
  "#5A4630",
];

/** 根据线稿自动生成一套和谐配色 */
export function randomFills(shapes, seed = Math.random()) {
  const base = Math.floor(seed * PAINTS.length) % PAINTS.length;
  const out = {};
  let k = 0;
  shapes.forEach((s, i) => {
    if (!s.noFill) {
      out[i] = PAINTS[(base + k * 3) % PAINTS.length];
      k += 1;
    }
  });
  return out;
}

/** 把 SVG 图片绘制到指定倍率的画布 */
function drawSvg(img, width, height, scale) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * 把 SVG 字符串导出为 PNG 并触发下载
 * @returns {Promise<string>} 小尺寸 JPEG 缩略图（用于作品集）
 */
export function exportSvgAsPng(svgString, width, height, filename, scale = 2) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = drawSvg(img, width, height, scale);
        const thumb = drawSvg(img, width, height, Math.min(0.5, 300 / width)).toDataURL("image/jpeg", 0.72);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("导出失败"));
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 3000);
          resolve(thumb);
        }, "image/png");
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
  });
}

/** 本地作品集 */
const KEY = "handbook_works_v1";

export function loadWorks() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

export function saveWork(work) {
  const list = loadWorks();
  list.unshift(work);
  const trimmed = list.slice(0, 24);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch (e) {
    /* 超出配额时忽略 */
  }
  return trimmed;
}

export function removeWork(id) {
  const list = loadWorks().filter((w) => w.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    /* ignore */
  }
  return list;
}
