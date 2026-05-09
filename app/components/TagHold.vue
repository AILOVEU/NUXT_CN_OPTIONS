<template>
  <MyTag label="" :value="props.value" :cfg="cfg">
    {{ props.value || "" }}
  </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-999, -50, "bg-green"],
  [-50, -10, "green"],
  [-10, 0, "green"],
  [0, 10, "red"],
  [10, 50, "red"],
  [50, 999, "bg-red"],
];
</script>
