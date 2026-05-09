<template>
  <MyTag label="Veg" :value="props.value * 100" :cfg="cfg">
    {{ (props.value * 100).toFixed(0) }}
  </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-999, 10, "black"],
  [10, 20, "orange"],
  [20, 30, "red"],
  [30, 999, "bg-red"],
];
</script>
