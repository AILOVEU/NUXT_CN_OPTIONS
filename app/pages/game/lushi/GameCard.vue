<script setup>
import { computed } from "vue";
import {
  RARITY_COLOR,
  KEYWORD_LABEL,
  ART_BASE,
} from "./cards.js";

const props = defineProps({
  card: { type: Object, required: true },
  // 显示模式：hand(手牌大图) / mini(列表小图) / board(随从由 MinionView 处理)
  mode: { type: String, default: "hand" },
  playable: { type: Boolean, default: false }, // 当前是否可打出
  selected: { type: Boolean, default: false }, // 是否处于选中/待放置状态
  dragging: { type: Boolean, default: false },
});

const emit = defineEmits(["pointerdown", "click"]);

const rarityColor = computed(() => RARITY_COLOR[props.card.rarity] || "#9e9e9e");
const keywords = computed(() =>
  (props.card.keywords || []).map((k) => KEYWORD_LABEL[k] || k)
);

const artSrc = computed(() => {
  const a = props.card.art;
  if (!a) return "";
  return ART_BASE + a;
});

function onPointerDown(e) {
  emit("pointerdown", { event: e, card: props.card });
}
function onClick() {
  emit("click", props.card);
}
</script>

<template>
  <div
    class="card"
    :class="[
      `mode-${mode}`,
      card.rarity,
      { playable, selected, dragging },
    ]"
    :style="{ '--rc': rarityColor }"
    @pointerdown="onPointerDown"
    @click="onClick"
  >
    <div class="card-frame">
      <!-- 插画 -->
      <div class="art">
        <img
          v-if="artSrc"
          :src="artSrc"
          :alt="card.name"
          loading="lazy"
          draggable="false"
        />
        <div v-else class="art-fallback">{{ card.name.slice(0, 2) }}</div>
        <div class="cost">{{ card.cost }}</div>
        <div v-if="card.type === 'weapon'" class="durability">{{ card.durability }}</div>
      </div>

      <!-- 名牌 -->
      <div class="name">{{ card.name }}</div>

      <!-- 文本 -->
      <div v-if="card.text" class="text">{{ card.text }}</div>

      <!-- 关键词 -->
      <div v-if="keywords.length" class="keywords">
        <span v-for="k in keywords" :key="k" class="kw">{{ k }}</span>
      </div>

      <!-- 数值 -->
      <div v-if="card.type === 'minion'" class="stat attack">{{ card.attack }}</div>
      <div v-if="card.type === 'minion'" class="stat health">{{ card.health }}</div>
      <div v-if="card.type === 'weapon'" class="stat attack">{{ card.attack }}</div>
      <div v-if="card.type === 'weapon'" class="stat health">{{ card.durability }}</div>

      <div v-if="mode === 'mini'" class="mini-name">{{ card.name }}</div>
    </div>
  </div>
</template>

<style scoped>
.card {
  --rc: #9e9e9e;
  position: relative;
  user-select: none;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
    filter 0.18s ease, box-shadow 0.18s ease;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.45));
}
.card.mode-hand {
  width: 150px;
  height: 210px;
  cursor: pointer;
}
.card.mode-mini {
  width: 92px;
  height: 130px;
  cursor: pointer;
}
.card.playable:hover {
  transform: translateY(-16px) scale(1.06);
  z-index: 30;
  filter: drop-shadow(0 14px 18px rgba(0, 0, 0, 0.6)) brightness(1.06);
}
.card.selected {
  transform: translateY(-22px) scale(1.1);
  z-index: 40;
  box-shadow: 0 0 0 3px #ffd54f, 0 0 22px #ffd54f;
}
.card.dragging {
  opacity: 0.35;
}

.card-frame {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(160deg, #2b2b3a 0%, #16161f 100%);
  border: 2px solid var(--rc);
  box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.6);
}

.art {
  position: relative;
  width: 100%;
  height: 62%;
  background: #0e0e15;
  overflow: hidden;
}
.mode-mini .art {
  height: 60%;
}
.art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
  pointer-events: none;
}
.art-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #444, #222);
}

.cost {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #6fd0ff, #1565c0);
  border: 2px solid #e3f2fd;
  color: #fff;
  font-weight: 800;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  z-index: 3;
}
.durability {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #d7ccc8, #4e342e);
  border: 2px solid #ffe0b2;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.name {
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  color: #fff;
  padding: 3px 4px 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px #000;
}
.mode-mini .name {
  font-size: 11px;
}
.text {
  font-size: 10px;
  line-height: 1.25;
  color: #e0e0e0;
  text-align: center;
  padding: 0 6px;
  max-height: 34px;
  overflow: hidden;
}
.mode-mini .text {
  display: none;
}
.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  padding: 1px 4px;
  min-height: 14px;
}
.kw {
  font-size: 9px;
  background: rgba(255, 213, 79, 0.18);
  border: 1px solid #ffd54f;
  color: #ffe082;
  border-radius: 6px;
  padding: 0 4px;
}
.mode-mini .keywords {
  display: none;
}

.stat {
  position: absolute;
  bottom: 2px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 17px;
  color: #fff;
  border: 2px solid #fff;
  z-index: 3;
}
.attack {
  left: 2px;
  background: radial-gradient(circle at 35% 30%, #ff8a65, #bf360c);
}
.health {
  right: 2px;
  background: radial-gradient(circle at 35% 30%, #81c784, #1b5e20);
}
.mode-mini .stat {
  width: 24px;
  height: 24px;
  font-size: 13px;
}

.mini-name {
  display: none;
}
</style>
