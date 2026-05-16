<!-- Delta -->
<template>
  <MyTag label="Del" :value="props.value * 100" :cfg="cfg">{{ (props.value * 100).toFixed(1) }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-100, -75, "bg-green"],
  [-75, -25, "green"],
  [-25, -10, "black"],
  [-10, 10, "blue"],
  [10, 25, "black"],
  [25, 75, "red"],
  [75, 100, "bg-red"],
];
</script>
