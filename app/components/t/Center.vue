<template>
  <div v-if="!props.row?._split && !props.row?._current" class="text-white">
    <div>{{ 正股 }}</div>
    <div>
      {{ 到期日 }}{{ 行权价 }} (
      <span class="font-normal" :style="{ color: 溢价 > 0 ? 'red' : 'green' }">
        {{ 溢价Str }}
      </span>
      )
    </div>
  </div>
  <div v-else>
    {{ (行权价/1000).toFixed(3) }}
  </div>
</template>
<script setup>
import dayjs from "dayjs";
import { stock_name_map, deadline_map } from "~/data";
const props = defineProps(["row"]);

const 正股 = computed(() => {
  return stock_name_map[props.row["正股"]];
});
const 到期日 = computed(() => {
  const month = dayjs(props.row["到期日"] + "", "YYYYMMDD").format("MM");
  return deadline_map[month];
});
const 行权价 = computed(() => {
  return props.row["行权价"] * 1000;
});

const 正股价格 = computed(() => {
  return props.row["正股价格"] * 1000;
});
const 溢价 = computed(() => {
  return (100 * (行权价.value - 正股价格.value)) / 正股价格.value;
});
const 溢价Str = computed(() => {
  return 溢价.value.toFixed(2) + "%";
});
</script>
