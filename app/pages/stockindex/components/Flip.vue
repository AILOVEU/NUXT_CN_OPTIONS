<template>
  <div class="w-full p-5 box-border bg-[#f5f7fa] rounded-lg">
    <div class="grid grid-cols-3 grid-rows-1 grid-flow-col gap-4 max-md:grid-cols-2 max-md:grid-rows-none max-md:auto-rows-fr">
      <div v-for="item in gammaFlipData" :key="item.code" class="bg-white rounded-lg p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
        <!-- 标的名称头部 -->
        <div class="mb-3">
          <span class="text-base font-semibold text-[#303133]">{{ item.stockName }}</span>
        </div>

        <!-- 现价标题行 -->
        <div class="text-sm text-[#909399] mb-2">
          当前现价：<span class="text-[18px] font-bold text-[#303133]">{{ item.currentPrice ?? "--" }}</span>
        </div>

        <!-- 多组Gamma翻转点位列表 -->
        <div v-if="item.flipPointsDetail && item.flipPointsDetail.length" class="space-y-3">
          <div v-for="point in item.flipPointsDetail" :key="point.flipPrice" class="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start max-md:gap-2 border-t border-[#eee] pt-3 first:border-t-0 first:pt-0">
            <!-- 左侧：翻转价 + 涨跌额 -->
            <div class="whitespace-nowrap tracking-[0.5px]">
              <div
                class="text-[18px] w-[80px] inline-block"
                :class="{
                  'text-[#f56c6c]': point.priceChange > 0,
                  'text-[#67c23a]': point.priceChange < 0,
                  'text-[#909399]': point.priceChange == null,
                }"
              >
                {{ formatChange(point.priceChange) }}
              </div>
              <span class="text-[22px] font-bold ml-1">{{ point.flipPrice !== null ? point.flipPrice.toFixed(2) : "--" }}</span>
            </div>

            <!-- 右侧：涨跌幅 -->
            <div class="flex flex-col items-end gap-1 pr-[10px]">
              <span class="text-xs text-[#909399]">涨跌幅</span>
              <span
                class="text-[20px] font-bold"
                :class="{
                  'text-[#f56c6c]': point.changePercent > 0,
                  'text-[#67c23a]': point.changePercent < 0,
                  'text-[#909399]': point.changePercent == null,
                }"
              >
                {{ formatPercent(point.changePercent) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 无点位数据占位 -->
        <div v-else class="text-[#909399] text-sm py-2">暂无Gamma翻转点位数据</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { STOCK_INDEX_OPTIONS_MAP } from "~/data";
const props = defineProps(["gammaFlipData"]);

const gammaFlipData = computed(() => {
  if (!props.gammaFlipData) return [];
  let res = [];
  const keys = Object.keys(props.gammaFlipData);
  keys.forEach((key) => {
    const item = props.gammaFlipData[key];
    res.push({
      ...item,
      stockName: STOCK_INDEX_OPTIONS_MAP.find((el) => el.code === key)?.showName || key,
      code: key,
      currentPrice: item.currentPrice?.toFixed(3) ?? "--",
    });
  });
  res.sort(function (a, b) {
    const aSort = STOCK_INDEX_OPTIONS_MAP.findIndex((el) => el.code === a["code"]);
    const bSort = STOCK_INDEX_OPTIONS_MAP.findIndex((el) => el.code === b["code"]);
    return aSort - bSort;
  });
  return res;
});

// 格式化涨跌额
const formatChange = (val) => {
  if (val === null || val === undefined) return "--";
  return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
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
