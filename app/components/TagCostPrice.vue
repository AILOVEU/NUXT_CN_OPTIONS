<!-- 一手成本价 -->
<template>
  <MyTag label="本" :value="props.value" :cfg="cfg"> {{ props.value }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [0, 150, "blue"],
  [150, 600, "green"],
  [600, 1500, "red"],
  [1500, 999999, "bg-red"],
];
</script>
