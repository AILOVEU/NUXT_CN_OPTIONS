<template>
  <div class="flex items-center justify-center">
    <Statistic title="持仓总和" :value="formatNumberToWan(持仓总和)" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="时间价总和" :value="formatNumberToWan(时间价总和)" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="时间价占比" :value="formatDecimal(时间价占比, 2) + '%'" :style="{ backgroundColor: '#ece7d1' }" />
  </div>
  <br /><br />

  <div class="flex items-center justify-center">
    <Statistic title="认沽总价" :value="formatNumberToWan(认沽总价)" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="认购总价" :value="formatNumberToWan(认购总价)" />
    <div class="mx-[2px]">|</div>
    <Statistic title="认沽代替正股和" :value="formatNumberToWan(认沽代替正股和)" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="认购代替正股和" :value="formatNumberToWan(认购代替正股和)" />
    <div class="mx-[2px]">|</div>
    <Statistic title="认沽对冲占比" :value="Math.abs(formatDecimal(认沽对冲占比, 2)) + '%'" :style="{ backgroundColor: Math.abs(认沽对冲占比) > 10 ? '#BCD9A2' : '#FFA6A6' }" />
  </div>
  <br /><br />
  
  <div class="flex items-center justify-center">
    <Statistic title="代替正股总和" :value="formatNumberToWan(代替正股总和)" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="涨跌1%盈亏" :value="formatNumberToWan(formatDecimal(代替正股总和 * 0.01, 0))" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="涨跌2%盈亏" :value="formatNumberToWan(formatDecimal(代替正股总和 * 0.02, 0))" />
    <div class="mx-[2px]">|</div>
  </div>
  <br /><br />
  <div class="flex items-center justify-center">
    <Statistic title="总杠杆" :value="总杠杆" :style="{ backgroundColor: '#ece7d1' }" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="单笔期权平均价" :value="单笔期权平均价" :style="{ backgroundColor: '#ece7d1' }" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="平均Delta" :value="平均Delta" :style="{ backgroundColor: '#ece7d1' }" />
  </div>
</template>
<script setup>
import { formatDecimal, formatNumberToWan } from "~/utils/utils";
const props = defineProps(["tiledData", "comboList"]);
const 非组合TiledData = computed(() => {
  return props.tiledData.filter((el) => !el["组合"]);
});
const 认购总价 = computed(() => {
  let sum = 0;
  非组合TiledData.value.forEach((el) => {
    if (el["沽购"] === "购") {
      sum += el["持仓"] * el["一手价"];
    }
  });
  return sum;
});

const 认沽总价 = computed(() => {
  let sum = 0;
  非组合TiledData.value.forEach((el) => {
    if (el["沽购"] === "沽") {
      sum += el["持仓"] * el["一手价"];
    }
  });
  return sum;
});

const 内在价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value.forEach((el) => {
    if (el["持仓"]) sum += el["持仓"] * el["一手内在价"];
  });
  return sum;
});
const 时间价总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value.forEach((el) => {
    if (el["持仓"]) sum += el["持仓"] * el["一手时间价"];
  });
  return sum;
});

const 代替正股总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value.forEach((el) => {
    if (el["持仓"]) sum += el["持仓"] * el["代替正股价"];
  });
  return formatDecimal(sum, 0);
});
const 认购代替正股和 = computed(() => {
  let sum = 0;
  非组合TiledData.value.forEach((el) => {
    if (el["持仓"] && el["沽购"] === "购") sum += el["持仓"] * el["代替正股价"];
  });
  return formatDecimal(sum, 0);
});
const 认沽代替正股和 = computed(() => {
  let sum = 0;
  非组合TiledData.value.forEach((el) => {
    if (el["持仓"] && el["沽购"] === "沽") sum += el["持仓"] * el["代替正股价"];
  });
  return formatDecimal(sum, 0);
});

const 认沽对冲占比 = computed(() => {
  let val = (认沽代替正股和.value / 代替正股总和.value) * 100;
  return val;
});
const 持仓总和 = computed(() => {
  let sum = 0;
  非组合TiledData.value.forEach((el) => {
    if (el["持仓"]) sum += el["持仓"] * el["一手价"];
  });
  return sum;
});

const 时间价占比 = computed(() => {
  let val = (时间价总和.value / (时间价总和.value + 内在价总和.value)) * 100;
  return val;
});
const 总杠杆 = computed(() => {
  let val = 代替正股总和.value / 持仓总和.value;
  return formatDecimal(val, 2);
});
const 单笔期权平均价 = computed(() => {
  let 总手数 = 0;

  非组合TiledData.value.forEach((el) => {
    总手数 += el["持仓"];
  });
  const res = 持仓总和.value / (总手数 || 1);
  return formatDecimal(res, 0);
});

const 平均Delta = computed(() => {
  let 总手数 = 0;
  let 总Delta = 0;

  非组合TiledData.value.forEach((el) => {
    总手数 += el["持仓"];
    总Delta += el["持仓"] * el["Delta"];
  });
  if (!总手数) return 0;
  const res = 总Delta / 总手数;
  return formatDecimal(res, 2);
});
</script>
