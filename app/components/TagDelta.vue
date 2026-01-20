<template>
  <el-tag :type="type" size="small" :effect="effect">
   <div class="font-[400]">Delta {{ props.value.toFixed(3) }}</div>
  </el-tag>
</template>
<script setup>
const props = defineProps(["value", "正股代码"]);
const effect = computed(() => {
  const absDelta = Math.abs(props.value);
  if(absDelta > 0.75) return 'plain'
  if(absDelta >= 0.35 && absDelta <=0.75) return 'light'
  if(absDelta >= 0.25 && absDelta <=0.35) return 'light'
  return 'plain'
});
const type = computed(() => {
  const absDelta = Math.abs(props.value);
  if(absDelta > 0.75) return 'success'
  if(absDelta >= 0.25 && absDelta <=0.75) return 'success'
  return 'info'
});
</script>
