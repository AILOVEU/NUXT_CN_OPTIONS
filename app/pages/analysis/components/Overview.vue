<template>
  <div class="flex items-center gap-[20px]">
    <Statistic title="时间价占比" :value="时间价占比" />
    <Statistic title="总杠杆" :value="总杠杆" />
  </div>
</template>
<script setup>
import { formatDecimal } from "~/utils/utils";
const props = defineProps(["tiledData", "comboList"]);
const 内在价值总和 = computed(() => {
  let sum = 0;
  props.tiledData.forEach((el) => {
    if (el["持仓"]) sum += el["持仓"] * el["一手内在价"];
  });
  return sum;
});
const 时间价值总和 = computed(() => {
  let sum = 0;
  props.tiledData.forEach((el) => {
    if (el["持仓"]) sum += el["持仓"] * el["一手时间价"];
  });
  return sum;
});
const 代替正股总和 = computed(() => {
  let sum = 0;
  props.tiledData.forEach((el) => {
    if (el["持仓"]) sum += el["持仓"] * el["代替正股价"];
  });
  return sum;
});
const 持仓总和 = computed(() => {
  let sum = 0;
  props.tiledData.forEach((el) => {
    if (el["持仓"]) sum += el["持仓"] * el["一手价"];
  });
  return sum;
});
const 时间价占比 = computed(() => {
  let val = (时间价值总和.value / (时间价值总和.value + 内在价值总和.value)) * 100;
  return formatDecimal(val, 2) + "%";
});
const 总杠杆 = computed(() => {
  let val = 代替正股总和.value / 持仓总和.value;
  return formatDecimal(val, 2);
});
</script>
