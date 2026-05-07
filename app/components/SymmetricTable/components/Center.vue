<template>
  <div v-if="props.row._split" class="bg-[black] h-[10px] text-[white] flex items-center justify-center">&nbsp;</div>
  <div v-else-if="!props.row?._current">
    <div class="text-[17px] whitespace-nowrap">{{ 展示正股名称 }}</div>
    <div class="text-[17px] pt-[4px]">
      {{ 千行权价 }}
    </div>
    <div class="text-[17px] pt-[2px] pb-[4px] whitespace-nowrap">
      <span class="font-semibold" :style="{ color: 溢价 > 0 ? 'red' : 'green' }">
        {{ formatDecimal(溢价, 2) + "%" }}
      </span>
    </div>
  </div>
  <div v-else class="h-[22px] leading-[22px] text-[20px]">
    {{ formatDecimal(行权价, 3) }}
  </div>
</template>
<script setup>
import { OPTIONS_MAP } from "~/data";
import { formatDecimal } from "~/utils/utils";
import dayjs from "dayjs";

const props = defineProps(["row"]);

const 展示正股名称 = computed(() => {
  return props.row["展示正股名称"];
});
const 行权价 = computed(() => {
  return props.row["行权价"];
});

const 千行权价 = computed(() => {
  return props.row["千行权价"];
});

const 正股价格 = computed(() => {
  return props.row["正股价格"];
});
const 溢价 = computed(() => {
  return (100 * (行权价.value - 正股价格.value)) / 正股价格.value;
});
</script>
