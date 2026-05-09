<template>
  <el-tag :type="type" size="small" :effect="effect">
    <div class="inline-block" style="font-size: 10px !important">仓</div>
    <div class="inline-block">{{ props.value }}({{ formatDecimal(props.仓位占比, 1) }}%)</div>
  </el-tag>
</template>
<script setup>
const props = defineProps(["value", "仓位占比"]);
const effect = computed(() => {
  // const absGamma = Math.abs(props.value);
  if (props.value >= 3000) return "dark";
  // if(absGamma > 1.5) return 'light'
  return "plain";
});
const type = computed(() => {
  // const absGamma = Math.abs(props.value);
  if (props.value >= 3000) return "warning";
  return "info";
});
</script>
