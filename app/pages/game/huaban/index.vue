<template>
  <div ref="wrapRef" class="sk-wrap" :class="{ locked: hud.status === 'playing' }">
    <canvas ref="canvasRef" class="sk-canvas" />

    <!-- 触摸层：左右拖动转向，点击跳跃 -->
    <div
      class="sk-touch"
      @pointerdown="onTouchStart"
      @pointermove="onTouchMove"
      @pointerup="onTouchEnd"
      @pointercancel="onTouchEnd"
    />

    <!-- ========== 游戏内 HUD ========== -->
    <div v-if="hud.status === 'playing' || hud.status === 'paused'" class="hud">
      <div class="hud-top">
        <div class="hud-row">
          <div class="hearts">
            <span v-for="i in hud.maxHealth" :key="i" class="heart" :class="{ off: i > hud.health }">❤</span>
          </div>
          <div class="chip">
            <em>🪙</em><b>{{ hud.coins }}</b>
            <i v-if="coinPop" :key="coinPop" class="pop">+1</i>
          </div>
        </div>
        <div class="hud-row">
          <div class="chip speed">{{ hud.speed }}<small>km/h</small></div>
          <button class="icon-btn" @click="togglePause">
            {{ hud.status === "paused" ? "▶" : "❚❚" }}
          </button>
        </div>
      </div>

      <div class="progress">
        <div class="bar" :style="{ width: hud.progress * 100 + '%' }" />
        <span class="progress-txt">{{ hud.dist }}m / {{ hud.target }}m</span>
        <span class="flag">🏁</span>
      </div>
    </div>

    <!-- ========== 触摸控制 ========== -->
    <div v-if="hud.status === 'playing'" class="controls">
      <button
        class="pad left"
        :class="{ on: padSteer === -1 }"
        @pointerdown.stop="pressPad(-1)"
        @pointerup.stop="releasePad"
        @pointercancel.stop="releasePad"
        @pointerleave.stop="releasePad"
      >
        ◀
      </button>
      <button
        class="pad right"
        :class="{ on: padSteer === 1 }"
        @pointerdown.stop="pressPad(1)"
        @pointerup.stop="releasePad"
        @pointercancel.stop="releasePad"
        @pointerleave.stop="releasePad"
      >
        ▶
      </button>
      <button class="jump" @pointerdown.stop.prevent="doJump">跳</button>
    </div>

    <!-- ========== 受击红闪 ========== -->
    <div v-if="flash" class="flash" />

    <!-- ========== 开始菜单 ========== -->
    <div v-if="hud.status === 'menu'" class="overlay menu">
      <div class="menu-card">
        <h1 class="title">滑板下坡挑战</h1>
        <p class="sub">没你想象的那么轻松通关</p>

        <div class="diffs">
          <button
            v-for="d in diffList"
            :key="d.key"
            class="diff"
            :class="{ active: difficulty === d.key }"
            @click="difficulty = d.key"
          >
            <span class="diff-name">{{ d.name }}</span>
            <span class="diff-desc">{{ d.desc }}</span>
            <span class="diff-meta">终点 {{ d.target }}m · {{ d.lives }} 命</span>
          </button>
        </div>

        <button class="primary" @click="startGame">开始挑战</button>
        <button class="ghost" @click="showHelp = !showHelp">{{ showHelp ? "收起操作说明" : "操作说明 / 玩法" }}</button>

        <div v-if="showHelp" class="help">
          <p><b>转向：</b>按住左下 ◀ / 右下 ▶，或在屏幕上左右拖动</p>
          <p><b>跳跃：</b>点按屏幕任意处，或按「跳」键，可跨过锥桶 / 路障 / 油桶</p>
          <p><b>目标：</b>躲开路上的人、车与障碍，冲过终点线即通关；撞到障碍会掉命</p>
          <p><b>金币：</b>吃到金币加 1 分，结算时计入战绩</p>
          <p class="kb">电脑端：← → 转向，空格跳跃，P 暂停</p>
        </div>

        <div class="menu-foot">
          <button class="mini" @click="toggleMute">{{ muted ? "🔇 音效已关" : "🔊 音效开启" }}</button>
          <button class="mini" @click="goBack">返回</button>
        </div>
      </div>
    </div>

    <!-- ========== 暂停 ========== -->
    <div v-else-if="hud.status === 'paused'" class="overlay">
      <div class="panel">
        <h2>已暂停</h2>
        <p class="stats">
          距离 {{ hud.dist }}m / {{ hud.target }}m · 金币 {{ hud.coins }} · 剩余 {{ hud.health }} 命
        </p>
        <button class="primary" @click="togglePause">继续滑行</button>
        <button class="ghost" @click="startGame">重新开始</button>
        <button class="ghost" @click="toMenu">返回菜单</button>
      </div>
    </div>

    <!-- ========== 结算 ========== -->
    <div v-else-if="hud.status === 'dead' || hud.status === 'win'" class="overlay">
      <div class="panel" :class="hud.status">
        <h2>{{ hud.status === "win" ? "通关成功！" : "挑战失败" }}</h2>
        <p class="sub">{{ hud.status === "win" ? "能通关你是真的牛 🐮" : "再试一次，这次一定能过" }}</p>
        <div class="result">
          <div><span>{{ hud.dist }}</span><small>米</small></div>
          <div><span>{{ hud.coins }}</span><small>金币</small></div>
          <div><span>{{ hud.maxSpeed }}</span><small>最高km/h</small></div>
          <div><span>{{ hud.hits }}</span><small>碰撞</small></div>
        </div>
        <button class="primary" @click="startGame">再来一次</button>
        <button class="ghost" @click="toMenu">更换难度</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { createSkateGame, DIFFICULTIES } from "./engine.js";

useHead({
  meta: [
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
    },
  ],
});

const router = useRouter();
const wrapRef = ref(null);
const canvasRef = ref(null);

let game = null;
let ro = null;

const hud = reactive({
  status: "menu",
  diff: "normal",
  dist: 0,
  target: DIFFICULTIES.normal.target,
  coins: 0,
  health: 3,
  maxHealth: 3,
  speed: 0,
  progress: 0,
  maxSpeed: 0,
  hits: 0,
});

const difficulty = ref("normal");
const showHelp = ref(false);
const muted = ref(false);
const flash = ref(false);
const coinPop = ref(0);
const padSteer = ref(0);

const diffList = computed(() => Object.values(DIFFICULTIES));

/* ---------------- 输入 ---------------- */
const drag = { id: null, startX: 0, startY: 0, moved: false, steer: 0 };

function applySteer() {
  if (!game) return;
  game.setSteer(padSteer.value !== 0 ? padSteer.value : drag.steer);
}

function onTouchStart(e) {
  if (hud.status !== "playing") return;
  if (drag.id !== null) return;
  drag.id = e.pointerId;
  drag.startX = e.clientX;
  drag.startY = e.clientY;
  drag.moved = false;
  drag.steer = 0;
  if (e.target.setPointerCapture) {
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (err) {
      /* ignore */
    }
  }
}

function onTouchMove(e) {
  if (drag.id !== e.pointerId) return;
  const dx = e.clientX - drag.startX;
  const dy = e.clientY - drag.startY;
  if (Math.abs(dx) > 12 || Math.abs(dy) > 12) drag.moved = true;
  drag.steer = Math.max(-1, Math.min(1, dx / 70));
  applySteer();
}

function onTouchEnd(e) {
  if (drag.id !== e.pointerId) return;
  const wasTap = !drag.moved;
  drag.id = null;
  drag.steer = 0;
  applySteer();
  if (wasTap) doJump();
}

function pressPad(dir) {
  padSteer.value = dir;
  applySteer();
}
function releasePad() {
  padSteer.value = 0;
  applySteer();
}
function doJump() {
  if (!game) return;
  game.jump();
}

/* ---------------- 键盘 ---------------- */
function onKeyDown(e) {
  if (e.repeat) return;
  const k = e.key;
  if (k === "ArrowLeft" || k === "a" || k === "A") pressPad(-1);
  else if (k === "ArrowRight" || k === "d" || k === "D") pressPad(1);
  else if (k === " " || k === "ArrowUp" || k === "w" || k === "W") {
    e.preventDefault();
    doJump();
  } else if (k === "p" || k === "P" || k === "Escape") togglePause();
}
function onKeyUp(e) {
  const k = e.key;
  if (k === "ArrowLeft" || k === "a" || k === "A" || k === "ArrowRight" || k === "d" || k === "D") releasePad();
}

/* ---------------- 流程 ---------------- */
function startGame() {
  if (!game) return;
  drag.id = null;
  drag.steer = 0;
  padSteer.value = 0;
  game.start(difficulty.value);
}

function togglePause() {
  if (!game) return;
  releasePad();
  drag.id = null;
  drag.steer = 0;
  game.togglePause();
}

function toMenu() {
  if (!game) return;
  releasePad();
  game.toMenu();
}

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push("/");
}

function toggleMute() {
  muted.value = !muted.value;
  if (game) game.setMuted(muted.value);
}

function onEvent(ev) {
  if (ev.type === "hit") {
    flash.value = true;
    setTimeout(() => (flash.value = false), 300);
    if (navigator.vibrate) navigator.vibrate(70);
  } else if (ev.type === "coin") {
    coinPop.value += 1;
    if (navigator.vibrate) navigator.vibrate(8);
  } else if (ev.type === "dead") {
    if (navigator.vibrate) navigator.vibrate([60, 60, 120]);
  } else if (ev.type === "win") {
    if (navigator.vibrate) navigator.vibrate([40, 60, 40, 60, 120]);
  }
}

function onState(s) {
  Object.assign(hud, s);
}

function onVisibility() {
  if (document.hidden) togglePause();
}

onMounted(() => {
  game = createSkateGame({
    canvas: canvasRef.value,
    container: wrapRef.value,
    onState,
    onEvent,
  });
  game.setMuted(muted.value);
  game.resize();

  ro = new ResizeObserver(() => game && game.resize());
  ro.observe(wrapRef.value);

  window.addEventListener("resize", () => game && game.resize());
  window.addEventListener("orientationchange", () => setTimeout(() => game && game.resize(), 250));
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  document.addEventListener("visibilitychange", onVisibility);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  document.removeEventListener("visibilitychange", onVisibility);
  if (ro) ro.disconnect();
  if (game) game.dispose();
  game = null;
});
</script>

<style scoped>
.sk-wrap {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #0b1220;
  touch-action: none;
  overscroll-behavior: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}
.sk-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
.sk-touch {
  position: absolute;
  inset: 0;
  z-index: 5;
  touch-action: none;
}
.hud,
.controls {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}
.hud {
  padding: calc(env(safe-area-inset-top) + 10px) calc(env(safe-area-inset-right) + 12px) 0
    calc(env(safe-area-inset-left) + 12px);
}
.hud-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.hud-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hearts {
  display: flex;
  gap: 2px;
  font-size: clamp(16px, 4.4vw, 22px);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}
.heart {
  color: #ff5566;
  transition: opacity 0.2s, transform 0.2s;
}
.heart.off {
  color: rgba(255, 255, 255, 0.32);
  transform: scale(0.85);
}
.chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(8, 16, 28, 0.55);
  color: #fff;
  font-size: clamp(12px, 3.4vw, 16px);
  font-weight: 700;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
.chip em {
  font-style: normal;
}
.chip small {
  font-size: 0.7em;
  opacity: 0.75;
  margin-left: 2px;
}
.chip .pop {
  position: absolute;
  top: -6px;
  right: -4px;
  font-style: normal;
  font-size: 12px;
  color: #ffd233;
  animation: pop 0.7s ease-out forwards;
  text-shadow: 0 1px 2px #000;
}
@keyframes pop {
  0% {
    transform: translateY(0) scale(0.8);
    opacity: 0;
  }
  30% {
    transform: translateY(-6px) scale(1.15);
    opacity: 1;
  }
  100% {
    transform: translateY(-18px) scale(1);
    opacity: 0;
  }
}
.icon-btn {
  pointer-events: auto;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(8, 16, 28, 0.55);
  color: #fff;
  font-size: 15px;
  backdrop-filter: blur(4px);
}
.progress {
  position: relative;
  margin-top: 10px;
  height: 16px;
  border-radius: 999px;
  background: rgba(8, 16, 28, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.18);
  overflow: hidden;
}
.progress .bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #56d97b, #ffd233 70%, #ff7043);
  transition: width 0.12s linear;
}
.progress-txt {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}
.progress .flag {
  position: absolute;
  right: 4px;
  top: -3px;
  font-size: 14px;
}

/* ------- 控制按键 ------- */
.controls .pad,
.controls .jump {
  position: absolute;
  pointer-events: auto;
  border: 2px solid rgba(255, 255, 255, 0.35);
  background: rgba(10, 18, 30, 0.42);
  color: #fff;
  backdrop-filter: blur(3px);
  border-radius: 50%;
  font-weight: 800;
  touch-action: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.08s, background 0.12s;
}
.controls .pad {
  width: clamp(64px, 17vw, 92px);
  height: clamp(64px, 17vw, 92px);
  bottom: calc(env(safe-area-inset-bottom) + 18px);
  font-size: clamp(22px, 6vw, 30px);
}
.controls .pad.left {
  left: calc(env(safe-area-inset-left) + 16px);
}
.controls .pad.right {
  right: calc(env(safe-area-inset-right) + 16px);
}
.controls .pad.on {
  background: rgba(86, 217, 123, 0.55);
  transform: scale(0.94);
}
.controls .jump {
  right: calc(env(safe-area-inset-right) + 20px);
  bottom: calc(env(safe-area-inset-bottom) + 110px);
  width: clamp(56px, 14vw, 78px);
  height: clamp(56px, 14vw, 78px);
  font-size: clamp(16px, 4.4vw, 22px);
  background: rgba(226, 69, 47, 0.55);
}
.controls .jump:active {
  transform: scale(0.92);
}

/* ------- 受击红闪 ------- */
.flash {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  background: radial-gradient(circle at 50% 60%, rgba(255, 0, 0, 0.1), rgba(255, 20, 20, 0.5));
  animation: flash 0.3s ease-out forwards;
}
@keyframes flash {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* ------- 弹层 ------- */
.overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 16px);
  background: linear-gradient(180deg, rgba(6, 12, 22, 0.72), rgba(6, 12, 22, 0.88));
  backdrop-filter: blur(3px);
  overflow-y: auto;
}
.menu-card,
.panel {
  width: 100%;
  max-width: 460px;
  background: linear-gradient(180deg, #16213a, #0e1626);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  padding: 18px 16px 16px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
  color: #fff;
  text-align: center;
}
.panel.win {
  border-color: rgba(86, 217, 123, 0.6);
  box-shadow: 0 0 0 1px rgba(86, 217, 123, 0.35), 0 18px 50px rgba(0, 0, 0, 0.5);
}
.title {
  margin: 4px 0 6px;
  font-size: clamp(24px, 7vw, 34px);
  font-weight: 900;
  letter-spacing: 2px;
  color: #fff;
  text-shadow: 0 0 18px rgba(255, 210, 51, 0.45), 0 3px 0 #b3781b;
}
.sub {
  margin: 0 0 14px;
  font-size: clamp(12px, 3.6vw, 15px);
  color: #ffd233;
  font-weight: 700;
  letter-spacing: 1px;
}
.panel h2 {
  margin: 0 0 8px;
  font-size: clamp(20px, 6vw, 28px);
  font-weight: 900;
}
.diffs {
  display: grid;
  gap: 10px;
  margin-bottom: 14px;
}
.diff {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  text-align: left;
  transition: all 0.15s;
}
.diff.active {
  border-color: #ffd233;
  background: linear-gradient(90deg, rgba(255, 210, 51, 0.22), rgba(255, 210, 51, 0.06));
  box-shadow: 0 0 0 1px rgba(255, 210, 51, 0.5) inset;
}
.diff-name {
  font-size: clamp(15px, 4.4vw, 18px);
  font-weight: 800;
}
.diff-desc {
  font-size: clamp(11px, 3.2vw, 13px);
  color: #9fb4d0;
}
.diff-meta {
  font-size: clamp(10px, 3vw, 12px);
  color: #ffd233;
  opacity: 0.9;
}
.primary {
  width: 100%;
  margin-top: 4px;
  padding: 14px;
  border: 0;
  border-radius: 14px;
  font-size: clamp(16px, 4.6vw, 19px);
  font-weight: 900;
  letter-spacing: 2px;
  color: #241a00;
  background: linear-gradient(180deg, #ffe071, #ffb62e);
  box-shadow: 0 6px 0 #b3781b, 0 10px 22px rgba(255, 182, 46, 0.3);
}
.primary:active {
  transform: translateY(3px);
  box-shadow: 0 3px 0 #b3781b;
}
.ghost {
  width: 100%;
  margin-top: 10px;
  padding: 11px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: transparent;
  color: #cfe0f3;
  font-size: clamp(13px, 3.8vw, 15px);
  font-weight: 700;
}
.ghost:active {
  background: rgba(255, 255, 255, 0.08);
}
.help {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  text-align: left;
  font-size: clamp(11px, 3.4vw, 13px);
  line-height: 1.7;
  color: #c6d6e8;
}
.help p {
  margin: 0 0 4px;
}
.help b {
  color: #ffd233;
}
.help .kb {
  color: #8ba0b8;
}
.menu-foot {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.mini {
  flex: 1;
  padding: 9px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.04);
  color: #b9cadd;
  font-size: clamp(11px, 3.2vw, 13px);
}
.stats {
  margin: 0 0 14px;
  font-size: clamp(12px, 3.4vw, 14px);
  color: #c6d6e8;
}
.result {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin: 12px 0 16px;
}
.result > div {
  padding: 8px 4px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
}
.result span {
  display: block;
  font-size: clamp(16px, 5vw, 22px);
  font-weight: 900;
  color: #ffd233;
}
.result small {
  font-size: 10px;
  color: #9fb4d0;
}

/* 横屏（手机横握）时收紧 UI */
@media (orientation: landscape) and (max-height: 520px) {
  .controls .pad {
    width: 64px;
    height: 64px;
  }
  .controls .jump {
    width: 58px;
    height: 58px;
    bottom: calc(env(safe-area-inset-bottom) + 84px);
  }
  .menu-card,
  .panel {
    max-width: 560px;
    padding: 12px;
  }
  .diffs {
    grid-template-columns: repeat(3, 1fr);
  }
  .diff-desc {
    display: none;
  }
  .overlay {
    align-items: flex-start;
  }
}
</style>
