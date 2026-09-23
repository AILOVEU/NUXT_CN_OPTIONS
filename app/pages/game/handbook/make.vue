<template>
  <div class="hb-root">
  <div class="hb-make">
    <!-- ============ 顶部栏 ============ -->
    <header class="hb-head">
      <button class="hb-round" @click="onBack">←</button>
      <div class="hb-head-title">
        <template v-if="step === 'bg'">选择背景</template>
        <template v-else>{{ tapeMode ? "贴胶带" : "装饰手帐" }}</template>
      </div>
      <button v-if="step === 'edit'" class="hb-done" @click="openDone">完成</button>
      <span v-else class="hb-round-holder" />
    </header>

    <!-- ============ 第一步：选背景 ============ -->
    <div v-if="step === 'bg'" class="hb-bgpick">
      <div class="hb-bgtip">
        <span class="hb-bgtip-line">请先选择</span>
        <span class="hb-bgtip-line">你的手帐背景</span>
        <i class="hb-spark">✦</i>
      </div>

      <div class="hb-bgscroll">
        <button
          v-for="(b, i) in BACKGROUNDS"
          :key="b.id"
          class="hb-bgcard"
          :class="{ on: i === bgIndex }"
          @click="bgIndex = i"
        >
          <svg viewBox="0 0 800 1050" class="hb-bgsvg" preserveAspectRatio="xMidYMid meet">
            <rect width="800" height="1050" :fill="b.paper" />
            <path :d="b.frame" :fill="b.inner" :stroke="b.line" stroke-width="20" />
          </svg>
          <em>{{ b.name }}</em>
          <span v-if="i === bgIndex" class="hb-bgcheck">✓</span>
        </button>
      </div>

      <div class="hb-bgfoot">
        <button class="hb-start" @click="startEdit">开始</button>
      </div>
    </div>

    <!-- ============ 第二步：编辑 ============ -->
    <template v-else>
      <div class="hb-stage">
        <div class="hb-paper">
          <svg
            ref="svgRef"
            class="hb-svg"
            viewBox="0 0 800 1050"
            preserveAspectRatio="xMidYMid meet"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="onUp"
          >
            <defs>
              <pattern id="hb-tex-outer" :width="bg.tile.size" :height="bg.tile.size" patternUnits="userSpaceOnUse">
                <g v-html="bg.tile.markup" />
              </pattern>
              <pattern id="hb-tex-inner" :width="bg.tile.size" :height="bg.tile.size" patternUnits="userSpaceOnUse">
                <g v-html="bg.tile.markup" />
              </pattern>
              <clipPath id="hb-clip"><path :d="bg.frame" /></clipPath>
            </defs>

            <rect width="800" height="1050" :fill="bg.paper" />
            <rect width="800" height="1050" fill="url(#hb-tex-outer)" />

            <g clip-path="url(#hb-clip)">
              <path :d="bg.frame" :fill="bg.inner" />
              <rect width="800" height="1050" fill="url(#hb-tex-inner)" />
            </g>
            <path :d="bg.frame" fill="none" :stroke="bg.line" stroke-width="16" />

            <!-- 手帐内容 -->
            <g v-for="it in items" :key="it.id" :data-id="it.id" class="hb-item">
              <template v-if="it.type === 'sticker'">
                <g :transform="stickerTransform(it)" v-html="stickerMarkup(it.ref)" />
                <g :transform="stickerTransform(it)">
                  <rect x="0" y="0" width="100" height="100" fill="transparent" />
                </g>
              </template>

              <template v-else-if="it.type === 'tape'">
                <g :transform="`translate(${it.x},${it.y}) rotate(${it.rot})`">
                  <svg
                    :x="-it.len / 2"
                    :y="-it.th / 2"
                    :width="it.len"
                    :height="it.th"
                    :viewBox="`0 0 ${it.len} ${it.th}`"
                  >
                    <g
                      v-for="tile in tapeTiles(it.len, it.th)"
                      :key="tile.k"
                      :transform="tile.t"
                      v-html="tapeTileMarkup(it.ref)"
                    />
                  </svg>
                  <rect :x="-it.len / 2" :y="-it.th / 2" :width="it.len" :height="it.th" fill="transparent" />
                </g>
              </template>

              <template v-else>
                <g :transform="`translate(${it.x},${it.y}) rotate(${it.rot})`">
                  <text
                    :x="0"
                    :y="0"
                    text-anchor="middle"
                    dominant-baseline="central"
                    :font-size="it.size"
                    :fill="it.color"
                    :font-family="FONT"
                    font-weight="800"
                  >
                    {{ it.text }}
                  </text>
                  <rect
                    :x="-Math.max(80, it.text.length * it.size * 0.95) / 2"
                    :y="-it.size * 0.78"
                    :width="Math.max(80, it.text.length * it.size * 0.95)"
                    :height="it.size * 1.56"
                    fill="transparent"
                  />
                </g>
              </template>
            </g>

            <!-- 待确认胶带 -->
            <g v-if="tapePending" class="hb-pending">
              <g
                :transform="`translate(${(tapePending.x1 + tapePending.x2) / 2},${(tapePending.y1 + tapePending.y2) / 2}) rotate(${
                  (Math.atan2(tapePending.y2 - tapePending.y1, tapePending.x2 - tapePending.x1) * 180) / Math.PI
                })`"
              >
                <svg
                  :x="-pendingLen / 2"
                  :y="-tapeSize / 2"
                  :width="pendingLen"
                  :height="tapeSize"
                  :viewBox="`0 0 ${pendingLen} ${tapeSize}`"
                  opacity="0.92"
                >
                  <g
                    v-for="tile in tapeTiles(pendingLen, tapeSize)"
                    :key="tile.k"
                    :transform="tile.t"
                    v-html="tapeTileMarkup(TAPES[tapeIndex].id)"
                  />
                </svg>
              </g>
            </g>

            <!-- 选中控件 -->
            <g v-if="handles && !tapeMode" class="hb-handle">
              <rect
                :x="handles.box.cx - handles.box.w / 2 - 6"
                :y="handles.box.cy - handles.box.h / 2 - 6"
                :width="handles.box.w + 12"
                :height="handles.box.h + 12"
                :transform="`rotate(${handles.box.rot} ${handles.box.cx} ${handles.box.cy})`"
                fill="none"
                stroke="#5C6B7A"
                stroke-width="2.4"
                stroke-dasharray="12 10"
                opacity="0.75"
              />
              <g :data-del="selectedId" style="cursor: pointer">
                <circle :cx="handles.del.x" :cy="handles.del.y" r="34" fill="#FFFFFF" stroke="#5C6B7A" stroke-width="3" />
                <path
                  :d="trashPath(handles.del)"
                  fill="none"
                  stroke="#5C6B7A"
                  stroke-width="4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
              <g :data-rot="selectedId" style="cursor: grab">
                <circle :cx="handles.rot.x" :cy="handles.rot.y" r="34" fill="#EAF3FB" stroke="#5C6B7A" stroke-width="3" />
                <path
                  :d="rotatePath(handles.rot)"
                  fill="none"
                  stroke="#5C6B7A"
                  stroke-width="4"
                  stroke-linecap="round"
                />
              </g>
            </g>
          </svg>
        </div>

        <div class="hb-float">
          <button class="hb-mini" :disabled="!history.length" @click="undo">↺ 撤销</button>
          <button class="hb-mini" :disabled="!future.length" @click="redo">↻ 重做</button>
          <button class="hb-mini" @click="randomFill">✨ 一键布置</button>
          <button class="hb-mini danger" @click="clearAll">清空</button>
        </div>
      </div>

      <!-- ============ 选中编辑条 ============ -->
      <div v-if="selectedItem && !tapeMode" class="hb-editbar">
        <div class="hb-editrow">
          <span class="hb-editlabel">{{ typeName(selectedItem) }}</span>
          <input type="range" class="hb-range" :min="rangeOf(selectedItem).min" :max="rangeOf(selectedItem).max" :step="rangeOf(selectedItem).step" :value="rangeOf(selectedItem).get()" @input="(e) => rangeOf(selectedItem).set(+e.target.value)" />
        </div>
        <div class="hb-editrow">
          <span class="hb-editlabel">旋转</span>
          <input type="range" class="hb-range" min="-180" max="180" step="1" :value="selectedItem.rot" @input="(e) => (selectedItem.rot = +e.target.value)" />
        </div>
        <div class="hb-editbtns">
          <button class="hb-mini" @click="duplicate">复制</button>
          <button class="hb-mini" @click="bringTop">置顶</button>
          <button class="hb-mini" @click="sendBottom">置底</button>
          <button class="hb-mini danger" @click="removeItem(selectedId)">删除</button>
        </div>
      </div>

      <!-- ============ 素材面板 ============ -->
      <section class="hb-panel">
        <div class="hb-tabs">
          <button class="hb-tab" :class="{ on: panel === 'sticker' }" @click="setPanel('sticker')">
            <span class="hb-tab-icon">✿</span>贴纸
          </button>
          <button class="hb-tab" :class="{ on: panel === 'tape' }" @click="setPanel('tape')">
            <span class="hb-tab-icon">◎</span>胶带
          </button>
          <button class="hb-tab" :class="{ on: panel === 'text' }" @click="setPanel('text')">
            <span class="hb-tab-icon">✎</span>文字
          </button>
        </div>

        <div v-if="panel === 'sticker'" class="hb-panel-body">
          <div class="hb-cats">
            <button
              v-for="c in STICKER_CATEGORIES"
              :key="c.key"
              class="hb-cat"
              :class="{ on: catKey === c.key }"
              @click="catKey = c.key"
            >
              {{ c.name }}
            </button>
          </div>
          <div class="hb-stickers">
            <button v-for="s in currentStickers" :key="s.id" class="hb-sticker" @click="addSticker(s)">
              <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><g v-html="s.svg" /></svg>
            </button>
          </div>
        </div>

        <div v-else-if="panel === 'tape'" class="hb-panel-body">
          <div class="hb-taperow">
            <span class="hb-editlabel">大小</span>
            <input type="range" class="hb-range" min="26" max="110" step="2" v-model.number="tapeSize" />
          </div>
          <p class="hb-hint">{{ tapeMode ? "在画布上按住拖动，即可贴出胶带" : "点选胶带后进入贴胶带模式" }}</p>
          <div class="hb-tapes">
            <button
              v-for="(t, i) in TAPES"
              :key="t.id"
              class="hb-tape"
              :class="{ on: tapeMode && tapeIndex === i }"
              @click="pickTape(i)"
            >
              <svg viewBox="0 0 200 56" preserveAspectRatio="xMidYMid meet"><g v-html="t.svg" /></svg>
              <em>{{ t.name }}</em>
            </button>
          </div>
          <div v-if="tapeMode" class="hb-tapedone">
            <button class="hb-start small" @click="tapeMode = false">确定</button>
          </div>
        </div>

        <div v-else class="hb-panel-body">
          <div class="hb-textrow">
            <input v-model="textValue" class="hb-input" maxlength="14" placeholder="写点什么…" />
            <button class="hb-mini primary" @click="addText">添加</button>
          </div>
          <div class="hb-editrow">
            <span class="hb-editlabel">字号</span>
            <input type="range" class="hb-range" min="28" max="110" step="2" v-model.number="textSize" />
          </div>
          <div class="hb-colors">
            <button
              v-for="c in TEXT_COLORS"
              :key="c"
              class="hb-color"
              :class="{ on: textColor === c }"
              :style="{ background: c }"
              @click="textColor = c"
            />
          </div>
          <div class="hb-quick">
            <button v-for="q in QUICK_TEXTS" :key="q" class="hb-mini" @click="textValue = q">{{ q }}</button>
          </div>
        </div>
      </section>
    </template>

    <!-- ============ 完成弹层 ============ -->
    <div v-if="doneOpen" class="hb-mask" @click.self="doneOpen = false">
      <div class="hb-doneCard">
        <div class="hb-doneTitle">我的精美手帐</div>
        <div class="hb-doneArt">
          <svg viewBox="0 0 800 1050" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="hb-d-tex" :width="bg.tile.size" :height="bg.tile.size" patternUnits="userSpaceOnUse">
                <g v-html="bg.tile.markup" />
              </pattern>
              <clipPath id="hb-d-clip"><path :d="bg.frame" /></clipPath>
            </defs>
            <rect width="800" height="1050" :fill="bg.paper" />
            <rect width="800" height="1050" fill="url(#hb-d-tex)" />
            <g clip-path="url(#hb-d-clip)">
              <path :d="bg.frame" :fill="bg.inner" />
              <rect width="800" height="1050" fill="url(#hb-d-tex)" />
            </g>
            <path :d="bg.frame" fill="none" :stroke="bg.line" stroke-width="16" />
            <g v-for="it in items" :key="'d' + it.id">
              <template v-if="it.type === 'sticker'">
                <g :transform="stickerTransform(it)" v-html="stickerMarkup(it.ref)" />
              </template>
              <template v-else-if="it.type === 'tape'">
                <g :transform="`translate(${it.x},${it.y}) rotate(${it.rot})`">
                  <svg :x="-it.len / 2" :y="-it.th / 2" :width="it.len" :height="it.th" :viewBox="`0 0 ${it.len} ${it.th}`">
                    <g
                      v-for="tile in tapeTiles(it.len, it.th)"
                      :key="tile.k"
                      :transform="tile.t"
                      v-html="tapeTileMarkup(it.ref)"
                    />
                  </svg>
                </g>
              </template>
              <template v-else>
                <g :transform="`translate(${it.x},${it.y}) rotate(${it.rot})`">
                  <text x="0" y="0" text-anchor="middle" dominant-baseline="central" :font-size="it.size" :fill="it.color" :font-family="FONT" font-weight="800">
                    {{ it.text }}
                  </text>
                </g>
              </template>
            </g>
          </svg>
        </div>
        <div class="hb-doneBtns">
          <button class="hb-mini" @click="restart">重新开始</button>
          <button class="hb-mini primary" :disabled="saving" @click="saveToAlbum">{{ saving ? "保存中…" : "保存到相册" }}</button>
        </div>
        <button class="hb-mini ghost" @click="doneOpen = false; step = 'edit'">继续编辑</button>
      </div>
    </div>

    <transition name="hb-fade">
      <div v-if="toastText" class="hb-toast">{{ toastText }}</div>
    </transition>
  </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { STICKER_CATEGORIES, STICKER_MAP } from "./data/stickers.js";
import { TAPES } from "./data/tapes.js";
import { BACKGROUNDS, PAGE } from "./data/backgrounds.js";
import { exportSvgAsPng, saveWork } from "./data/render.js";

useHead({
  title: "制作手帐",
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" }],
});

const FONT = "'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Nunito',system-ui,sans-serif";
const TEXT_COLORS = ["#8C6B4F", "#F26D6D", "#F5A26B", "#7FB77E", "#7FA9DE", "#B3A2EE", "#E88CB4", "#3E4A5A"];
const QUICK_TEXTS = ["Nice Day!", "今天也很棒", "小确幸", "日记", "2026", "❤"];

const router = useRouter();
const step = ref("bg");
const bgIndex = ref(0);
const bg = computed(() => BACKGROUNDS[bgIndex.value]);

const svgRef = ref(null);
const items = ref([]);
const selectedId = ref(null);
const history = ref([]);
const future = ref([]);

const panel = ref("sticker");
const catKey = ref("forest");
const tapeIndex = ref(0);
const tapeSize = ref(52);
const tapeMode = ref(false);
const tapePending = ref(null);
const textValue = ref("");
const textSize = ref(52);
const textColor = ref("#8C6B4F");

const doneOpen = ref(false);
const saving = ref(false);
const toastText = ref("");

let uidSeed = 0;
const uid = () => `it-${Date.now().toString(36)}-${++uidSeed}`;

const currentStickers = computed(() => STICKER_CATEGORIES.find((c) => c.key === catKey.value)?.items || []);
const selectedItem = computed(() => items.value.find((i) => i.id === selectedId.value) || null);
const pendingLen = computed(() =>
  tapePending.value ? Math.max(60, Math.hypot(tapePending.value.x2 - tapePending.value.x1, tapePending.value.y2 - tapePending.value.y1)) : 60
);

function toast(msg) {
  toastText.value = msg;
  setTimeout(() => {
    if (toastText.value === msg) toastText.value = "";
  }, 1600);
}

function stickerMarkup(id) {
  const s = STICKER_MAP[id];
  return s ? s.svg : "";
}
function tapeMarkup(id) {
  const t = TAPES.find((x) => x.id === id);
  return t ? t.svg : "";
}
/** 平铺用的胶带素材（无圆角，可无缝拼接） */
function tapeTileMarkup(id) {
  const t = TAPES.find((x) => x.id === id);
  return t ? t.tile : "";
}
/**
 * 把 200×56 的胶带图案沿长度方向平铺复制：
 * 高度方向等比缩放（s = th/56），再按 s 计算需要的份数
 */
function tapeTiles(len, th) {
  const s = Math.max(0.1, th / 56);
  const step = 200 * s;
  const count = Math.max(1, Math.ceil(len / step));
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({ k: i, t: `translate(${(i * step).toFixed(1)},0) scale(${s.toFixed(4)})` });
  }
  return out;
}
function stickerTransform(it) {
  return `translate(${it.x},${it.y}) rotate(${it.rot}) scale(${it.scale}) translate(-50,-50)`;
}

function geomOf(it) {
  if (it.type === "sticker") {
    const s = it.scale * 100;
    return { cx: it.x, cy: it.y, w: s, h: s, rot: it.rot };
  }
  if (it.type === "tape") return { cx: it.x, cy: it.y, w: it.len, h: it.th, rot: it.rot };
  const w = Math.max(80, it.text.length * it.size * 0.95);
  return { cx: it.x, cy: it.y, w, h: it.size * 1.56, rot: it.rot };
}

const handles = computed(() => {
  const it = selectedItem.value;
  if (!it) return null;
  const g = geomOf(it);
  const a = (g.rot * Math.PI) / 180;
  const dx = (Math.max(g.w, 70) / 2) * 0.92;
  const dy = (Math.max(g.h, 70) / 2) * 0.92;
  const pt = (px, py) => ({ x: g.cx + px * Math.cos(a) - py * Math.sin(a), y: g.cy + px * Math.sin(a) + py * Math.cos(a) });
  return { box: g, del: pt(-dx, -dy), rot: pt(dx, dy) };
});

function trashPath(p) {
  const x = p.x;
  const y = p.y;
  return `M${x - 13},${y - 11}h26v24h-26zM${x - 18},${y - 11}h36M${x - 5},${y - 18}h10v7h-10z`;
}
function rotatePath(p) {
  const x = p.x;
  const y = p.y;
  return `M${x - 13},${y + 4}a13 13 0 1 1 6 11M${x - 13},${y + 4}l-1-9M${x - 13},${y + 4}l9 2`;
}

/* ---------------- 撤销 / 重做 ---------------- */
function snapshot() {
  return JSON.parse(JSON.stringify(items.value));
}
function pushHistory() {
  history.value.push(snapshot());
  if (history.value.length > 40) history.value.shift();
  future.value = [];
}
function undo() {
  if (!history.value.length) return;
  future.value.push(snapshot());
  items.value = history.value.pop();
  selectedId.value = null;
}
function redo() {
  if (!future.value.length) return;
  history.value.push(snapshot());
  items.value = future.value.pop();
  selectedId.value = null;
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
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

let drag = null;

function onDown(e) {
  const p = clientToSvg(e);
  const el = e.target instanceof Element ? e.target : null;
  try {
    svgRef.value.setPointerCapture(e.pointerId);
  } catch (err) {
    /* ignore */
  }

  const delHit = el && el.closest("[data-del]");
  if (delHit) {
    removeItem(delHit.getAttribute("data-del"));
    return;
  }
  const rotHit = el && el.closest("[data-rot]");
  if (rotHit && selectedItem.value) {
    const it = selectedItem.value;
    pushHistory();
    drag = { mode: "rotate", id: it.id, start: it.rot, base: (Math.atan2(p.y - it.y, p.x - it.x) * 180) / Math.PI };
    return;
  }

  if (tapeMode.value) {
    drag = { mode: "draw" };
    tapePending.value = { x1: p.x, y1: p.y, x2: p.x, y2: p.y };
    return;
  }

  const hit = el && el.closest("[data-id]");
  if (hit) {
    const id = hit.getAttribute("data-id");
    const it = items.value.find((i) => i.id === id);
    if (it) {
      selectedId.value = id;
      pushHistory();
      drag = { mode: "move", id, ox: p.x - it.x, oy: p.y - it.y };
      return;
    }
  }
  selectedId.value = null;
}

function onMove(e) {
  if (!drag) return;
  const p = clientToSvg(e);
  if (drag.mode === "move") {
    const it = items.value.find((i) => i.id === drag.id);
    if (!it) return;
    it.x = clamp(p.x - drag.ox, 0, PAGE.w);
    it.y = clamp(p.y - drag.oy, 0, PAGE.h);
  } else if (drag.mode === "rotate") {
    const it = items.value.find((i) => i.id === drag.id);
    if (!it) return;
    const a = (Math.atan2(p.y - it.y, p.x - it.x) * 180) / Math.PI;
    it.rot = Math.round(drag.start + (a - drag.base));
  } else if (drag.mode === "draw" && tapePending.value) {
    tapePending.value.x2 = p.x;
    tapePending.value.y2 = p.y;
  }
}

function onUp() {
  if (drag && drag.mode === "draw" && tapePending.value) {
    const t = tapePending.value;
    const len = Math.hypot(t.x2 - t.x1, t.y2 - t.y1);
    if (len > 90) {
      pushHistory();
      const it = {
        id: uid(),
        type: "tape",
        ref: TAPES[tapeIndex.value].id,
        x: (t.x1 + t.x2) / 2,
        y: (t.y1 + t.y2) / 2,
        rot: Math.round((Math.atan2(t.y2 - t.y1, t.x2 - t.x1) * 180) / Math.PI),
        len,
        th: tapeSize.value,
      };
      items.value.push(it);
      selectedId.value = it.id;
    }
    tapePending.value = null;
  }
  drag = null;
}

/* ---------------- 增删改 ---------------- */
function addSticker(s) {
  pushHistory();
  const it = {
    id: uid(),
    type: "sticker",
    ref: s.id,
    x: PAGE.w / 2 + (Math.random() - 0.5) * 180,
    y: PAGE.h / 2 + (Math.random() - 0.5) * 180,
    scale: 1.5,
    rot: 0,
  };
  items.value.push(it);
  selectedId.value = it.id;
  tapeMode.value = false;
}

function pickTape(i) {
  tapeIndex.value = i;
  tapeMode.value = true;
  selectedId.value = null;
  panel.value = "tape";
}

function addText() {
  const t = textValue.value.trim();
  if (!t) {
    toast("先写点内容吧~");
    return;
  }
  pushHistory();
  const it = {
    id: uid(),
    type: "text",
    text: t,
    x: PAGE.w / 2,
    y: PAGE.h / 2 + 120,
    rot: 0,
    size: textSize.value,
    color: textColor.value,
  };
  items.value.push(it);
  selectedId.value = it.id;
  tapeMode.value = false;
}

function removeItem(id) {
  if (!id) return;
  const idx = items.value.findIndex((i) => i.id === id);
  if (idx < 0) return;
  pushHistory();
  items.value.splice(idx, 1);
  selectedId.value = null;
}

function duplicate() {
  const it = selectedItem.value;
  if (!it) return;
  pushHistory();
  const copy = { ...JSON.parse(JSON.stringify(it)), id: uid(), x: it.x + 40, y: it.y + 40 };
  items.value.push(copy);
  selectedId.value = copy.id;
}

function bringTop() {
  const it = selectedItem.value;
  if (!it) return;
  pushHistory();
  items.value = [...items.value.filter((i) => i.id !== it.id), it];
}
function sendBottom() {
  const it = selectedItem.value;
  if (!it) return;
  pushHistory();
  items.value = [it, ...items.value.filter((i) => i.id !== it.id)];
}

function clearAll() {
  if (!items.value.length) return;
  pushHistory();
  items.value = [];
  selectedId.value = null;
}

function randomFill() {
  pushHistory();
  const all = STICKER_CATEGORIES.flatMap((c) => c.items);
  const add = [];
  for (let i = 0; i < 6; i++) {
    const s = all[Math.floor(Math.random() * all.length)];
    add.push({
      id: uid(),
      type: "sticker",
      ref: s.id,
      x: 150 + Math.random() * 500,
      y: 180 + Math.random() * 700,
      scale: 1.2 + Math.random() * 0.9,
      rot: Math.round((Math.random() - 0.5) * 60),
    });
  }
  for (let i = 0; i < 2; i++) {
    const t = TAPES[Math.floor(Math.random() * TAPES.length)];
    const rot = Math.round((Math.random() - 0.5) * 90);
    add.push({
      id: uid(),
      type: "tape",
      ref: t.id,
      x: 240 + Math.random() * 320,
      y: 240 + Math.random() * 600,
      rot,
      len: 260 + Math.random() * 220,
      th: 44 + Math.random() * 40,
    });
  }
  items.value = [...items.value, ...add];
  selectedId.value = null;
}

function typeName(it) {
  return it.type === "tape" ? "长度" : it.type === "text" ? "字号" : "大小";
}
function rangeOf(it) {
  if (it.type === "sticker")
    return { min: 0.6, max: 3.6, step: 0.1, get: () => it.scale, set: (v) => (it.scale = v) };
  if (it.type === "tape") return { min: 120, max: 620, step: 10, get: () => Math.round(it.len), set: (v) => (it.len = v) };
  return { min: 24, max: 120, step: 2, get: () => it.size, set: (v) => (it.size = v) };
}

function setPanel(p) {
  panel.value = p;
  if (p !== "tape") tapeMode.value = false;
}

/* ---------------- 流程 ---------------- */
function startEdit() {
  step.value = "edit";
  tapeMode.value = false;
  selectedId.value = null;
}

function onBack() {
  if (step.value === "edit") {
    step.value = "bg";
    tapeMode.value = false;
    selectedId.value = null;
    return;
  }
  if (window.history.length > 1) router.back();
  else router.push("/game/handbook");
}

function openDone() {
  tapeMode.value = false;
  selectedId.value = null;
  doneOpen.value = true;
}

function restart() {
  items.value = [];
  history.value = [];
  future.value = [];
  selectedId.value = null;
  doneOpen.value = false;
  step.value = "bg";
}

async function buildSvgString() {
  const node = svgRef.value.cloneNode(true);
  node.querySelectorAll(".hb-handle, .hb-pending").forEach((n) => n.remove());
  node.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  node.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  node.setAttribute("width", String(PAGE.w));
  node.setAttribute("height", String(PAGE.h));
  node.removeAttribute("class");
  return new XMLSerializer().serializeToString(node);
}

async function saveToAlbum() {
  if (saving.value) return;
  saving.value = true;
  const keepId = selectedId.value;
  selectedId.value = null;
  try {
    await new Promise((r) => setTimeout(r, 30));
    const xml = await buildSvgString();
    const thumb = await exportSvgAsPng(xml, PAGE.w, PAGE.h, `手帐-${Date.now()}.png`, 1.4);
    saveWork({ id: uid(), mode: "make", name: "我的手帐", thumb, time: Date.now() });
    toast("已保存到相册 ~");
  } catch (e) {
    toast("导出失败，请重试");
  } finally {
    selectedId.value = keepId;
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
  background: #f3e2c2;
  font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Nunito", system-ui, sans-serif;
  color: #8c6b4f;
  -webkit-tap-highlight-color: transparent;
}
/* 内容容器：高度 100vh，宽度取 40vh 与 100vw 的较小值 */
.hb-make {
  position: relative;
  height: 100vh;
  width: min(40vh, 100vw);
  height: 100dvh;
  width: min(40dvh, 100vw);
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #fff6df, #ffeac6);
  overflow: hidden;
  box-shadow: 0 0 40px rgba(107, 74, 40, 0.18);
}
.hb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top) + 8px) 14px 8px;
}
.hb-head-title {
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 2px;
  color: #c6785e;
}
.hb-round {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: #c6785e;
  font-size: 17px;
  font-weight: 900;
  box-shadow: 0 2px 6px rgba(198, 144, 94, 0.25);
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

/* ------- 背景选择 ------- */
.hb-bgpick {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.hb-bgtip {
  position: relative;
  margin: 4px auto 10px;
  padding: 12px 26px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  text-align: center;
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 2px;
  color: #c6785e;
  box-shadow: 0 4px 12px rgba(198, 144, 94, 0.16);
}
.hb-bgtip-line {
  display: block;
  line-height: 1.5;
}
.hb-spark {
  position: absolute;
  top: -8px;
  right: -8px;
  color: #f5b96b;
  font-style: normal;
}
/* 2 列 × n 行网格 */
.hb-bgscroll {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  align-content: start;
  gap: 12px;
  padding: 10px 16px 14px;
  overflow-y: auto;
  overflow-x: hidden;
}
.hb-bgscroll::-webkit-scrollbar {
  width: 4px;
}
.hb-bgscroll::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: rgba(201, 168, 124, 0.45);
}
.hb-bgcard {
  position: relative;
  padding: 6px 6px 24px;
  border: 3px solid transparent;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffdf7, #fdeacb);
  box-shadow: 0 4px 12px rgba(198, 144, 94, 0.18);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.hb-bgcard.on {
  border-color: #f5a26b;
  box-shadow: 0 6px 16px rgba(242, 104, 94, 0.28);
}
.hb-bgsvg {
  width: 100%;
  aspect-ratio: 800 / 1050;
  height: auto;
  display: block;
  border-radius: 12px;
}
.hb-bgcard em {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 5px;
  font-style: normal;
  font-size: 11px;
  font-weight: 800;
  color: #b98a5e;
}
.hb-bgcard.on em {
  color: #e2765a;
}
.hb-bgcheck {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(180deg, #ff9a8b, #f2685e);
  color: #fff;
  font-size: 13px;
  line-height: 22px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(213, 83, 74, 0.4);
}
.hb-bgfoot {
  padding: 6px 26px calc(env(safe-area-inset-bottom) + 20px);
}
.hb-start {
  width: 100%;
  padding: 15px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(180deg, #ff9a8b, #f2685e);
  color: #fff;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 6px;
  box-shadow: 0 5px 0 #d5534a;
}
.hb-start:active {
  transform: translateY(3px);
  box-shadow: 0 2px 0 #d5534a;
}
.hb-start.small {
  width: auto;
  padding: 9px 32px;
  font-size: 15px;
  letter-spacing: 3px;
}

/* ------- 编辑舞台 ------- */
.hb-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 4px 10px 0;
}
.hb-paper {
  height: 100%;
  aspect-ratio: 800 / 1050;
  max-width: 100%;
  margin: 0 auto;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 22px rgba(198, 144, 94, 0.2);
}
.hb-svg {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
}
.hb-float {
  position: absolute;
  top: 8px;
  left: 16px;
  right: 16px;
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  pointer-events: none;
}
.hb-float .hb-mini {
  pointer-events: auto;
}

/* ------- 编辑条 ------- */
.hb-editbar {
  margin: 6px 12px 0;
  padding: 8px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 4px 12px rgba(198, 144, 94, 0.16);
}
.hb-editrow {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hb-editlabel {
  flex: 0 0 52px;
  font-size: 12px;
  font-weight: 800;
  color: #b98a5e;
}
.hb-range {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 999px;
  background: #ffe3c2;
  outline: none;
}
.hb-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f5a26b;
  border: 3px solid #fff;
  box-shadow: 0 1px 4px rgba(198, 144, 94, 0.5);
}
.hb-editbtns {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.hb-editbtns .hb-mini {
  flex: 1;
}

/* ------- 面板 ------- */
.hb-panel {
  margin: 8px 10px calc(env(safe-area-inset-bottom) + 10px);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 6px 18px rgba(198, 144, 94, 0.18);
  overflow: hidden;
}
.hb-tabs {
  display: flex;
  border-bottom: 2px dashed #f3d9b8;
}
.hb-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 9px 0;
  border: 0;
  background: transparent;
  color: #c9a87c;
  font-size: 13px;
  font-weight: 800;
}
.hb-tab.on {
  color: #e2765a;
  background: linear-gradient(180deg, #fff4e2, transparent);
}
.hb-tab-icon {
  font-size: 15px;
}
.hb-panel-body {
  padding: 8px 10px 10px;
}
.hb-cats {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.hb-cats::-webkit-scrollbar {
  height: 0;
}
.hb-cat {
  flex: 0 0 auto;
  padding: 4px 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #c9a87c;
  font-size: 12px;
  font-weight: 800;
}
.hb-cat.on {
  background: linear-gradient(180deg, #ffe3c2, #ffd0a6);
  color: #c6785e;
}
.hb-stickers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
  gap: 6px;
  max-height: 132px;
  overflow-y: auto;
}
.hb-sticker {
  aspect-ratio: 1;
  padding: 3px;
  border: 0;
  border-radius: 12px;
  background: #fffaf0;
  box-shadow: inset 0 0 0 2px #f6e6cd;
  transition: transform 0.1s;
}
.hb-sticker:active {
  transform: scale(0.9);
}
.hb-sticker svg {
  width: 100%;
  height: 100%;
  display: block;
}
.hb-tapes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
  gap: 6px;
  max-height: 128px;
  overflow-y: auto;
}
.hb-tape {
  padding: 4px;
  border: 2px solid transparent;
  border-radius: 10px;
  background: #fffaf0;
}
.hb-tape.on {
  border-color: #f5a26b;
}
.hb-tape svg {
  display: block;
  width: 100%;
  height: 26px;
}
.hb-tape em {
  display: block;
  font-style: normal;
  font-size: 10px;
  color: #c9a87c;
  margin-top: 2px;
}
.hb-taperow {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hb-hint {
  margin: 4px 0 6px;
  font-size: 11px;
  color: #d0ab7c;
}
.hb-tapedone {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}
.hb-textrow {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}
.hb-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #f6e6cd;
  border-radius: 12px;
  background: #fffaf0;
  color: #8c6b4f;
  font-size: 14px;
  outline: none;
}
.hb-colors {
  display: flex;
  gap: 8px;
  padding: 6px 0;
}
.hb-color {
  width: 26px;
  height: 26px;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #efdcc2;
}
.hb-color.on {
  box-shadow: 0 0 0 2px #f5a26b;
}
.hb-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* ------- 通用小按钮 ------- */
.hb-mini {
  padding: 7px 12px;
  border: 0;
  border-radius: 999px;
  background: #fff4e2;
  color: #b98a5e;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 2px 0 #efdcc2;
}
.hb-mini:disabled {
  opacity: 0.45;
}
.hb-mini.primary {
  background: linear-gradient(180deg, #ff9a8b, #f2685e);
  color: #fff;
  box-shadow: 0 2px 0 #d5534a;
}
.hb-mini.danger {
  background: #ffe6e4;
  color: #e2765a;
  box-shadow: 0 2px 0 #f5cfc9;
}
.hb-mini.ghost {
  width: 100%;
  margin-top: 8px;
  background: transparent;
  color: #c9a87c;
  box-shadow: none;
}

/* ------- 完成弹层 ------- */
.hb-mask {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(70, 46, 26, 0.45);
  backdrop-filter: blur(2px);
}
.hb-doneCard {
  width: 100%;
  max-width: 380px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 14px;
  border-radius: 24px;
  background: linear-gradient(180deg, #fffdf7, #fff3dd);
  border: 3px solid #f3d9b8;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.24);
}
.hb-doneTitle {
  margin: 4px auto 10px;
  padding: 6px 22px;
  width: fit-content;
  border-radius: 999px;
  background: #fff6e4;
  border: 2px dashed #f0d6b4;
  color: #c6785e;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 2px;
}
.hb-doneArt {
  border-radius: 14px;
  overflow: hidden;
  background: #fffdf7;
}
.hb-doneArt svg {
  display: block;
  width: 100%;
  max-height: 48vh;
}
.hb-doneBtns {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.hb-doneBtns .hb-mini {
  flex: 1;
  padding: 12px 8px;
  font-size: 14px;
}

/* ------- toast ------- */
.hb-toast {
  position: absolute;
  left: 50%;
  bottom: 22%;
  z-index: 60;
  transform: translateX(-50%);
  padding: 9px 20px;
  border-radius: 999px;
  background: rgba(70, 46, 26, 0.82);
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
