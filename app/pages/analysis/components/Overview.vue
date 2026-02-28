<template>
  <div class="flex items-center justify-center">
    <Statistic title="认购代替正股和" :value="认购代替正股和Str" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="认沽代替正股和" :value="认沽代替正股和Str" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="认沽对冲占比" :value="认沽对冲占比Str" :style="{ backgroundColor: 认沽对冲占比 > 0.1 ? '#FFA6A6' : '#BCD9A2' }" />
    <div class="mx-[2px]">|</div>
    <Statistic title="代替正股总和" :value="代替正股总和Str" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="涨跌1%盈亏" :value="涨跌盈亏1Str" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="涨跌2%盈亏" :value="涨跌盈亏2Str" />
    <div class="mx-[2px]">|</div>
    <Statistic title="持仓总和" :value="持仓总和Str" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="时间价值总和" :value="时间价值总和Str" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="时间价占比" :value="时间价占比Str" :style="{ backgroundColor: '#ece7d1' }" />
  </div>
  <br />
  <br />
  <div class="flex items-center justify-center">
    <Statistic title="总杠杆" :value="总杠杆" :style="{ backgroundColor: '#ece7d1' }" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="单笔期权平均价" :value="单笔期权平均价" :style="{ backgroundColor: '#ece7d1' }" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="非组合平均Delta" :value="非组合平均Delta" :style="{ backgroundColor: '#ece7d1' }" />
  </div>
</template>
<script setup>
import { formatDecimal, formatNumberToWan } from "~/utils/utils";
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
const 时间价值总和Str = computed(() => formatNumberToWan(时间价值总和.value));

const 代替正股总和 = computed(() => {
  let sum = 0;
  props.tiledData.forEach((el) => {
    if (el["持仓"]) sum += el["持仓"] * el["代替正股价"];
  });
  return formatDecimal(sum, 0);
});
const 代替正股总和Str = computed(() => formatNumberToWan(代替正股总和.value));
const 认购代替正股和 = computed(() => {
  let sum = 0;
  props.tiledData.forEach((el) => {
    if (el["持仓"] && el["沽购"] === "购") sum += el["持仓"] * el["代替正股价"];
  });
  return formatDecimal(sum, 0);
});
const 认购代替正股和Str = computed(() => formatNumberToWan(认购代替正股和.value));
const 认沽代替正股和 = computed(() => {
  let sum = 0;
  props.tiledData.forEach((el) => {
    if (el["持仓"] && el["沽购"] === "沽") sum += el["持仓"] * el["代替正股价"];
  });
  return formatDecimal(sum, 0);
});
const 认沽代替正股和Str = computed(() => formatNumberToWan(认沽代替正股和.value));

const 认沽对冲占比 = computed(() => {
  let val = (认沽代替正股和.value / 代替正股总和.value) * 100;
  return val;
});
const 认沽对冲占比Str = computed(() => Math.abs(formatDecimal(认沽对冲占比.value, 2)) + "%");
const 涨跌盈亏1Str = computed(() => {
  return formatNumberToWan(formatDecimal(代替正股总和.value * 0.01, 0));
});
const 涨跌盈亏2Str = computed(() => {
  return formatNumberToWan(formatDecimal(代替正股总和.value * 0.02, 0));
});
const 持仓总和 = computed(() => {
  let sum = 0;
  props.tiledData.forEach((el) => {
    if (el["持仓"]) sum += el["持仓"] * el["一手价"];
  });
  return sum;
});
const 持仓总和Str = computed(() => formatNumberToWan(持仓总和.value));

const 时间价占比Str = computed(() => {
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
