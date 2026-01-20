<template>
  <el-tag :type="type" :effect="effect" size="small"> 溢 {{ props.value.toFixed(2) }}% </el-tag>
</template>
<script setup>
const props = defineProps(["value", "正股代码"]);
const effect = computed(() => {
  const 溢价率 = props.value;
  if (溢价率 > 10) return "plain";
  if (溢价率 >= 5 && 溢价率 <= 10) return "plain";
  if (溢价率 > 1 && 溢价率 < 5) return "light";
  return "dark";
});
const type = computed(() => {
  const 溢价率 = props.value;
  if (溢价率 > 10) return "danger";
  if (溢价率 >= 5 && 溢价率 <= 10) return "warning";
  return "success";
});
</script>
