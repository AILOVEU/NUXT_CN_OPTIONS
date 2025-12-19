<template>
  <div v-if="!props.row?._split && !props.row?._current" class="px-[4px] w-full">
    <el-progress :percentage="(100 * 持仓量) / 150000" :text-inside="true">
      <div></div>
    </el-progress>
    <div class="flex justify-between mt-[3px] px-[5px]">
      <div class="text-[12px]">{{ 持仓量 }}</div>
      <div class="text-left" :style="{ color: 日增 > 0 ? 'red' : 'green' }">{{ 日增 }}</div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["row", "isCall"]);
const callOrPut = computed(() => {
  return props.isCall ? "C" : "P";
});
const 持仓量 = computed(() => {
  return Math.floor(props.row[callOrPut.value + "持仓量"]);
});
const 日增 = computed(() => {
  let value = Math.floor(props.row[callOrPut.value + "日增"]);
  if (isNaN(value)) return "-";
  return value;
});
</script>
