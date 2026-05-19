<!-- 日总损 -->
<template>
  <MyTag label="损" :value="props.value" :cfg="cfg">
    {{ props.value }}
  </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-999999, -500, "bg-red"],
  [-500, -100, "red"],
  [100, -50, "black"],
  [-50, 999999, "blue"],
];
</script>
