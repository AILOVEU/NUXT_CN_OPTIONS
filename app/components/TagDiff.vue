<template>
  <MyTag :label="props.value > 0 ? '涨↑' : '跌↓'" :value="props.value" :cfg="cfg"> {{ props.value }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-999999, -500, "bg-green"],
  [-500, 0, "green"],
  [0, 500, "red"],
  [500, 999999, "bg-red"],
];
</script>
