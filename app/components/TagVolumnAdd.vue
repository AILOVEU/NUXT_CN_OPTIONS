<!-- 期权增减仓 -->
<template>
  <MyTag :label="props.value > 0 ? '增' : '减'" :value="props.value" :cfg="cfg"> {{ props.value }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-999999, -10000, "bg-green"],
  [-10000, -1000, "green"],
  [-1000, 1000, "black"],
  [1000, 10000, "red"],
  [10000, 999999, "bg-red"],
];
</script>
