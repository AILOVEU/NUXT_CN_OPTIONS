<!-- 期权持仓量 -->
<template>
  <MyTag label="量" :value="props.value" :cfg="cfg"> {{ val }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const val = computed(() => {
  return formatNumberToWan(props.value);
  if (props.value < 20000) return formatDecimal(props.value, 0);
  if (props.value > 10000) return formatNumberToWan(formatDecimal(props.value / 10000, 0) * 10000);
  return formatDecimal(props.value, 0);
});
const cfg = [
  [0, 25000, "black"],
  [25000, 50000, "red"],
  [50000, 999999, "bg-red"],
];
</script>
