<template>
  <el-card style="width: 100%">
    <template #header>
      <div class="flex justify-between">
        <div class="font-semibold text-[20px] text-[#4a9cd6]">
          <span>{{ props.header }}{{ todayStr }}</span>
        </div>
        <!-- <el-icon><Bottom /></el-icon> -->
        <el-button @click="download" link>⬇</el-button>
      </div>
    </template>
    <div ref="captureRef"><slot> </slot></div>
  </el-card>
</template>
<script setup>
const props = defineProps(["header"]);
import dayjs from "dayjs";
const todayStr = computed(() => `(${dayjs().format("YYYY-MM-DD")})`);
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
    link.download = `${props.header}${todayStr.value}.png`;
    link.click();
  } catch (e) {
    console.error("截图失败", e);
  }
}
</script>
