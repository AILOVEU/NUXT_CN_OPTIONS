<template>
  <MyTag label="损" :value="props.value" :cfg="cfg">
    {{ props.value }}
  </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-999, 10, "blue"],
  [10, 30, "black"],
  [30, 50, "red"],
  [50, 999, "bg-red"],
];
</script>
