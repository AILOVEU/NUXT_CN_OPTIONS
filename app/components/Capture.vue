<template>
  <div ref="captureRef" :style="props.style"><slot> </slot></div>
</template>
<script setup>
import dayjs from "dayjs";
const props = defineProps(["title", "style"]);
const todayStr = computed(() => `(${dayjs().format("YYYY-MM-DD_HH:mm:ss")})`);
const captureRef = ref(null);
async function download() {
  // 服务端直接返回
  if (process.server) return;

  // 动态引入（避免服务端打包报错）
  const html2canvas = (await import("html2canvas")).default;

  const el = captureRef.value;
  if (!el) return;

  try {
    const canvas = await html2canvas(el, {
      scale: 2, // 清晰度
      useCORS: true, // 跨域图片
      backgroundColor: "#ffffff",
      logging: false,
    });

    // 转成图片并下载
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${props.title}${todayStr.value}.png`;
    link.click();
  } catch (e) {
    console.error("截图失败", e);
  }
}

defineExpose({
  download,
});
</script>
