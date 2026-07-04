<template>
  <div class="w-full p-5 box-border bg-[#f5f7fa] rounded-lg">
    <div class="grid grid-cols-3 grid-rows-2 grid-flow-col gap-4 max-md:grid-cols-2 max-md:grid-rows-none max-md:auto-rows-fr">
      <div v-for="item in gammaFlipData" :key="item.code" class="bg-white rounded-lg p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
        <!-- 标的名称头部 -->
        <div class="mb-3">
          <span class="text-base font-semibold text-[#303133]">{{ item.stockName }}</span>
        </div>

        <!-- 整行左右布局：左侧价格文字 | 最右侧涨跌幅 -->
        <div class="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start max-md:gap-3">
          <!-- 左侧：现价 = 零Gamma价 涨跌额 -->
          <div class="whitespace-nowrap tracking-[0.5px] text-[18px] font-bold text-[#303133]">
            {{ item.currentPrice ?? "--" }}
            <span
              class="text-[18px]"
              :class="{
                'text-[#f56c6c]': item.priceChange > 0,
                'text-[#67c23a]': item.priceChange < 0,
                'text-[#909399]': item.priceChange == null,
              }"
            >
              {{ formatChange(item.priceChange) }}
            </span>
            <span class="text-[18px] font-normal text-[#606266] mx-1">=</span>
            <span class="text-[22px] font-bold">
              {{ item.gammaFlipPrice !== null ? item.gammaFlipPrice.toFixed(3) : "--" }}
            </span>
          </div>

          <!-- 最右侧：重点放大涨跌幅 -->
          <div class="flex flex-col items-end gap-1 pr-[10px]">
            <span class="text-xs text-[#909399]">涨跌幅</span>
            <span
              class="text-[20px] font-bold"
              :class="{
                'text-[#f56c6c]': item.changePercent > 0,
                'text-[#67c23a]': item.changePercent < 0,
                'text-[#909399]': item.changePercent == null,
              }"
            >
              {{ formatPercent(item.changePercent) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { OPTIONS_MAP } from "~/data";
const props = defineProps(["gammaFlipData"]);

const gammaFlipData = computed(() => {
  let res = [];
  const keys = Object.keys(props.gammaFlipData);
  keys.forEach((key) => {
    const item = props.gammaFlipData[key];
    res.push({
      ...item,
      stockName: OPTIONS_MAP.find((el) => el.code === key)?.showName,
      code: key,
      currentPrice: item.currentPrice.toFixed(3),
    });
  });
  res.sort(function (a, b) {
    const aSort = OPTIONS_MAP.findIndex((el) => el.code === a["code"]);
    const bSort = OPTIONS_MAP.findIndex((el) => el.code === b["code"]);
    return aSort - bSort;
  });
  return res;
});

// 格式化涨跌额
const formatChange = (val) => {
  if (val === null || val === undefined) return "--";
  return val > 0 ? `+${val.toFixed(3)}` : val.toFixed(3);
};

// 格式化涨跌幅
const formatPercent = (val) => {
  if (val === null || val === undefined) return "--";
  return val > 0 ? `+${val.toFixed(2)}%` : `${val.toFixed(2)}%`;
};
</script>

<style scoped>
/* 全部样式使用Tailwind，无需额外css */
</style>
