<!-- 杠杆 -->
<template>
  <MyTag label="杠" :value="props.value" :cfg="cfg"> {{ props.value.toFixed(1) }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-999, -30, "bg-green"],
  [-30, -15, "green"],
  [-15, -5, "black"],
  [-5, 0, "blue"],
  [0, 5, "blue"],
  [5, 15, "black"],
  [15, 30, "red"],
  [30, 999, "bg-red"],
];
</script>
