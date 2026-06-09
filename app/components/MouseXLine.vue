<template>
  <!-- 全页鼠标 X 轴竖线 不阻挡点击 不影响布局 -->
  <div ref="lineRef" class="mouse-x-line" :style="{ left: `${x}px`, top: 0, height: '100vh', width: '1px' }" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const x = ref(0);

// 鼠标移动更新 X 坐标
const onMouseMove = (e) => {
  x.value = e.clientX;
};

onMounted(() => {
  window.addEventListener("mousemove", onMouseMove);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", onMouseMove);
});
</script>

<style scoped>
.mouse-x-line {
  position: fixed;
  background-color: red;
  z-index: 999999;
  pointer-events: none; /* 不阻挡点击 */
  user-select: none;
}
</style>
