<script setup>
import { computed } from "vue";
import { KEYWORD_LABEL, ART_BASE } from "./cards.js";

const props = defineProps({
  minion: { type: Object, required: true },
  controllable: { type: Boolean, default: false }, // 是否本方（可操作）
  canAttack: { type: Boolean, default: false }, // 本回合能否攻击
  selected: { type: Boolean, default: false },
  targetable: { type: Boolean, default: false }, // 可作为攻击目标
  dragging: { type: Boolean, default: false },
  // 视觉状态：'enter' 入场 | 'attack' 攻击动作 | 'hit' 受击 | 'dead' 死亡
  fx: { type: String, default: "" },
});

const emit = defineEmits(["pointerdown", "click"]);

const keywords = computed(() =>
  (props.minion.keywords || []).map((k) => KEYWORD_LABEL[k] || k)
);
const artSrc = computed(() =>
  props.minion.art ? ART_BASE + props.minion.art : ""
);

function onPointerDown(e) {
  emit("pointerdown", { event: e, minion: props.minion });
}
function onClick() {
  emit("click", props.minion);
}
</script>

<template>
  <div
    class="minion"
    :class="[
      minion.rarity,
      {
        controllable,
        canAttack,
        selected,
        targetable,
        dragging,
        exhausted: !canAttack && controllable,
        stealth: minion.stealth,
        divine: minion.divineShield,
      },
      fx,
    ]"
    @pointerdown="onPointerDown"
    @click="onClick"
  >
    <div class="body">
      <div class="portrait">
        <img v-if="artSrc" :src="artSrc" :alt="minion.name" draggable="false" />
        <div v-else class="fallback">{{ minion.name.slice(0, 1) }}</div>
        <div v-if="minion.divineShield" class="shield">
          <span>盾</span>
        </div>
        <div v-if="minion.stealth" class="stealth-veil"></div>
      </div>
      <div class="mname">{{ minion.name }}</div>

      <div v-if="keywords.length" class="mkw">
        <span v-for="k in keywords" :key="k">{{ k }}</span>
      </div>

      <div class="atk">{{ minion.attack }}</div>
      <div class="hp" :class="{ hurt: minion._justHurt }">{{ minion.health }}</div>
    </div>
  </div>
</template>

<style scoped>
.minion {
  position: relative;
  width: 96px;
  height: 116px;
  user-select: none;
  transition: transform 0.16s ease, filter 0.16s ease;
  cursor: default;
  filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.5));
}
.minion.controllable {
  cursor: grab;
}
.minion.canAttack {
  cursor: grab;
}
.minion.canAttack .body {
  box-shadow: 0 0 0 2px #ffd54f, 0 0 14px rgba(255, 213, 79, 0.8);
  animation: ready 1.3s ease-in-out infinite;
}
@keyframes ready {
  0%, 100% { box-shadow: 0 0 0 2px #ffd54f, 0 0 10px rgba(255, 213, 79, 0.55); }
  50% { box-shadow: 0 0 0 2px #ffd54f, 0 0 18px rgba(255, 213, 79, 0.95); }
}
.minion.targetable {
  cursor: crosshair;
}
.minion.targetable .body {
  box-shadow: 0 0 0 2px #ef5350, 0 0 16px rgba(239, 83, 80, 0.85);
}
.minion.selected {
  transform: translateY(-10px) scale(1.08);
  z-index: 20;
}
.minion.exhausted {
  filter: grayscale(0.45) brightness(0.82) drop-shadow(0 3px 4px rgba(0, 0, 0, 0.5));
}
.minion.dragging {
  opacity: 0.3;
}

.body {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: linear-gradient(160deg, #3a2f4a 0%, #1c1626 100%);
  border: 2px solid #7e57c2;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.minion.legendary .body { border-color: #ff9800; }
.minion.epic .body { border-color: #9c27b0; }

.portrait {
  position: relative;
  width: 100%;
  height: 64px;
  background: #0e0e15;
  overflow: hidden;
}
.portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  pointer-events: none;
  display: block;
}
.fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 700;
  color: #fff;
}
.shield {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  box-shadow: inset 0 0 0 2px #b3e5fc, 0 0 10px #4fc3f7;
  background: radial-gradient(circle at 50% 40%, rgba(79, 195, 247, 0.25), transparent 70%);
}
.shield span {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #4fc3f7;
}
.stealth-veil {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.18) 0 6px,
    rgba(255, 255, 255, 0.04) 6px 12px
  );
}

.mname {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  padding: 2px 3px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-shadow: 0 1px 2px #000;
}
.mkw {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  font-size: 9px;
  color: #ffe082;
}
.mkw span {
  background: rgba(255, 213, 79, 0.15);
  border: 1px solid #ffd54f;
  border-radius: 5px;
  padding: 0 3px;
}

.atk,
.hp {
  position: absolute;
  bottom: -2px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  color: #fff;
  border: 2px solid #fff;
  z-index: 3;
}
.atk {
  left: -4px;
  background: radial-gradient(circle at 35% 30%, #ff8a65, #bf360c);
}
.hp {
  right: -4px;
  background: radial-gradient(circle at 35% 30%, #81c784, #1b5e20);
}
.hp.hurt {
  animation: hpflash 0.4s ease;
}
@keyframes hpflash {
  from { background: radial-gradient(circle at 35% 30%, #ff5252, #b71c1c); transform: scale(1.3); }
  to { transform: scale(1); }
}

/* ===== 动画状态 ===== */
.minion.fx-enter {
  animation: enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes enter {
  from { transform: translateY(40px) scale(0.4); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
.minion.fx-attack {
  animation: lunge 0.3s ease;
  z-index: 25;
}
@keyframes lunge {
  0% { transform: translateY(0); }
  40% { transform: translateY(-26px) scale(1.12); }
  100% { transform: translateY(0); }
}
.minion.fx-hit {
  animation: shake 0.32s ease;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-7px) rotate(-3deg); }
  60% { transform: translateX(7px) rotate(3deg); }
}
.minion.fx-dead {
  animation: die 0.5s ease forwards;
  pointer-events: none;
}
@keyframes die {
  0% { transform: scale(1); opacity: 1; }
  40% { transform: scale(1.15) rotate(6deg); filter: brightness(1.6) saturate(0); }
  100% { transform: scale(0.2) rotate(20deg); opacity: 0; }
}
</style>
