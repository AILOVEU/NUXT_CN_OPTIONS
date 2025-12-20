<template>
  <el-tag :type="type" size="small" :effect="effect">
    隐波 {{ props.隐波.toFixed(1) }}
  </el-tag>
</template>
<script setup>
const props = defineProps(["隐波", "正股代码"]);
const effect = computed(() => {
  const 隐波 = props.隐波;
  if (隐波 > 25) return "plain";
  if (隐波 >= 16 && 隐波 <= 25) return "plain";
  if (隐波 > 5 && 隐波 < 16) return "dark";
  return "light";
});
const type = computed(() => {
  const 隐波 = props.隐波;
  if (隐波 > 25) return "danger";
  if (隐波 >= 16 && 隐波 <= 25) return "warning";
  return "success";
});
</script>
