<!-- 持仓量 -->
<template>
  <MyTag label="" :value="props.value" :cfg="cfg"> {{ showPlus && props.value > 0 ? "+" : "" }}{{ props.value || "" }} </MyTag>
</template>
<script setup>
const props = defineProps(["value", "showPlus"]);
const cfg = [
  [-999, -30, "bg-green"],
  [-30, -10, "green"],
  [-10, 0, "green"],
  [0, 10, "red"],
  [10, 30, "red"],
  [30, 999, "bg-red"],
];
</script>
