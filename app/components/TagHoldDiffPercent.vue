<template>
  <MyTag :label="props.value > 0 ? '盈' : '亏'" :value="props.收益率" :cfg="cfg">
    <span style="font-size: 0.6em">{{ props.收益率.toFixed(0) }}%</span>
    <div class="inline-block">{{ props.value }}</div>
  </MyTag>
</template>
<script setup>
const props = defineProps(["value", "收益率"]);
const cfg = [
  [-999999, -50, "bg-green"],
  [-50, 0, "green"],
  [0, 100, "red"],
  [100, 999999, "bg-red"],
];
</script>
