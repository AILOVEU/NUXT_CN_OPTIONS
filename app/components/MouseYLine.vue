<template>
  <!-- 全页鼠标Y轴水平线 不阻挡点击 不影响布局 -->
  <div ref="lineRef" class="mouse-y-line" :style="{ top: `${y}px`, left: 0, width: '100vw', height: '1px' }" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const y = ref(0);
const lineRef = ref(null);

// 鼠标移动时更新 Y 坐标
const onMouseMove = (e) => {
  y.value = e.clientY;
};

onMounted(() => {
  window.addEventListener("mousemove", onMouseMove);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", onMouseMove);
});
</script>

<style scoped>
.mouse-y-line {
  position: fixed;
  background-color: red;
  z-index: 999999; /* 最顶层 */
  pointer-events: none; /* 关键：不阻挡点击、不影响交互 */
  user-select: none;
}
</style>
