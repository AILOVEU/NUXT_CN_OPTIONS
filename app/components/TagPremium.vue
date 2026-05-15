<template>
  <MyTag label="溢" :value="props.value" :cfg="cfg"> {{ props.value.toFixed(1) }}% </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-999, 1.5, "bg-green"],
  [1.5, 3.5, "green"],
  [3.5, 7, "red"],
  [7, 999, "bg-red"],
];
</script>
