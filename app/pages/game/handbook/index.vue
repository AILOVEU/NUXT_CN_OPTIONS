<template>
  <div class="hb-root">
    <div class="hb-home">
    <div class="hb-stripes" />

    <header class="hb-top">
      <div class="hb-brand">
        <span class="hb-brand-icon">✦</span>
        <span>元气手帐屋</span>
      </div>
      <button class="hb-mine" @click="openMine">
        <svg viewBox="0 0 100 100" class="hb-avatar">
          <circle cx="24" cy="26" r="14" fill="#E8A87C" />
          <circle cx="76" cy="26" r="14" fill="#E8A87C" />
          <circle cx="50" cy="56" r="36" fill="#F0B98F" />
          <ellipse cx="50" cy="68" rx="20" ry="15" fill="#FFF6E5" />
          <circle cx="38" cy="48" r="4.5" fill="#3E4A5A" />
          <circle cx="62" cy="48" r="4.5" fill="#3E4A5A" />
          <ellipse cx="50" cy="60" rx="6" ry="4.5" fill="#5A4630" />
          <circle cx="26" cy="64" r="6" fill="#FFB8C9" opacity="0.75" />
          <circle cx="74" cy="64" r="6" fill="#FFB8C9" opacity="0.75" />
        </svg>
        <em>我的</em>
        <i v-if="works.length" class="hb-badge">{{ works.length }}</i>
      </button>
    </header>

    <h1 class="hb-title"><span>✦</span> 选择模式 <span>✦</span></h1>

    <div class="hb-shelf">
      <button class="hb-card" @click="go('make')">
        <div class="hb-card-inner">
          <div class="hb-pill">制作手帐</div>
          <svg viewBox="0 0 220 150" class="hb-art">
            <rect x="34" y="14" width="152" height="124" rx="14" fill="#FFFDF7" stroke="#E9CDA1" stroke-width="3" />
            <path d="M34 20h152" stroke="#F3D9B8" stroke-width="3" stroke-dasharray="7 7" />
            <text x="110" y="44" text-anchor="middle" font-size="17" fill="#C6905E" font-family="Georgia, serif" font-style="italic">Nice</text>
            <text x="110" y="64" text-anchor="middle" font-size="17" fill="#C6905E" font-family="Georgia, serif" font-style="italic">DAY!</text>
            <g transform="translate(78,62) scale(0.62)">
              <circle cx="50" cy="28" r="15" fill="#FFC9D6" />
              <circle cx="50" cy="72" r="15" fill="#FFC9D6" />
              <circle cx="28" cy="50" r="15" fill="#FFC9D6" />
              <circle cx="72" cy="50" r="15" fill="#FFC9D6" />
              <circle cx="50" cy="50" r="13" fill="#FFE7A8" />
              <circle cx="50" cy="50" r="6" fill="#F7C948" />
            </g>
            <path d="M46 106c14 0 26 10 30 24H34c2-14 8-24 12-24z" fill="#A8D5A2" />
            <path d="M76 106c14 0 24 10 28 24H60c2-14 8-24 16-24z" fill="#8FC98A" />
          </svg>
        </div>
        <span class="hb-card-shadow" aria-hidden="true" />
      </button>

      <button class="hb-card" @click="go('color')">
        <div class="hb-card-inner">
          <div class="hb-pill">贴纸涂色</div>
          <svg viewBox="0 0 220 150" class="hb-art">
            <rect x="18" y="10" width="184" height="130" rx="14" fill="#FFFDF7" />
            <path d="M110 26c0-8 6-12 12-14 0 8-4 14-12 14z" fill="#7FB77E" />
            <circle cx="96" cy="46" r="22" fill="#FFF6E5" stroke="#E4CFB0" stroke-width="3" />
            <circle cx="134" cy="44" r="20" fill="#FFF6E5" stroke="#E4CFB0" stroke-width="3" />
            <path d="M110 52c16 0 26 6 26 14 0 10-12 18-26 18s-26-8-26-18c0-8 10-14 26-14z" fill="#A8D5A2" stroke="#8FC98A" stroke-width="3" />
            <path d="M84 60c-4-8-12-12-18-12 0 10 6 16 16 16z" fill="#A8D5A2" />
            <path d="M136 60c4-8 12-12 18-12 0 10-6 16-16 16z" fill="#8FC98A" />
            <path d="M86 84h48l-20 52h-8z" fill="#FFD98E" stroke="#E8B96A" stroke-width="3" />
            <path d="M94 88l14 44M126 88l-14 44M110 84v48" stroke="#E8B96A" stroke-width="2.4" />
            <circle cx="110" cy="32" r="12" fill="#F26D6D" />
            <path d="M110 22c2-8 8-10 12-10" stroke="#7FB77E" stroke-width="4" fill="none" stroke-linecap="round" />
          </svg>
        </div>
        <span class="hb-card-shadow" aria-hidden="true" />
      </button>
    </div>

    <p class="hb-tip">
      共 <b>{{ stickerTotal }}</b> 枚贴纸 · <b>{{ tapeTotal }}</b> 款胶带 · <b>{{ bgTotal }}</b> 款背景 ·
      <b>{{ patternTotal }}</b> 张涂色线稿
    </p>

    <!-- 我的作品 -->
    <div v-if="mineOpen" class="hb-sheet-mask" @click.self="mineOpen = false">
      <div class="hb-sheet">
        <div class="hb-sheet-head">
          <span>我的作品</span>
          <button class="hb-close" @click="mineOpen = false">✕</button>
        </div>
        <div v-if="!works.length" class="hb-empty">
          <p>还没有作品哦～</p>
          <p class="hb-empty-sub">做完手帐或涂色记得保存到相册</p>
        </div>
        <div v-else class="hb-grid">
          <div v-for="w in works" :key="w.id" class="hb-work">
            <img :src="w.thumb" :alt="w.name" @click="preview = w" />
            <div class="hb-work-meta">
              <span>{{ w.mode === "color" ? "涂色" : "手帐" }}</span>
              <button class="hb-del" @click="del(w.id)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="preview" class="hb-sheet-mask" @click.self="preview = null">
      <img class="hb-preview" :src="preview.thumb" alt="作品预览" />
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { STICKER_TOTAL } from "./data/stickers.js";
import { TAPES } from "./data/tapes.js";
import { BACKGROUNDS } from "./data/backgrounds.js";
import { PATTERN_TOTAL } from "./data/patterns.js";
import { loadWorks, removeWork } from "./data/render.js";

useHead({
  title: "元气手帐屋",
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" }],
});

const router = useRouter();
const stickerTotal = STICKER_TOTAL;
const tapeTotal = TAPES.length;
const bgTotal = BACKGROUNDS.length;
const patternTotal = PATTERN_TOTAL;

const works = ref([]);
const mineOpen = ref(false);
const preview = ref(null);

function go(mode) {
  router.push(mode === "make" ? "/game/handbook/make" : "/game/handbook/color");
}

function openMine() {
  works.value = loadWorks();
  mineOpen.value = true;
}

function del(id) {
  works.value = removeWork(id);
}

onMounted(() => {
  works.value = loadWorks();
});
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
.hb-home {
  position: relative;
  height: 100vh;
  width: min(40vh, 100vw);
  height: 100dvh;
  width: min(40dvh, 100vw);
  padding: calc(env(safe-area-inset-top) + 12px) 16px calc(env(safe-area-inset-bottom) + 20px);
  background: linear-gradient(180deg, #ffeec8 0%, #ffe3b8 40%, #ffd9a8 100%);
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 0 0 40px rgba(107, 74, 40, 0.18);
}
.hb-stripes {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.42) 0 16px, transparent 16px 32px);
  opacity: 0.55;
  pointer-events: none;
}
.hb-top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.hb-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  font-weight: 800;
  color: #c08a56;
  box-shadow: 0 2px 0 rgba(201, 168, 124, 0.4);
}
.hb-brand-icon {
  color: #f5a26b;
}
.hb-mine {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  border: 0;
  background: transparent;
  font-size: 11px;
  font-weight: 700;
  color: #b98a5e;
}
.hb-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #fff7ea;
  border: 3px solid #fff;
  box-shadow: 0 3px 8px rgba(196, 144, 94, 0.28);
}
.hb-mine em {
  font-style: normal;
}
.hb-badge {
  position: absolute;
  top: -2px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: #f26d6d;
  color: #fff;
  font-size: 11px;
  font-style: normal;
  line-height: 18px;
  text-align: center;
}
.hb-title {
  position: relative;
  margin: 16px 0 8px;
  text-align: center;
  font-size: 24px;
  letter-spacing: 4px;
  color: #d59a5f;
  font-weight: 900;
  text-shadow: 0 2px 0 #fff8ea;
}
.hb-title span {
  color: #f5b96b;
  font-size: 18px;
}
.hb-shelf {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 26px;
  padding: 22px 18px 34px;
  border-radius: 30px;
  background: linear-gradient(180deg, #fff8ea 0%, #fdeacb 100%);
  border: 4px solid #f3d9b8;
  box-shadow: inset 0 -8px 0 rgba(233, 205, 161, 0.35), 0 10px 24px rgba(198, 144, 94, 0.22);
}
.hb-shelf::before,
.hb-shelf::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 14px;
  background: linear-gradient(180deg, #f7dcb6, #e9cba1);
  box-shadow: 0 4px 0 rgba(214, 176, 130, 0.5);
}
.hb-shelf::before {
  top: 50%;
  transform: translateY(-50%);
}
.hb-shelf::after {
  bottom: -10px;
  border-radius: 0 0 6px 6px;
}
.hb-card {
  position: relative;
  border: 0;
  background: transparent;
  padding: 0 0 8px;
  transition: transform 0.15s;
}
.hb-card:active {
  transform: translateY(3px);
}
.hb-card-inner {
  position: relative;
  z-index: 2;
  padding: 12px 16px 10px;
  border-radius: 22px;
  background: #fffdf7;
  border: 3px dashed #f0d6b4;
  box-shadow: 0 8px 18px rgba(198, 144, 94, 0.18);
}
.hb-card-shadow {
  position: absolute;
  z-index: 1;
  inset: 8px 10px -2px;
  border-radius: 22px;
  background: #f6e3c6;
  border: 3px dashed #eed3ae;
}
.hb-pill {
  display: inline-block;
  margin: 0 auto 6px;
  padding: 5px 20px;
  border-radius: 999px;
  background: linear-gradient(180deg, #fff8ea, #fdecd2);
  border: 2px solid #f0d6b4;
  color: #c6785e;
  font-size: 17px;
  font-weight: 900;
  letter-spacing: 3px;
}
.hb-art {
  display: block;
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
}
.hb-tip {
  margin: 16px 0 0;
  text-align: center;
  font-size: 12px;
  color: #b98a5e;
  line-height: 1.9;
}
.hb-tip b {
  color: #e2765a;
  font-size: 14px;
  margin: 0 2px;
}

.hb-sheet-mask {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: rgba(60, 40, 20, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.hb-sheet {
  width: 100%;
  max-width: 520px;
  max-height: 76vh;
  overflow-y: auto;
  padding: 16px 16px calc(env(safe-area-inset-bottom) + 20px);
  border-radius: 26px 26px 0 0;
  background: linear-gradient(180deg, #fffdf7, #fff3dd);
}
.hb-sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 17px;
  font-weight: 900;
  color: #c6785e;
}
.hb-close {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: #f6e3c6;
  color: #b98a5e;
  font-size: 14px;
}
.hb-empty {
  padding: 40px 0;
  text-align: center;
  color: #c9a87c;
}
.hb-empty-sub {
  font-size: 12px;
  margin-top: 6px;
  color: #d6b98f;
}
.hb-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.hb-work {
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  border: 2px solid #f3d9b8;
}
.hb-work img {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  background: #fffdf7;
}
.hb-work-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  font-size: 12px;
  color: #b98a5e;
}
.hb-del {
  border: 0;
  background: transparent;
  color: #e2765a;
  font-size: 12px;
  font-weight: 700;
}
.hb-preview {
  max-width: 88vw;
  max-height: 82vh;
  border-radius: 18px;
  border: 4px solid #fff;
  margin: auto;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}
.hb-sheet-mask:has(.hb-preview) {
  align-items: center;
}
</style>
