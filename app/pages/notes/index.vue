<template>
  <MouseXLine />
  <Nav />
  <div class="min-h-screen bg-[#f5f7fa] px-5 mx-auto">
    <!-- 顶部导航栏 -->
    <header class="bg-white rounded-[10px] py-4 px-5 mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <div class="flex items-center gap-4 justify-center">
        <button class="px-4 py-2 border border-gray-300 rounded-md bg-white cursor-pointer text-sm text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:border-gray-400" @click="prevDay">‹ 前一天</button>

        <input type="date" :value="currentDate" @change="onDateInput" class="py-2 px-3 border border-gray-300 rounded-md text-sm cursor-pointer" />

        <button class="px-4 py-2 border border-gray-300 rounded-md bg-white cursor-pointer text-sm text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:border-gray-400" @click="nextDay">后一天 ›</button>
      </div>
    </header>

    <!-- 笔记区域 -->
    <section v-if="noteText" class="bg-gradient-to-br from-amber-100 to-amber-200 rounded-[10px] py-4 px-5 mb-4">
      <div class="text-[13px] text-amber-800 mb-1.5 font-medium">📝 今日笔记</div>
      <div class="text-sm text-amber-900 leading-relaxed">{{ noteText }}</div>
    </section>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-[60px] text-gray-500 text-[15px]">数据加载中...</div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="text-center py-[60px] text-red-500 text-[15px]">{{ error }}，请选择其他日期</div>

    <!-- 图表网格 -->
    <div v-else-if="dailyData" class="grid grid-cols-2 grid-rows-3 gap-4 max-md:grid-cols-2 max-md:grid-rows-none max-md:auto-rows-fr">
      <EtfChart v-for="(etf, idx) in dailyDataEtfs" :key="etf.code" :code="etf.code" :name="etf.name" :prev-close="etf.prevClose" :data="etf.data" />
    </div>
  </div>
</template>

<script setup>
import { useEtfData } from "./utils.js";
import EtfChart from "./EtfChart";
import { OPTIONS_MAP } from "~/data";
const { currentDate, dailyData, noteText, loading, error, changeDate, offsetDate } = useEtfData();

// 初始加载今天
onMounted(() => {
  const today = new Date().toISOString().slice(0, 10);
  changeDate(today);
});

const dailyDataEtfs = computed(() => {
  let etfs = dailyData.value.etfs;
  const codes = OPTIONS_MAP.map((el) => el.code);
  let res = [];
  codes.forEach((code) => {
    if (etfs[code]) {
      res.push({
        ...etfs[code],
        code,
      });
    }
  });
  return res;
});

function prevDay() {
  if (!currentDate.value) return;
  changeDate(offsetDate(currentDate.value, -1));
}

function nextDay() {
  if (!currentDate.value) return;
  changeDate(offsetDate(currentDate.value, 1));
}

function onDateInput(e) {
  const val = e.target.value;
  if (val) changeDate(val);
}
</script>
