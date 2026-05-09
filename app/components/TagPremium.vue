<template>
  <MyTag label="溢" :value="props.value" :cfg="cfg"> {{ props.value.toFixed(1) }}% </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-999, 1, "bg-green"],
  [1, 2, "green"],
  [2, 5, "orange"],
  [5, 8, "red"],
  [8, 999, "bg-red"],
];
</script>
