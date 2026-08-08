<template>
  <div class="strategy-analyzer bg-white rounded-lg shadow-sm border border-gray-200 p-3">
    <div class="text-sm font-semibold text-gray-700 mb-2">
      组合盈亏分析
      <span v-if="positions.length" class="text-xs text-gray-400 ml-1">({{ positions.length }}条)</span>
    </div>

    <!-- 持仓列表 -->
    <div v-if="positions.length" class="mb-2 max-h-[160px] overflow-y-auto">
      <div v-for="(pos, idx) in positions" :key="idx"
        class="flex items-center justify-between text-xs py-[2px] px-1 mb-[2px] rounded"
        :class="pos.position > 0 ? 'bg-red-50' : 'bg-green-50'">
        <div class="flex items-center gap-1 flex-1 min-w-0">
          <span :class="pos.position > 0 ? 'text-red-600' : 'text-green-600'" class="font-bold flex-shrink-0">
            {{ pos.position > 0 ? 'B' : 'S' }}{{ Math.abs(pos.position) }}
          </span>
          <span class="truncate">{{ pos.label }}</span>
        </div>
        <el-button size="small" text class="!h-[16px] !w-[16px] !p-0 flex-shrink-0" @click="removePosition(idx)">
          ✕
        </el-button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-xs text-gray-400 text-center py-3 mb-2">
      点击表格中的「买」或「卖」按钮添加持仓
    </div>

    <!-- 已选持仓汇总 -->
    <div v-if="positions.length" class="grid grid-cols-2 gap-1 mb-3 text-xs text-gray-500 bg-gray-50 rounded p-2">
      <div>总持仓: {{ totalCount }}</div>
      <div>当前盈亏: <span :class="totalPnl >= 0 ? 'text-red-500' : 'text-green-500'">{{ formatDecimal(totalPnl, 0) }}</span></div>
    </div>

    <!-- 图表切换 -->
    <TabSelect v-if="positions.length" :options="chartTabs" v-model="activeTab" class="mb-2" />

    <!-- ECharts -->
    <div v-if="positions.length" ref="chartRef" class="w-full h-[220px]"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from "vue";
import * as echarts from "echarts";
import { blackScholesOptionPrice } from "~/utils/bs";
import { formatDecimal } from "~/utils/utils";
import TabSelect from "~/components/TabSelect.vue";

const props = defineProps({
  positions: { type: Array, default: () => [] },
  spotPrice: { type: Number, default: 0 },
});

const emit = defineEmits(["removePosition"]);

const chartTabs = [
  { value: "price", label: "盈亏图" },
  { value: "time", label: "时间衰减" },
  { value: "iv", label: "波动率" },
];

const activeTab = ref("price");
const chartRef = ref(null);
let chartInstance = null;

const MULTIPLIER = 10000;
const RISK_FREE_RATE = 0.015;

const totalCount = computed(() => props.positions.reduce((s, p) => s + Math.abs(p.position), 0));
const totalPnl = computed(() => {
  return props.positions.reduce((sum, p) => {
    return sum + (p.currentPrice - p.entryPrice) * p.position * MULTIPLIER;
  }, 0);
});

function removePosition(idx) {
  emit("removePosition", idx);
}

// 组合盈亏：给定参数下，所有持仓的 P&L 之和
function calcCombinedPnl({ spot, dte, iv }) {
  return props.positions.reduce((sum, pos) => {
    const S = spot ?? pos.spotPrice;
    const T = (dte ?? pos.dte) / 365;
    const sigma = iv ?? pos.iv;
    try {
      const theo = blackScholesOptionPrice(S, pos.strike, RISK_FREE_RATE, T, sigma, pos.type);
      return sum + (theo - pos.entryPrice) * pos.position * MULTIPLIER;
    } catch { return sum; }
  }, 0);
}

function buildPriceChart() {
  const S0 = props.spotPrice || props.positions[0]?.spotPrice || 3;
  const range = S0 * 0.2;
  const data = [];
  const N = 200;
  for (let i = 0; i <= N; i++) {
    const S = S0 - range + (2 * range * i) / N;
    data.push([+S.toFixed(3), +calcCombinedPnl({ spot: S }).toFixed(0)]);
  }

  const currentPnl = +calcCombinedPnl({ spot: S0 }).toFixed(0);

  return {
    tooltip: { trigger: "axis", formatter: p => `正股: ${p[0].axisValue.toFixed(3)}<br/>组合盈亏: ${p[0].data[1]}` },
    grid: { left: 55, right: 15, top: 15, bottom: 30 },
    xAxis: { type: "value", name: "正股价格", min: S0 - range, max: S0 + range, splitLine: { show: false } },
    yAxis: { type: "value", name: "盈亏", splitLine: { show: false } },
    series: [{
      type: "line", data, smooth: true, symbol: "none",
      lineStyle: { width: 2, color: "#2563eb" },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(37,99,235,0.15)" }, { offset: 1, color: "rgba(37,99,235,0.02)" },
        ]),
      },
      markLine: { silent: true, data: [{ yAxis: 0, lineStyle: { type: "dashed", color: "#999" } }] },
      markPoint: {
        data: [{ coord: [S0, currentPnl], symbol: "circle", symbolSize: 8, itemStyle: { color: "#e02020" }, label: { show: true, formatter: p => p.value, fontSize: 10 } }],
      },
    }],
  };
}

function buildTimeChart() {
  const maxDTE = Math.max(...props.positions.map(p => p.dte), 30);
  const data = [];
  const N = 100;
  for (let i = 0; i <= N; i++) {
    const days = (maxDTE * i) / N;
    data.push([+days.toFixed(1), +calcCombinedPnl({ dte: days }).toFixed(0)]);
  }

  return {
    tooltip: { trigger: "axis", formatter: p => `剩余: ${p[0].axisValue.toFixed(1)}天<br/>组合盈亏: ${p[0].data[1]}` },
    grid: { left: 55, right: 15, top: 15, bottom: 30 },
    xAxis: { type: "value", name: "剩余天数", min: 0, max: maxDTE, splitLine: { show: false } },
    yAxis: { type: "value", name: "盈亏", splitLine: { show: false } },
    series: [{
      type: "line", data, smooth: true, symbol: "none",
      lineStyle: { width: 2, color: "#ea580c" },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(234,88,12,0.15)" }, { offset: 1, color: "rgba(234,88,12,0.02)" },
        ]),
      },
      markLine: { silent: true, data: [{ yAxis: 0, lineStyle: { type: "dashed", color: "#999" } }] },
      markPoint: {
        data: [{
          coord: [maxDTE, +calcCombinedPnl({ dte: maxDTE }).toFixed(0)],
          symbol: "circle", symbolSize: 8, itemStyle: { color: "#ea580c" },
          label: { show: true, formatter: p => p.value, fontSize: 10 },
        }],
      },
    }],
  };
}

function buildIvChart() {
  const avgIV = props.positions.reduce((s, p) => s + p.iv, 0) / Math.max(1, props.positions.length);
  const minIv = Math.max(0.01, avgIV - 0.2);
  const maxIv = avgIV + 0.2;
  const data = [];
  const N = 100;
  for (let i = 0; i <= N; i++) {
    const v = minIv + ((maxIv - minIv) * i) / N;
    data.push([+(v * 100).toFixed(1), +calcCombinedPnl({ iv: v }).toFixed(0)]);
  }

  return {
    tooltip: { trigger: "axis", formatter: p => `IV: ${p[0].axisValue.toFixed(1)}%<br/>组合盈亏: ${p[0].data[1]}` },
    grid: { left: 55, right: 15, top: 15, bottom: 30 },
    xAxis: { type: "value", name: "隐波(%)", min: minIv * 100, max: maxIv * 100, splitLine: { show: false } },
    yAxis: { type: "value", name: "盈亏", splitLine: { show: false } },
    series: [{
      type: "line", data, smooth: true, symbol: "none",
      lineStyle: { width: 2, color: "#7c3aed" },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(124,58,237,0.15)" }, { offset: 1, color: "rgba(124,58,237,0.02)" },
        ]),
      },
      markLine: { silent: true, data: [{ yAxis: 0, lineStyle: { type: "dashed", color: "#999" } }] },
      markPoint: {
        data: [{
          coord: [avgIV * 100, +calcCombinedPnl({ iv: avgIV }).toFixed(0)],
          symbol: "circle", symbolSize: 8, itemStyle: { color: "#7c3aed" },
          label: { show: true, formatter: p => p.value, fontSize: 10 },
        }],
      },
    }],
  };
}

function drawChart() {
  if (!chartInstance || !chartRef.value || !props.positions.length) return;
  let option;
  if (activeTab.value === "price") option = buildPriceChart();
  else if (activeTab.value === "time") option = buildTimeChart();
  else if (activeTab.value === "iv") option = buildIvChart();
  if (option) chartInstance.setOption(option, true);
}

function initChart() {
  if (!chartRef.value) return;
  if (chartInstance) chartInstance.dispose();
  chartInstance = echarts.init(chartRef.value);
  drawChart();
}

watch(activeTab, () => drawChart());
watch(() => props.positions.length, (len) => {
  if (len > 0) {
    nextTick(() => { initChart(); });
  } else {
    if (chartInstance) { chartInstance.dispose(); chartInstance = null; }
  }
});

onUnmounted(() => {
  if (chartInstance) { chartInstance.dispose(); chartInstance = null; }
});
</script>

<style scoped>
.strategy-analyzer {
  min-width: 320px;
  max-width: 400px;
}
</style>