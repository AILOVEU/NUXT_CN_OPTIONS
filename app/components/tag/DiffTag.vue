<template>
  <el-tag type="info" size="small" effect="plain">
    <div :style="{ color: 涨跌 > 0 ? 'red' : 'green' }">
      {{ 涨跌 > 0 ? "↑ " + 涨跌 : "↓ " + Math.abs(涨跌) }}
    </div>
  </el-tag>
</template>
<script setup>
const props = defineProps(["涨跌", "正股代码"]);
const 涨跌 = computed(() => {
  return props.涨跌;
});
</script>
