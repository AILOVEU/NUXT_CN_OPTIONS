<template>
  <div v-if="props.row._split" class="bg-[#576a8f] h-[10px] text-[white] flex items-center justify-center">&nbsp;</div>
  <div v-else-if="!props.row?._current" class="bg-[#CBDCEB] py-[10px]" :class="{ isLimit: props.row['_行限制展示'] }">
    <div class="text-[17px] whitespace-nowrap">{{ 展示正股名称 }}</div>
    <div class="text-[17px] pt-[4px]">
      {{ 行权价 }}
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
  return props.row["正股代码"];
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
<style scoped>
.isLimit {
  filter: grayscale(0.75);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  background-color: #acbac4;
  border: 1px solid #acbac4;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
}
</style>
