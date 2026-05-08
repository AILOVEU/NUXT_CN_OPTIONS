<template>
  <el-tag :type="type" size="small" :effect="effect">
    <span class="text-[9px]">{{ props.value > 0 ? "增" : "减" }}</span>
    <div class="inline-block ml-[1px]">{{ props.value }}</div>
  </el-tag>
</template>
<script setup>
const props = defineProps(["value", "正股代码"]);
const type = computed(() => {
  const 增仓量 = props.value;
  if (增仓量 > 0) return "success";
  if (增仓量 < 0) return "error";
  return "info";
});
const effect = computed(() => {
  const 增仓量 = Math.abs(props.value);
  if (增仓量 > 10000) return "dark";
  if (增仓量 >= 1000 && 增仓量 <= 10000) return "light";
  return "plain";
});
</script>
