<template>
  <el-tag :type="type" size="small" :effect="effect">
    <div class="inline-block">仓{{ props.value }}({{ formatDecimal(props.仓位占比, 1) }}%)</div>
  </el-tag>
</template>
<script setup>
const props = defineProps(["value", "仓位占比"]);
const effect = computed(() => {
  // const absGamma = Math.abs(props.value);
  if (props.仓位占比 >= 5) return "dark";
  // if(absGamma > 1.5) return 'light'
  return "plain";
});
const type = computed(() => {
  // const absGamma = Math.abs(props.value);
  if (props.仓位占比 >= 5) return "warning";
  return "info";
});
</script>
