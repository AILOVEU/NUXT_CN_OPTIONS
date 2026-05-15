<template>
  <MyTag label="仓" :value="props.value" :cfg="cfg">
    <span class="relative inline-blockh-[1em]">
      <span class="absolute left-0 bottom-0 transform origin-left scale-[0.5]">{{ props.仓位占比.toFixed(1) }}%</span>
    </span>
    <div class="ml-[28px] inline-block">{{ props.value }}</div>
  </MyTag>
</template>
<script setup>
const props = defineProps(["value", "仓位占比"]);
const cfg = [
  [0, 1000, "blue"],
  [2000, 5000, "black"],
  [5000, 10000, "red"],
  [20000, 999999, "bg-red"],
];
</script>
