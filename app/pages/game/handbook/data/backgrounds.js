/**
 * 手帐背景素材（20 款）
 * 每款：形状 + 纸张底色 + 底纹
 */
import { FRAME_SHAPES, PAGE_W, PAGE_H } from "./frames.js";

/** SVG 底纹贴片（便于整幅 SVG 导出 PNG） */
export const PAPER_TEXTURES = {
  dot: (c) => ({ size: 24, markup: `<circle cx="6" cy="6" r="2.6" fill="${c}"/>` }),
  grid: (c) => ({ size: 28, markup: `<path d="M0 0h28M0 0v28" stroke="${c}" stroke-width="1.6" fill="none"/>` }),
  line: (c) => ({ size: 34, markup: `<path d="M0 33.2h48" stroke="${c}" stroke-width="1.8" fill="none"/>` }),
  cross: (c) => ({ size: 20, markup: `<path d="M0 0l20 20M20 0L0 20" stroke="${c}" stroke-width="1.3" fill="none"/>` }),
  blank: () => ({ size: 12, markup: "" }),
};

export const TEXTURE_KEYS = [
  { key: "dot", name: "点阵" },
  { key: "grid", name: "方格" },
  { key: "line", name: "横线" },
  { key: "cross", name: "斜纹" },
  { key: "blank", name: "留白" },
];

const RAW = [
  { name: "奶油波边", shape: "wave", paper: "#FFFDF6", inner: "#FFF6E4", line: "#E9CDA1", tex: "dot", texColor: "#EEDDBC" },
  { name: "蜜桃云朵", shape: "cloud", paper: "#FFF3EE", inner: "#FFE9E9", line: "#F5B9AE", tex: "dot", texColor: "#F7C9C0" },
  { name: "薄荷花瓣", shape: "petal", paper: "#F2FBF1", inner: "#E9F7E7", line: "#A8D5A2", tex: "grid", texColor: "#D2EBD0" },
  { name: "樱花粉团", shape: "blob", paper: "#FFF4F7", inner: "#FFEAF1", line: "#F8AEC5", tex: "dot", texColor: "#F9C9D8" },
  { name: "爱心日记", shape: "heart", paper: "#FFF6F2", inner: "#FFEDE6", line: "#F2795E", tex: "dot", texColor: "#F8CFC2" },
  { name: "星星夜话", shape: "star", paper: "#F7F2FF", inner: "#EFE8FF", line: "#B9A3F0", tex: "blank", texColor: "" },
  { name: "方方便签", shape: "soft", paper: "#FFFDF6", inner: "#FFFAEB", line: "#E4C88A", tex: "grid", texColor: "#EFE1BE" },
  { name: "圆窗小记", shape: "round", paper: "#EFF8FF", inner: "#E4F3FF", line: "#93C4EA", tex: "dot", texColor: "#C6E3F8" },
  { name: "拱门书房", shape: "arch", paper: "#FBF6EF", inner: "#F6EDDF", line: "#CFA981", tex: "line", texColor: "#E7D7BF" },
  { name: "六角蜜蜡", shape: "hex", paper: "#FFFBEF", inner: "#FFF4D8", line: "#E9C36B", tex: "grid", texColor: "#F2DFAC" },
  { name: "泡泡奶油", shape: "bubble", paper: "#FFFBF2", inner: "#FFF7E6", line: "#F0D3A0", tex: "dot", texColor: "#F2E0C2" },
  { name: "焦糖波边", shape: "wave", paper: "#FDF6EE", inner: "#F8E9D6", line: "#C6905E", tex: "line", texColor: "#E5D2BA" },
  { name: "抹茶花瓣", shape: "petal", paper: "#F5FAF1", inner: "#EDF6E6", line: "#9DC98C", tex: "grid", texColor: "#D8EBCE" },
  { name: "天空云朵", shape: "cloud", paper: "#F0F8FF", inner: "#E6F4FF", line: "#8FC2E8", tex: "dot", texColor: "#C9E4F7" },
  { name: "葡萄星星", shape: "star", paper: "#F8F4FF", inner: "#F0E9FF", line: "#A98BE8", tex: "blank", texColor: "" },
  { name: "暖阳爱心", shape: "heart", paper: "#FFF8F0", inner: "#FFEFDC", line: "#F0A24C", tex: "line", texColor: "#F3DCBD" },
  { name: "拿铁便签", shape: "soft", paper: "#FAF5F0", inner: "#F4EBE2", line: "#B98A5E", tex: "dot", texColor: "#E7D9C8" },
  { name: "苔绿圆窗", shape: "round", paper: "#F3FAF3", inner: "#E8F5E8", line: "#7FB77E", tex: "grid", texColor: "#D3E9D2" },
  { name: "玫瑰拱门", shape: "arch", paper: "#FEF4F6", inner: "#FBE6EC", line: "#E68CA6", tex: "dot", texColor: "#F6CDD8" },
  { name: "蜂蜜六角", shape: "hex", paper: "#FFFAEC", inner: "#FFF3D2", line: "#E2B84F", tex: "line", texColor: "#F1E0B4" },
  { name: "薄荷波边", shape: "wave", paper: "#F3FBF9", inner: "#E7F7F3", line: "#8FCFC3", tex: "cross", texColor: "#D3EDE7" },
  { name: "薰衣草卷", shape: "bubble", paper: "#F8F6FF", inner: "#F0ECFF", line: "#B4A6EC", tex: "dot", texColor: "#DCD4F7" },
];

export const BACKGROUNDS = RAW.map((b, i) => ({
  id: `bg-${i + 1}`,
  ...b,
  frame: FRAME_SHAPES[b.shape] ? FRAME_SHAPES[b.shape]() : FRAME_SHAPES.soft(),
  tile: (PAPER_TEXTURES[b.tex] || PAPER_TEXTURES.blank)(b.texColor),
}));

export const PAGE = { w: PAGE_W, h: PAGE_H };
