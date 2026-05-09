<template>
  <MyTag label="隐" :value="props.value" :cfg="cfg"> {{ props.value.toFixed(1) }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [0, 5, "black"],
  [5, 15, "bg-green"],
  [15, 20, "green"],
  [20, 25, "orange"],
  [25, 30, "red"],
  [30, 999, "bg-red"],
];
</script>
