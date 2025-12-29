<template>
  <div v-if="props.row._split" class="bg-[black]">&nbsp;</div>
  <div v-else-if="!props.row?._current">
    <div>{{ 正股 }}</div>
    <div>
      {{ 千行权价 }}
    </div>
    <div>
      (
      <span class="font-normal" :style="{ color: 溢价 > 0 ? 'red' : 'green' }">
        {{ formatDecimal(溢价, 2) + "%" }}
      </span>
      )
    </div>
  </div>
  <div v-else class="h-[24px] leading-[24px] text-[18px]">
    {{ formatDecimal(行权价, 3) }}
  </div>
</template>
<script setup>
import { OPTIONS_MAP } from "~/data";
import { formatDecimal } from "~/utils/utils";
const props = defineProps(["row"]);

const 正股 = computed(() => {
  return OPTIONS_MAP.find((el) => el.code === props.row["正股代码"])?.name;
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
