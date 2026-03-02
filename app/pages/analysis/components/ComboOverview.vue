<template>
  <div class="flex items-center justify-center">
    <Statistic title="组合总价" :value="formatNumberToWan(组合总价)" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="认沽总价" :value="formatNumberToWan(认沽总价)" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="认购总价" :value="formatNumberToWan(认购总价)" />
    <div class="mx-[2px]">|</div>
    <Statistic title="认沽平均价" :value="formatNumberToWan(认沽平均价)" />
    <div class="mx-[2px]">&nbsp;</div>
    <Statistic title="认购平均价" :value="formatNumberToWan(认沽平均价)" />
  </div>
</template>
<script setup>
import { formatDecimal, formatNumberToWan } from "~/utils/utils";
const props = defineProps(["tiledData", "comboList"]);
const 组合TiledData = computed(() => {
  return props.tiledData.filter((el) => el["组合"]);
});
const 组合总价 = computed(() => {
  let sum = 0;
  组合TiledData.value.forEach((el) => {
    sum += el["持仓"] * el["一手价"];
  });
  return sum;
});
const 认购总价 = computed(() => {
  let sum = 0;
  组合TiledData.value.forEach((el) => {
    if (el["沽购"] === "购") {
      sum += el["持仓"] * el["一手价"];
    }
  });
  return sum;
});
const 认沽总价 = computed(() => {
  let sum = 0;
  组合TiledData.value.forEach((el) => {
    if (el["沽购"] === "沽") {
      sum += el["持仓"] * el["一手价"];
    }
  });
  return sum;
});
const 认购平均价 = computed(() => {
  let 认购总手 = 0;
  组合TiledData.value.forEach((el) => {
    if (el["沽购"] === "购" && el["持仓"] > 0) {
      认购总手 += el["持仓"];
    }
  });
  if (!认购总手) return 0;
  return 认购总价.value / 认购总手;
});
const 认沽平均价 = computed(() => {
  let 认沽总手 = 0;
  组合TiledData.value.forEach((el) => {
    if (el["沽购"] === "沽" && el["持仓"] > 0) {
      认沽总手 += el["持仓"];
    }
  });
  if (!认沽总手) return 0;
  return 认沽总价.value / 认沽总手;
});
</script>
