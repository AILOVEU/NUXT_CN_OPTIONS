<template>
  <div v-if="props.row._split" class="bg-[#576a8f] h-[10px] text-[white] flex items-center justify-center">&nbsp;</div>
  <div v-else-if="props.row._current" style="background-color: #dff1f1; height: 22px">&nbsp;</div>
  <div class="flex flex-col gap-[10px]" v-else-if="info">
    <div class="flex items-center justify-between">
      <div class="w-[40px]">日增额</div>
      <div>{{ formatNumberToWan(info.日增额) }}</div>
    </div>
    <div class="flex items-center justify-between">
      <div class="w-[40px]">日增量</div>
      <div>{{ formatNumberToWan(info.日增量) }}</div>
    </div>
    <div class="flex items-center justify-between">
      <div class="w-[40px]">持仓额</div>
      <div>{{ formatNumberToWan(info.持仓额) }}</div>
    </div>
    <div class="flex items-center justify-between">
      <div class="w-[40px]">持仓量</div>
      <div>{{ formatNumberToWan(info.持仓量) }}</div>
    </div>
  </div>
</template>
<script setup>
import { OPTIONS_MAP } from "~/data";
import { formatDecimal, formatNumberToWan } from "~/utils/utils";
import dayjs from "dayjs";

const props = defineProps(["row", "isCall"]);
const info = computed(() => {
  return props.row[(props.isCall ? "C" : "P") + "市场数据"];
});
</script>
<style scoped lang="scss"></style>
