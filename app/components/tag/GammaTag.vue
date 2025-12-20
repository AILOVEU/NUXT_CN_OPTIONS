<template>
  <el-tag :type="type" size="small" :effect="effect">
    Gamma {{ props.Gamma.toFixed(2) }}
  </el-tag>
</template>
<script setup>
const props = defineProps(["Gamma"]);
const effect = computed(() => {
  const absGamma = Math.abs(props.Gamma);
  if(absGamma > 2) return 'dark'
  if(absGamma > 1.5) return 'light'
  return 'plain'
});
const type = computed(() => {
  const absGamma = Math.abs(props.Gamma);
  if(absGamma > 1.5) return 'success'
  return 'info'
});
</script>
