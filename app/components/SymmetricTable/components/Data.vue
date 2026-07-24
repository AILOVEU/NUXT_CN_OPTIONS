<template>
  <div class="flex flex-col gap-[10px]" v-if="info">
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
