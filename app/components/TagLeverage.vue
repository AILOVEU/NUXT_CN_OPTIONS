<template>
  <MyTag label="杠" :value="props.value" :cfg="cfg"> {{ props.value.toFixed(1) }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-999, -30, "bg-green"],
  [-30, -20, "green"],
  [-20, -10, "blue"],
  [-10, 0, "black"],
  [0, 10, "black"],
  [10, 20, "orange"],
  [20, 30, "red"],
  [30, 999, "bg-red"],
];
</script>
