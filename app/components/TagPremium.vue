<!-- 溢价率 -->
<template>
  <MyTag label="溢" :value="props.value" :cfg="cfg"> {{ props.value.toFixed(1) }}% </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-999, 2, "bg-green"],
  [2, 4.5, "green"],
  [4.5, 10, "red"],
  [10, 999, "bg-red"],
];
</script>
