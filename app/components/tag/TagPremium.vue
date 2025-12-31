<template>
  <el-tag :type="type" :effect="effect" size="small"> 溢 {{ props.溢价率.toFixed(2) }}% </el-tag>
</template>
<script setup>
const props = defineProps(["溢价率", "正股代码"]);
const effect = computed(() => {
  const 溢价率 = props.溢价率;
  if (溢价率 > 10) return "plain";
  if (溢价率 >= 5 && 溢价率 <= 10) return "plain";
  if (溢价率 > 1 && 溢价率 < 5) return "light";
  return "dark";
});
const type = computed(() => {
  const 溢价率 = props.溢价率;
  if (溢价率 > 10) return "danger";
  if (溢价率 >= 5 && 溢价率 <= 10) return "warning";
  return "success";
});
</script>
