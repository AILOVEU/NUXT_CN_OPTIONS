<template>
  <!-- 正股变动1000元 , Delta 变动 Gamma*10 -->
  <el-tag :type="type" size="small" :effect="effect"> Gamma {{ (props.value * 10).toFixed(1) }} </el-tag>
</template>
<script setup>
const props = defineProps(["value"]);
const effect = computed(() => {
  const absGamma = Math.abs(props.value);
  if (absGamma > 2) return "dark";
  if (absGamma > 1.5) return "light";
  return "plain";
});
const type = computed(() => {
  const absGamma = Math.abs(props.value);
  if (absGamma > 1.5) return "success";
  return "info";
});
</script>
