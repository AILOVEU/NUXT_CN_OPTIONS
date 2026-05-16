<!-- Vega -->
<template>
  <MyTag label="Veg" :value="props.value * 100" :cfg="cfg">
    {{ (props.value * 100).toFixed(0) }}
  </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-999, 10, "blue"],
  [10, 20, "black"],
  [20, 50, "red"],
  [50, 999, "bg-red"],
];
</script>
