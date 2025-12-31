<template>
  <el-tag :type="type" size="small" :effect="effect"> 成本:{{ props.一手成本价 }} </el-tag>
</template>
<script setup>
const props = defineProps(["一手成本价", "正股代码"]);
const type = computed(() => {
  const 一手成本价 = props.一手成本价;
  if (一手成本价 > 800) return "info";
  if (一手成本价 >= 200 && 一手成本价 <= 800) return "success";
  return "primary";
});
const effect = computed(() => {
  const 一手成本价 = props.一手成本价;
  if (一手成本价 > 800) return "plain";
  if (一手成本价 >= 200 && 一手成本价 <= 800) return "plain";
  return "plain";
});
</script>
