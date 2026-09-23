<template>
  <div class="hb-root">
  <div class="hb-color" :class="{ painting: step === 'paint' }">
    <!-- ============ 顶部栏 ============ -->
    <header class="hb-head">
      <button class="hb-round" @click="onBack">←</button>
      <div class="hb-head-title">{{ step === "pick" ? "贴纸涂色" : "自由涂色" }}</div>
      <button v-if="step === 'paint'" class="hb-done" @click="finish">完成</button>
      <span v-else class="hb-round-holder" />
    </header>

    <!-- ============ 第一步：选图案 ============ -->
    <template v-if="step === 'pick'">
      <div class="hb-pickWrap">
        <h2 class="hb-pickTitle">选择你的贴纸图案</h2>
        <div class="hb-patterns">
          <button v-for="p in COLOR_PATTERNS" :key="p.id" class="hb-pcell" @click="startPaint(p)">
            <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
              <g v-html="previewMarkup(p)" />
            </svg>
            <em>{{ p.name }}</em>
          </button>
        </div>
      </div>
      <div class="hb-drip" />
    </template>

    <!-- ============ 第二步：涂色 ============ -->
    <template v-else>
      <div class="hb-sayRow">
        <div class="hb-say">开始创作吧~</div>
      </div>

      <div class="hb-stage">
        <div class="hb-canvas">
          <svg
            ref="svgRef"
            class="hb-svg"
            viewBox="0 0 400 400"
            preserveAspectRatio="xMidYMid meet"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="onUp"
          >
            <rect width="400" height="400" fill="#FFFFFF" />
            <g v-if="showRef" opacity="0.4" v-html="referenceMarkup" />
            <g v-html="artMarkup" />
            <g v-html="strokeMarkup" />
          </svg>
          <button class="hb-ref" :class="{ on: showRef }" @click="showRef = !showRef">参考</button>
        </div>
      </div>

      <section class="hb-tools">
        <div class="hb-toolRow">
          <button class="hb-tool" :class="{ on: tool === 'fill' }" @click="tool = 'fill'">
            <span>▨</span>填色
          </button>
          <button class="hb-tool" :class="{ on: tool === 'brush' }" @click="tool = 'brush'">
            <span>✎</span>画笔
          </button>
          <button class="hb-tool" :class="{ on: tool === 'eraser' }" @click="tool = 'eraser'">
            <span>⌫</span>橡皮
          </button>
          <button class="hb-tool" @click="randomColor">✨ 一键配色</button>
          <button class="hb-tool" :disabled="!history.length" @click="undo">↺ 撤销</button>
          <button class="hb-tool" @click="clearAll">清空</button>
        </div>

        <div class="hb-line">
          <span class="hb-label">颜色</span>
          <div class="hb-palette">
            <button
              v-for="c in PALETTE"
              :key="c"
              class="hb-swatch"
              :class="{ on: color === c && tool !== 'eraser' }"
              :style="{ background: c }"
              @click="pickColor(c)"
            />
            <label class="hb-swatch custom">
              <input type="color" v-model="customColor" @input="pickColor(customColor)" />
            </label>
          </div>
        </div>

        <div class="hb-line">
          <span class="hb-label">粗细</span>
          <input type="range" class="hb-range" min="4" max="46" step="1" v-model.number="brushSize" />
        </div>

        <div class="hb-bottomBar">
          <button class="hb-tool primary" :disabled="saving" @click="saveToAlbum">
            {{ saving ? "保存中…" : "保存到相册" }}
          </button>
          <button class="hb-tool" @click="step = 'pick'">换个图案</button>
        </div>
      </section>
    </template>

    <transition name="hb-fade">
      <div v-if="toastText" class="hb-toast">{{ toastText }}</div>
    </transition>
  </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { COLOR_PATTERNS } from "./data/patterns.js";
import { renderPatternSvg, referenceFills, randomFills, exportSvgAsPng, saveWork } from "./data/render.js";

useHead({
  title: "贴纸涂色",
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" }],
});

const PALETTE = [
  "#F26D6D",
  "#F98A9E",
  "#FFB8C9",
  "#FFD98E",
  "#F5A26B",
  "#E8B96A",
  "#FFE7A8",
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
  "#8E96A3",
  "#3E4A5A",
];

const router = useRouter();
const step = ref("pick");
const pattern = ref(COLOR_PATTERNS[0]);
const fills = ref({});
const strokes = ref([]);
const history = ref([]);
const tool = ref("fill");
const color = ref("#F98A9E");
const customColor = ref("#F98A9E");
const brushSize = ref(14);
const showRef = ref(false);
const saving = ref(false);
const toastText = ref("");
const svgRef = ref(null);

const artMarkup = computed(() => renderPatternSvg(pattern.value.shapes, fills.value));
const referenceMarkup = computed(() => renderPatternSvg(pattern.value.shapes, referenceFills(pattern.value.shapes)));
const strokeMarkup = computed(() => strokes.value.map(strokeSvg).join(""));

function strokeSvg(s) {
  const d = pathD(s.points);
  if (!d) return "";
  return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function pathD(pts) {
  if (!pts.length) return "";
  if (pts.length === 1) return `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}l0.01,0`;
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) d += `L${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
  return d;
}

function previewMarkup(p) {
  return renderPatternSvg(p.shapes, {});
}

function toast(msg) {
  toastText.value = msg;
  setTimeout(() => {
    if (toastText.value === msg) toastText.value = "";
  }, 1600);
}

function snapshot() {
  return { fills: { ...fills.value }, strokes: JSON.parse(JSON.stringify(strokes.value)) };
}
function pushHistory() {
  history.value.push(snapshot());
  if (history.value.length > 40) history.value.shift();
}
function undo() {
  const s = history.value.pop();
  if (!s) return;
  fills.value = s.fills;
  strokes.value = s.strokes;
}

/* ---------------- 交互 ---------------- */
function clientToSvg(evt) {
  const svg = svgRef.value;
  if (!svg) return { x: 0, y: 0 };
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = new DOMPoint(evt.clientX, evt.clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

let drawing = null;

function onDown(e) {
  const el = e.target instanceof Element ? e.target : null;
  const raw = el && el.getAttribute ? el.getAttribute("data-i") : null;
  const idx = raw === null ? -1 : Number(raw);

  if (tool.value === "fill") {
    if (idx >= 0) {
      pushHistory();
      fills.value = { ...fills.value, [idx]: color.value };
    }
    return;
  }

  const p = clientToSvg(e);
  try {
    svgRef.value.setPointerCapture(e.pointerId);
  } catch (err) {
    /* ignore */
  }

  if (tool.value === "brush") {
    pushHistory();
    strokes.value.push({ color: color.value, width: brushSize.value, points: [p] });
    drawing = "brush";
    return;
  }

  // 橡皮：先消除线稿填色，再擦掉笔迹
  pushHistory();
  if (idx >= 0 && fills.value[idx]) {
    const next = { ...fills.value };
    delete next[idx];
    fills.value = next;
  }
  eraseAt(p);
  drawing = "erase";
}

function eraseAt(p) {
  const r = brushSize.value / 2 + 8;
  const next = [];
  for (const s of strokes.value) {
    const pts = s.points.filter((q) => Math.hypot(q.x - p.x, q.y - p.y) > r);
    if (pts.length >= 1) next.push({ ...s, points: pts });
  }
  strokes.value = next;
}

function onMove(e) {
  if (!drawing) return;
  const p = clientToSvg(e);
  if (drawing === "brush") {
    const last = strokes.value[strokes.value.length - 1];
    if (!last) return;
    const prev = last.points[last.points.length - 1];
    if (prev && Math.hypot(p.x - prev.x, p.y - prev.y) < 1.4) return;
    last.points.push(p);
    strokes.value = [...strokes.value];
  } else {
    eraseAt(p);
  }
}

function onUp() {
  drawing = null;
}

/* ---------------- 功能 ---------------- */
function pickColor(c) {
  color.value = c;
  customColor.value = c;
  if (tool.value === "eraser") tool.value = "brush";
}

function randomColor() {
  pushHistory();
  fills.value = randomFills(pattern.value.shapes, Math.random());
}

function clearAll() {
  pushHistory();
  fills.value = {};
  strokes.value = [];
}

function startPaint(p) {
  pattern.value = p;
  fills.value = {};
  strokes.value = [];
  history.value = [];
  tool.value = "fill";
  step.value = "paint";
  showRef.value = false;
}

function onBack() {
  if (step.value === "paint") {
    step.value = "pick";
    return;
  }
  if (window.history.length > 1) router.back();
  else router.push("/game/handbook");
}

function finish() {
  saveToAlbum();
}

function buildSvgString() {
  const shapes = renderPatternSvg(pattern.value.shapes, fills.value);
  const strokesSvg = strokes.value.map(strokeSvg).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">` +
    `<rect width="400" height="400" fill="#FFFFFF"/><g>${shapes}</g><g>${strokesSvg}</g></svg>`
  );
}

async function saveToAlbum() {
  if (saving.value) return;
  saving.value = true;
  try {
    const xml = buildSvgString();
    const thumb = await exportSvgAsPng(xml, 400, 400, `涂色-${pattern.value.name}-${Date.now()}.png`, 2.2);
    saveWork({ id: `cp-${Date.now()}`, mode: "color", name: pattern.value.name, thumb, time: Date.now() });
    toast("已保存到相册 ~");
  } catch (e) {
    toast("导出失败，请重试");
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
/* 外层：铺满视口并居中承载固定比例的“手机”容器 */
.hb-root {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: stretch;
  overflow: hidden;
  background: #cfe8c6;
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Nunito", system-ui, sans-serif;
  color: #6f8f5e;
  -webkit-tap-highlight-color: transparent;
}
/* 内容容器：高度 100vh，宽度取 40vh 与 100vw 的较小值 */
.hb-color {
  position: relative;
  height: 100vh;
  width: min(40vh, 100vw);
  height: 100dvh;
  width: min(40dvh, 100vw);
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #eaf7e3 0%, #d7f0cf 60%, #c8ecc0 100%);
  overflow: hidden;
  box-shadow: 0 0 40px rgba(60, 96, 48, 0.22);
}
.hb-color::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.35) 1px, transparent 1px);
  background-size: 34px 34px;
  pointer-events: none;
}
.hb-head {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top) + 8px) 14px 6px;
}
.hb-head-title {
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 2px;
  color: #4f7a3f;
}
.hb-round {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #4f7a3f;
  font-size: 17px;
  font-weight: 900;
  box-shadow: 0 2px 6px rgba(96, 140, 80, 0.25);
}
.hb-round-holder {
  width: 38px;
  height: 38px;
}
.hb-done {
  padding: 7px 18px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(180deg, #ff9a8b, #f2685e);
  color: #fff;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 2px;
  box-shadow: 0 3px 0 #d5534a;
}

/* ------- 选图案 ------- */
.hb-pickWrap {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 2px 14px 0;
}
.hb-pickTitle {
  margin: 6px 0 10px;
  text-align: center;
  font-size: 19px;
  font-weight: 900;
  letter-spacing: 3px;
  color: #fff;
  text-shadow: 0 2px 0 #a9d69b;
}
.hb-patterns {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  overflow-y: auto;
  padding-bottom: calc(env(safe-area-inset-bottom) + 90px);
}
.hb-pcell {
  position: relative;
  aspect-ratio: 1;
  padding: 8px 8px 26px;
  border: 3px solid #fff;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 6px 14px rgba(96, 140, 80, 0.18);
}
.hb-pcell:active {
  transform: scale(0.96);
}
.hb-pcell svg {
  display: block;
  width: 100%;
  height: 100%;
}
.hb-pcell em {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 6px;
  font-style: normal;
  font-size: 12px;
  font-weight: 800;
  color: #7fa06c;
}
.hb-drip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 64px;
  background: #b7e3a9;
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  pointer-events: none;
}
.hb-drip::before,
.hb-drip::after {
  content: "";
  position: absolute;
  bottom: 100%;
  width: 46px;
  height: 34px;
  border-radius: 50% 50% 0 0;
  background: #b7e3a9;
}
.hb-drip::before {
  left: 12%;
}
.hb-drip::after {
  right: 18%;
  height: 50px;
  width: 54px;
}

/* ------- 涂色 ------- */
.hb-sayRow {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  padding: 2px 0 6px;
}
.hb-say {
  position: relative;
  padding: 7px 22px;
  border-radius: 999px;
  background: #fff;
  color: #5f8f4d;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 2px;
  box-shadow: 0 3px 0 #cfe8c6;
}
.hb-say::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -7px;
  width: 14px;
  height: 14px;
  transform: translateX(-50%) rotate(45deg);
  background: #fff;
}
.hb-stage {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 0;
  padding: 0 14px;
}
.hb-canvas {
  position: relative;
  height: 100%;
  aspect-ratio: 1;
  max-width: 100%;
  margin: 0 auto;
  border-radius: 22px;
  background: #fff;
  border: 3px dashed #a9d69b;
  overflow: hidden;
}
.hb-svg {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
}
.hb-ref {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px 14px;
  border: 0;
  border-radius: 12px;
  background: #cfe8c6;
  color: #4f7a3f;
  font-size: 12px;
  font-weight: 900;
}
.hb-ref.on {
  background: #7fb77e;
  color: #fff;
}

/* ------- 工具栏 ------- */
.hb-tools {
  position: relative;
  z-index: 2;
  margin: 8px 12px calc(env(safe-area-inset-bottom) + 10px);
  padding: 10px 12px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 6px 18px rgba(96, 140, 80, 0.18);
}
.hb-toolRow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.hb-tool {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 11px;
  border: 0;
  border-radius: 999px;
  background: #eef8e9;
  color: #6f8f5e;
  font-size: 12px;
  font-weight: 800;
}
.hb-tool span {
  font-size: 13px;
}
.hb-tool.on {
  background: linear-gradient(180deg, #a9d69b, #8fc98a);
  color: #fff;
}
.hb-tool:disabled {
  opacity: 0.45;
}
.hb-tool.primary {
  flex: 1;
  justify-content: center;
  background: linear-gradient(180deg, #ff9a8b, #f2685e);
  color: #fff;
  box-shadow: 0 2px 0 #d5534a;
  font-size: 13px;
}
.hb-bottomBar {
  display: flex;
  gap: 8px;
  margin-top: 9px;
}
.hb-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.hb-label {
  flex: 0 0 32px;
  font-size: 12px;
  font-weight: 800;
  color: #7fa06c;
}
.hb-palette {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.hb-swatch {
  width: 24px;
  height: 24px;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #dcefd5;
}
.hb-swatch.on {
  box-shadow: 0 0 0 2.5px #7fb77e;
  transform: scale(1.12);
}
.hb-swatch.custom {
  position: relative;
  overflow: hidden;
  background: conic-gradient(#f26d6d, #ffd98e, #a8d5a2, #b7d8f5, #c7b4f2, #f26d6d);
}
.hb-swatch.custom input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.hb-range {
  flex: 1;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 999px;
  background: #dcefd5;
  outline: none;
}
.hb-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #8fc98a;
  border: 3px solid #fff;
  box-shadow: 0 1px 4px rgba(96, 140, 80, 0.5);
}
.hb-toast {
  position: absolute;
  left: 50%;
  bottom: 24%;
  z-index: 60;
  transform: translateX(-50%);
  padding: 9px 20px;
  border-radius: 999px;
  background: rgba(50, 80, 40, 0.85);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
.hb-fade-enter-active,
.hb-fade-leave-active {
  transition: opacity 0.25s;
}
.hb-fade-enter-from,
.hb-fade-leave-to {
  opacity: 0;
}
</style>
