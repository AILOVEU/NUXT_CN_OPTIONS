<template>
  <div v-if="!props.row?._split && !props.row?._current" class="text-black">
    <div>{{ 正股名称 }}</div>
    <div>
      {{ 到期日 }}{{ 千行权价 }}
      <span class="font-normal" :style="{ color: 溢价 > 0 ? 'red' : 'green' }"> ({{ formatDecimal(溢价, 2) }}%) </span>
    </div>
  </div>
  <div v-else>
    {{ formatDecimal(行权价, 3) }}
  </div>
</template>
<script setup>
import dayjs from "dayjs";
import { stock_show_name_map, deadline_map } from "~/data";
import { formatDecimal } from "~/utils/utils";

const props = defineProps(["row"]);

const 正股名称 = computed(() => {
  return stock_show_name_map[props.row["正股代码"]];
});
const 到期日 = computed(() => {
  const month = dayjs(props.row["到期日"] + "", "YYYYMMDD").format("MM");
  return deadline_map[month];
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
