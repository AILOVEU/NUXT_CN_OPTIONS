<template>
  <div v-if="!props.row?._split && !props.row?._current" class="px-[4px] w-full">
    <el-progress :percentage="Math.min(100, (100 * 持仓量) / 2000000)" :text-inside="true">
      <div></div>
    </el-progress>
    <div class="flex justify-between mt-[3px] px-[5px]">
      <div class="text-[12px]">{{ formatWan(持仓量) }}</div>
      <div class="text-left text-[12px] text-gray-500">{{ formatWan(成交量) }}</div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["row"]);
const 持仓量 = computed(() => {
  return Math.floor(props.row["持仓量"] || 0);
});
const 成交量 = computed(() => {
  return Math.floor(props.row["成交量"] || 0);
});
function formatWan(v) {
  if (!v) return "0";
  if (v >= 100000000) return (v / 100000000).toFixed(2) + "亿";
  if (v >= 10000) return (v / 10000).toFixed(1) + "万";
  return v + "";
}
</script>
