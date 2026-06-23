<!-- 当日涨跌 -->
<template>
  <MyTag :label="props.value > 0 ? '涨' : '跌'" :value="props.涨跌率 || props.value" :cfg="cfg">
    <div v-if="!props.hiddenPercent && !!props.涨跌率" class="inline-block mr-[2px]" style="font-size: 0.6em">{{ props.涨跌率 }}%</div>
    <div class="inline-block">{{ props.value }}</div>
  </MyTag>
</template>
<script setup>
const props = defineProps(["value", "涨跌率", "hiddenPercent", "isGray"]);
const cfg = computed(() => {
  if (props.isGray) {
    return [[-999999, 999999, "gray"]];
  }
  return [
    [-999999, -50, "bg-green"],
    [-50, 0, "green"],
    [0, 100, "red"],
    [100, 999999, "bg-red"],
  ];
});
</script>
