<template>
  <MyTag label="价" :value="props.value" :cfg="cfg"> {{ props.value }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [0, 150, "blue"],
  [150, 250, "green"],
  [250, 500, "orange"],
  [500, 3000, "red"],
  [3000, 999999, "bg-red"],
];
</script>
