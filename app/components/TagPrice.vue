<template>
  <el-tag :type="type" size="small" :effect="effect">
    价
    <div class="w-[30px] inline-block">{{ props.value }}</div>
  </el-tag>
</template>
<script setup>
const props = defineProps(["value", "正股代码"]);
const type = computed(() => {
  const 一手价 = props.value;
  if (一手价 > 800) return "info";
  if (一手价 >= 200 && 一手价 <= 800) return "success";
  return "primary";
});
const effect = computed(() => {
  const 一手价 = props.value;
  if (一手价 > 800) return "plain";
  if (一手价 >= 200 && 一手价 <= 800) return "plain";
  return "plain";
});
</script>
