<template>
  <div v-if="props.row?._split" class="bg-black">&nbsp;</div>
  <div v-else-if="!props.row?._current">
    <div>{{ 正股名称 }}</div>
    <div>{{ 到期日 }}</div>
    <div>{{ 行权价 }}</div>
    <div>
      <span class="font-normal" :style="{ color: 溢价 > 0 ? 'red' : 'green' }">({{ formatDecimal(溢价, 2) }}%)</span>
    </div>
  </div>
  <div v-else class="h-[24px] leading-[24px] text-[18px]">
    {{ formatDecimal(行权价, 0) }}
  </div>
</template>
<script setup>
import dayjs from "dayjs";
import { formatDecimal } from "~/utils/utils";

const props = defineProps(["row"]);

const 正股名称 = computed(() => {
  return props.row["正股代码"];
});
const 到期日 = computed(() => {
  return dayjs(props.row["到期日"] + "", "YYYY-MM-DD").format("M月DD");
});
const 行权价 = computed(() => {
  return props.row["行权价"];
});
const 正股价格 = computed(() => {
  return props.row["正股价格"];
});
const 溢价 = computed(() => {
  return (100 * (行权价.value - 正股价格.value)) / 正股价格.value;
});
</script>
