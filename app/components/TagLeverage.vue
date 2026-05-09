<template>
  <MyTag label="杠" :value="props.value" :cfg="cfg"> {{ props.value.toFixed(1) }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [0, 10, "black"],
  [10, 20, "orange"],
  [20, 30, "red"],
  [30, 999, "bg-red"],
];
</script>
