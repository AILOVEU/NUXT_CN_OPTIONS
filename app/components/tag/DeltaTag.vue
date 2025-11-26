<template>
  <el-tag :type="type" size="small" :effect="effect">
   Delta {{ props.Delta?.toFixed(3) }}
  </el-tag>
</template>
<script setup>
import { stock_show_name_map } from "~/data";
const props = defineProps(["Delta", "正股代码"]);
const effect = computed(() => {
  const absDelta = Math.abs(props.Delta);
  if(absDelta > 0.75) return 'plain'
  if(absDelta >= 0.35 && absDelta <=0.75) return 'light'
  if(absDelta >= 0.25 && absDelta <=0.35) return 'dark'
  return 'plain'
});
const type = computed(() => {
  const absDelta = Math.abs(props.Delta);
  if(absDelta > 0.75) return 'success'
  if(absDelta >= 0.25 && absDelta <=0.75) return 'success'
  return 'info'
});
</script>
