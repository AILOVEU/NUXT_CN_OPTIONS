<template>
  <div
    class="border-[5px] border-[black] h-[360px] relative text-[15px] font-medium"
    :style="{ width: `calc(${baseWidth}vw + 8px)` }"
  >
    <div class="absolute left-0 top-[0px] flex items-center">
      <!-- 持仓 -->
      <div
        :style="{ width: (baseWidth * 持仓金额) / money.基础金额 + 'vw' }"
        class="h-[60px] py-[10px] bg-[#dede4e]"
      >
        <div class="whitespace-nowrap">持仓</div>
        <div>{{ 持仓金额 }}</div>
        <div>{{ ((100 * 持仓金额) / money.基础金额).toFixed(1) }}%</div>
      </div>
      <!-- 保证金 -->
      <div
        :style="{
          width: (baseWidth * money.占用保证金) / money.基础金额 + 'vw',
        }"
        class="h-[60px] py-[10px] bg-[gray] relative top-[60px]"
      >
        <div class="whitespace-nowrap">占用保证金</div>
        <div>{{ money.占用保证金 }}</div>
        <div>{{ ((100 * money.占用保证金) / money.基础金额).toFixed(1) }}%</div>
      </div>
      <!-- 现金金额 -->
      <div
        :style="{
          width: (baseWidth * money.场内现金) / money.基础金额 + 'vw',
        }"
        class="h-[60px] py-[10px] bg-[#edc67f] relative top-[120px]"
      >
        <div class="whitespace-nowrap">场内现金</div>
        <div>{{ money.场内现金 }}</div>
        <div>{{ ((100 * money.场内现金) / money.基础金额).toFixed(1) }}%</div>
      </div>
      <!-- 亏损金额 -->
      <div
        v-if="亏损金额 > 0"
        :style="{ width: (baseWidth * 亏损金额) / money.基础金额 + 'vw' }"
        class="h-[60px] py-[10px] bg-[#d87f7f] relative top-[180px]"
      >
        <div class="whitespace-nowrap">亏损金额</div>
        <div>{{ 亏损金额 }}</div>
        <div>{{ ((100 * 亏损金额) / money.基础金额).toFixed(1) }}%</div>
      </div>
    </div>
    <div class="absolute left-0 top-[240px] flex items-center">
      <div
        class="h-[60px] py-[10px] relative bg-[#82e082] "
        :style="{
          width: (baseWidth * money.股票转入金额) / money.基础金额 + 'vw',
        }"
      >
        <div class="whitespace-nowrap">股票转入金额</div>
        <div>{{ money.股票转入金额 }}</div>
        <div>
          {{ ((100 * money.股票转入金额) / money.基础金额).toFixed(1) }}%
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useMoneyStore } from "~/stores/useMoneyStore";
import { UNIT } from "~/data";
const props = defineProps(["all_data", "combo_list"]);
const baseWidth = 50;
const { money } = useMoneyStore();
const 持仓金额 = computed(() => {
  let value = 0;
  props.all_data
    .filter((el) => el["持仓"])
    .forEach((el) => {
      value += el["持仓"] * el["最新价"] * UNIT;
    });
  return value;
});
const 亏损金额 = computed(() => {
  const value =
    money.基础金额 - 持仓金额.value - money.占用保证金 - money.场内现金;
  return value;
});
</script>
