<template>
  <MyTag :label="props.value > 0 ? '涨↑' : '跌↓'" :value="props.涨跌率" :cfg="cfg">
    <div class="relative">
      <div>{{ props.value }}</div>
      <div v-if="!props.hiddenPercent" class="absolute right-0 bottom-[-120%] transform origin-top-right scale-[0.65]" :style="{ color: props.value > 0 ? 'red' : 'green' }">{{ props.涨跌率 }}%</div>
    </div>
  </MyTag>
</template>
<script setup>
const props = defineProps(["value", "涨跌率", "hiddenPercent"]);
const cfg = [
  [-999999, -25, "bg-green"],
  [-50, 0, "green"],
  [0, 50, "red"],
  [50, 999999, "bg-red"],
];
</script>
