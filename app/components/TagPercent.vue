<template>
  <MyTag label="仓" :value="props.value" :cfg="cfg">{{ props.value }}({{ formatDecimal(props.仓位占比, 1) }}%)</MyTag>
</template>
<script setup>
const props = defineProps(["value", "仓位占比"]);
const cfg = [
  [0, 2000, "black"],
  [2000, 10000, "orange"],
  [10000, 20000, "red"],
  [20000, 999999, "bg-red"],
];
</script>
