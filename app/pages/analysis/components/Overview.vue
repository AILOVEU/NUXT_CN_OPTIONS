<template>
  <div class="flex items-center gap-[20px]">
    <Statistic title="持仓总和" :value="持仓总和" />
    <Statistic title="时间价值总和" :value="时间价值总和" />
    <Statistic title="时间价占比" :value="时间价占比" />
    <Statistic title="总杠杆" :value="总杠杆" />
    <Statistic title="单笔期权平均价" :value="单笔期权平均价" />
    <Statistic title="非组合平均Delta" :value="非组合平均Delta" />
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
const 单笔期权平均价 = computed(() => {
  let 总手数 = 0;
  let 总组合数 = 0;

  props.tiledData.forEach((el) => {
    总手数 += el["持仓"];
  });
  props.comboList.forEach((el) => {
    总组合数 += el[2];
  });
  const res = 持仓总和.value / (总手数 + 总组合数 || 1);
  return formatDecimal(res, 0);
});

const 非组合平均Delta = computed(() => {
  let 总手数 = 0;
  let 总Delta = 0;

  props.tiledData.forEach((el) => {
    if (!el["组合"]) {
      总手数 += el["持仓"];
      总Delta += el["持仓"] * el["Delta"];
    }
  });
  if (!总手数) return 0;
  const res = 总Delta / 总手数;
  return formatDecimal(res, 2);
});
</script>
