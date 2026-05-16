<!-- 期权持仓量 -->
<template>
  <MyTag label="额" :value="props.value" :cfg="cfg"> {{ val }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const val = computed(() => {
  if (props.value > 10000) return formatNumberToWan(formatDecimal(props.value / 10000, 0) * 10000);
  return formatDecimal(props.value, 0);
});
const cfg = [
  [0, 25000 * 100, "black"],
  [25000 * 100, 50000 * 100, "red"],
  [50000 * 100, 999999 * 100, "bg-red"],
];
</script>
