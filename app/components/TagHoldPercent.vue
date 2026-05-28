<!-- 仓位（仓位占比） -->
<template>
  <MyTag label="仓" :value="props.value" :cfg="cfg">
    <div class="inline-block mr-[2px]" style="font-size: 0.6em">{{ props.仓位占比.toFixed(1) }}%</div>
    <div class="inline-block">
      {{ props.value }}<span v-if="props.总投入" style="font-size: 0.6em">/{{ props.总投入 }}</span>
    </div>
  </MyTag>
</template>
<script setup>
const props = defineProps(["value", "仓位占比", "总投入"]);
const cfg = [
  [0, 1000, "blue"],
  [2000, 5000, "black"],
  [5000, 10000, "red"],
  [20000, 999999, "bg-red"],
];
</script>
