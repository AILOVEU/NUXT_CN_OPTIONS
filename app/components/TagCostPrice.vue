<template>
  <MyTag label="本" :value="props.value" :cfg="cfg"> {{ props.value }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [0, 150, "blue"],
  [150, 500, "green"],
  [500, 1000, "orange"],
  [1000, 3000, "red"],
  [3000, 999999, "bg-red"],
];
</script>
