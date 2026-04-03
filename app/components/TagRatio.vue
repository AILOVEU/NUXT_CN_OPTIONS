<template>
  <el-tag :type="type" size="small" :effect="effect">
    👍<div class="w-[25px] inline-block">{{ props.value[0] }}</div>
  </el-tag>
</template>
<script setup>
const props = defineProps(["value"]);
const effect = computed(() => {
  // const absGamma = Math.abs(props.value);
  // if(absGamma > 2) return 'dark'
  // if(absGamma > 1.5) return 'light'
  return "plain";
});
const type = computed(() => {
  // const absGamma = Math.abs(props.value);
  // if(absGamma > 1.5) return 'success'
  return "info";
});
</script>
