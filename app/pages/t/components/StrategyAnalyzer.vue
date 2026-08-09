<template>
  <div class="strategy-analyzer bg-white rounded-lg shadow-sm border border-gray-200 p-3">
    <div class="text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
      组合盈亏分析
      <span class="flex items-center gap-1">
        <span v-if="positions.length" class="text-xs text-gray-400">({{ positions.length }}条)</span>
        <el-button v-if="positions.length" size="small" text type="danger" class="!h-[20px] !text-[11px] !px-1"
          @click="clearAll">清空</el-button>
      </span>
    </div>

    <!-- 持仓列表 -->
    <div v-if="positions.length" class="mb-2 max-h-[200px] overflow-y-auto">
      <div v-for="(pos, idx) in enrichedPositions" :key="idx" class="text-xs py-[2px] px-1 mb-[2px] rounded"
        :class="pos.position > 0 ? 'bg-red-50' : 'bg-green-50'">
        <div class="flex items-center justify-between">
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
        <!-- 原始价 → 盈亏后价（理论价） → 盈亏 -->
        <div class="flex justify-between gap-1 mt-[2px] pl-[14px] text-[10px] text-gray-500">
          <span>原始:{{ formatDecimal(pos.entryPrice, 3) }}</span>
          <span>理论:{{ formatDecimal(pos.theoPrice, 3) }}</span>
          <span :class="pos.pnlTotal >= 0 ? 'text-red-500' : 'text-green-500'">盈亏:{{ formatDecimal(pos.pnlTotal, 0)
            }}</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-xs text-gray-400 text-center py-3 mb-2">
      点击表格中的「买」或「卖」按钮添加持仓
    </div>

    <!-- 已选持仓汇总 -->
    <div v-if="positions.length" class="grid grid-cols-2 gap-1 mb-3 text-xs text-gray-500 bg-gray-50 rounded p-2">
      <template v-if="activeTab === 'price'">
        <div>组合原始价: <span :class="portfolioCost >= 0 ? 'text-red-500' : 'text-green-500'">{{
          formatDecimal(portfolioCost, 0) }}</span></div>
        <div>组合最新价: <span :class="displayPortfolioValue >= 0 ? 'text-red-500' : 'text-green-500'">{{
          formatDecimal(displayPortfolioValue, 0) }}</span></div>
      </template>
      <div>
        当前盈亏: <span :class="displayPnl >= 0 ? 'text-red-500' : 'text-green-500'">{{ formatDecimal(displayPnl, 0) }}</span>
      </div>
      <div>总持仓: {{ totalCount }}</div>
    </div>

    <!-- 图表切换 -->
    <TabSelect v-if="positions.length" :options="chartTabs" v-model="activeTab" class="mb-2" @click="onTabChange" />

    <!-- ECharts -->
    <div v-if="positions.length" ref="chartRef" class="w-full" :style="{ height: chartHeight + 'px' }"></div>

    <!-- 可拖拽滑块 -->
    <div v-if="positions.length" class="mt-2 px-2">
      <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>{{ sliderLabel }}</span>
        <span class="font-semibold" :class="sliderPnl >= 0 ? 'text-red-500' : 'text-green-500'">
          盈亏: {{ formatDecimal(sliderPnl, 0) }}
          <template v-if="activeTab === 'price' && sliderPnlPct !== null">
            （{{ sliderPnlPct >= 0 ? '+' : '' }}{{ sliderPnlPct.toFixed(2) }}%）
          </template>
        </span>
      </div>
      <el-slider v-model="sliderPercent" :min="0" :max="100" :step="0.5" size="small" :show-tooltip="false"
        @input="onSliderChange" />
      <div class="flex justify-between text-[10px] text-gray-400">
        <span>{{ sliderMinLabel }}</span>
        <span>{{ sliderMaxLabel }}</span>
      </div>
    </div>

    <!-- 盈亏图专项：时间选择滑块 -->
    <div v-if="positions.length && activeTab === 'price'" class="mt-2 px-2">
      <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>剩余: {{ timeSliderValue }}天</span>
        <span class="text-gray-400">调整到期日</span>
      </div>
      <el-slider v-model="timeSliderPercent" :min="0" :max="100" :step="0.5" size="small" :show-tooltip="false"
        @input="onSliderChange" />
      <div class="flex justify-between text-[10px] text-gray-400">
        <span>到期日</span>
        <span>{{ timeSliderMax }}天</span>
      </div>
    </div>

    <!-- 盈亏图专项：隐波选择滑块 -->
    <div v-if="positions.length && activeTab === 'price'" class="mt-2 px-2">
      <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>隐波: {{ (ivSliderValue * 100).toFixed(1) }}%</span>
        <span class="text-gray-400">调整隐波</span>
      </div>
      <el-slider v-model="ivSliderPercent" :min="0" :max="100" :step="0.5" size="small" :show-tooltip="false"
        @input="onSliderChange" />
      <div class="flex justify-between text-[10px] text-gray-400">
        <span>0%</span>
        <span>{{ (ivMaxValue * 100).toFixed(1) }}%</span>
      </div>
    </div>
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
  multiplier: { type: Number, default: 10000 },
});

const emit = defineEmits(["removePosition", "clearAll"]);

const chartTabs = [
  { value: "price", label: "盈亏图" },
  { value: "time", label: "时间衰减" },
  { value: "iv", label: "波动率" },
];

const activeTab = ref("price");
const chartRef = ref(null);
const chartHeight = 200;
let chartInstance = null;

const RISK_FREE_RATE = 0.015;

const totalCount = computed(() => props.positions.reduce((s, p) => s + Math.abs(p.position), 0));

// 基于图表同源的 Black-Scholes 理论价，为每个持仓计算：盈亏后价(theoPrice) + 总盈亏(pnlTotal)
// 使用每个持仓自身的正股价格/到期天数/隐波，避免多标的下用错 S0
const enrichedPositions = computed(() => {
  return props.positions.map((p) => {
    let theo = p.entryPrice;
    try {
      theo = blackScholesOptionPrice(
        p.spotPrice,
        p.strike,
        RISK_FREE_RATE,
        Math.max(p.dte, 0) / 365,
        p.iv,
        p.type
      );
    } catch { }
    return {
      ...p,
      theoPrice: theo,
      pnlTotal: (theo - p.entryPrice) * p.position * props.multiplier,
    };
  });
});

const totalPnl = computed(() => {
  return enrichedPositions.value.reduce((sum, p) => sum + p.pnlTotal, 0);
});
// 组合原始价（按开仓价计算的总成本：Σ 原始价 × 持仓 × 乘数）
const portfolioCost = computed(() => {
  return props.positions.reduce((sum, p) => {
    return sum + p.entryPrice * p.position * props.multiplier;
  }, 0);
});
// 组合最新价格（按理论价计算的总市值：Σ 盈亏后价 × 持仓 × 乘数）
const portfolioValue = computed(() => {
  return enrichedPositions.value.reduce((sum, p) => {
    return sum + p.theoPrice * p.position * props.multiplier;
  }, 0);
});

// 顶部汇总显示值：盈亏图 tab 下跟随滑块实时变动（正股价格/剩余天数模拟），
// 组合最新价 = 组合原始价 + 模拟盈亏，保证 最新价 − 原始价 = 当前盈亏 恒成立
const displayPnl = computed(() => {
  if (activeTab.value === "price") {
    return calcCombinedPnl({ spot: sliderRealValue.value, dte: timeSliderValue.value, iv: ivSliderValue.value });
  }
  return totalPnl.value;
});
const displayPortfolioValue = computed(() => {
  if (activeTab.value === "price") {
    return portfolioCost.value + displayPnl.value;
  }
  return portfolioValue.value;
});

function removePosition(idx) {
  emit("removePosition", idx);
}

function clearAll() {
  emit("clearAll");
}

// ========== 滑块相关 ==========
const sliderPercent = ref(50); // 0~100
const timeSliderPercent = ref(100); // 盈亏图专用：时间滑块，默认=当前剩余天数
const ivSliderPercent = ref(0); // 盈亏图专用：隐波滑块，默认=当前平均隐波位置

const S0 = computed(() => props.spotPrice || props.positions[0]?.spotPrice || 3);
const maxDTE = computed(() => {
  const dtes = props.positions.map(p => p.dte);
  return dtes.length ? Math.max(...dtes, 0) : 30;
});
const avgIV = computed(() => {
  const sum = props.positions.reduce((s, p) => s + p.iv, 0);
  return props.positions.length ? sum / props.positions.length : 0.2;
});

// 盈亏图专用：时间滑块最大值为当前剩余天数+2
const timeSliderMax = computed(() => {
  return maxDTE.value + 2;
});
// 盈亏图专用：时间滑块的实际 DTE 值（取整）
const timeSliderValue = computed(() => {
  return Math.round(timeSliderMax.value * timeSliderPercent.value / 100);
});
// 盈亏图专用：时间滑块默认位置=当前剩余天数
function defaultTimeSliderPercent() {
  return maxDTE.value && timeSliderMax.value ? (maxDTE.value / timeSliderMax.value) * 100 : 100;
}

// 盈亏图专用：隐波滑块范围 0 ~ Max(当前隐波×2, 30%)，默认位置=当前平均隐波
const ivMaxValue = computed(() => {
  return Math.max(avgIV.value * 2, 0.3);
});
const ivSliderValue = computed(() => {
  return +(ivMaxValue.value * ivSliderPercent.value / 100).toFixed(4);
});

const sliderMinLabel = computed(() => {
  if (activeTab.value === "price") return (S0.value * 0.8).toFixed(3);
  if (activeTab.value === "time") return "0天";
  return "0%";
});

const sliderMaxLabel = computed(() => {
  if (activeTab.value === "price") return (S0.value * 1.2).toFixed(3);
  if (activeTab.value === "time") return timeSliderMax.value + "天";
  return (ivMaxValue.value * 100).toFixed(1) + "%";
});

// 实际滑块值（根据 tab 映射到真实数值）
const sliderRealValue = computed(() => {
  const pct = sliderPercent.value / 100;
  if (activeTab.value === "price") {
    return +(S0.value * 0.8 + S0.value * 0.4 * pct).toFixed(3);
  }
  if (activeTab.value === "time") {
    return Math.round(timeSliderMax.value * pct); // 剩余天数取整
  }
  // iv：0 ~ Max(当前隐波×2, 30%)
  return +(ivMaxValue.value * pct).toFixed(4);
});

const sliderLabel = computed(() => {
  if (activeTab.value === "price") {
    const changePct = ((sliderRealValue.value - S0.value) / S0.value) * 100;
    return `正股: ${sliderRealValue.value}（${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%）`;
  }
  if (activeTab.value === "time") return `剩余: ${sliderRealValue.value}天`;
  return `隐波: ${(sliderRealValue.value * 100).toFixed(1)}%`;
});

const sliderPnl = computed(() => {
  if (activeTab.value === "price") {
    return calcCombinedPnl({ spot: sliderRealValue.value, dte: timeSliderValue.value, iv: ivSliderValue.value });
  }
  if (activeTab.value === "time") {
    return calcCombinedPnl({ dte: sliderRealValue.value });
  }
  return calcCombinedPnl({ iv: sliderRealValue.value });
});

// 组合投入资金（毛成本：Σ|持仓|×开仓价×乘数），用于计算盈亏百分比
const totalCost = computed(() => {
  return props.positions.reduce((sum, p) => sum + Math.abs(p.position) * p.entryPrice * props.multiplier, 0);
});

// 盈亏百分比（相对投入资金）
const sliderPnlPct = computed(() => {
  if (!totalCost.value) return null;
  return (sliderPnl.value / totalCost.value) * 100;
});

// 滑块默认位置：波动率 tab 落在当前平均隐波处，时间衰减 tab 落在当前剩余天数(maxDTE)处，其余 tab 在中间
function defaultSliderPercent() {
  if (activeTab.value === "iv") {
    return avgIV.value && ivMaxValue.value ? (avgIV.value / ivMaxValue.value) * 100 : 0;
  }
  if (activeTab.value === "time") {
    return maxDTE.value ? (maxDTE.value / timeSliderMax.value) * 100 : 50; // 默认定位到当前剩余天数 T
  }
  return 50;
}

function onTabChange() {
  sliderPercent.value = defaultSliderPercent();
  timeSliderPercent.value = defaultTimeSliderPercent();
  ivSliderPercent.value = avgIV.value && ivMaxValue.value ? (avgIV.value / ivMaxValue.value) * 100 : 0;
  drawChart();
}

function onSliderChange() {
  drawChart();
}

// ========== 组合盈亏计算 ==========
function calcCombinedPnl({ spot, dte, iv }) {
  return props.positions.reduce((sum, pos) => {
    const S = spot ?? pos.spotPrice;
    const T = (dte ?? pos.dte) / 365;
    const sigma = iv ?? pos.iv;
    try {
      const theo = blackScholesOptionPrice(S, pos.strike, RISK_FREE_RATE, T, sigma, pos.type);
      return sum + (theo - pos.entryPrice) * pos.position * props.multiplier;
    } catch { return sum; }
  }, 0);
}

function buildPriceChart() {
  const range = S0.value * 0.2;
  const dte = timeSliderValue.value;
  const iv = ivSliderValue.value;
  const data = [];
  const N = 200;
  for (let i = 0; i <= N; i++) {
    const S = S0.value - range + (2 * range * i) / N;
    data.push([+S.toFixed(3), +calcCombinedPnl({ spot: S, dte, iv }).toFixed(0)]);
  }
  const currentPnl = +calcCombinedPnl({ spot: S0.value, dte, iv }).toFixed(0);

  return {
    tooltip: { trigger: "axis", formatter: p => `正股: ${p[0].axisValue.toFixed(3)}<br/>剩余${dte}天<br/>隐波${(iv * 100).toFixed(1)}%<br/>组合盈亏: ${p[0].data[1]}` },
    grid: { left: 55, right: 15, top: 15, bottom: 30 },
    xAxis: { type: "value", name: "正股价格", min: S0.value - range, max: S0.value + range, splitLine: { show: false } },
    yAxis: { type: "value", name: "盈亏", splitLine: { show: false } },
    series: [{
      type: "line", data, smooth: true, symbol: "none",
      lineStyle: { width: 2, color: "#2563eb" },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(37,99,235,0.15)" }, { offset: 1, color: "rgba(37,99,235,0.02)" },
        ]),
      },
      markLine: {
        silent: true,
        symbol: "none",
        data: [
          { yAxis: 0, lineStyle: { type: "dashed", color: "#999" } },
          { xAxis: sliderRealValue.value, lineStyle: { type: "solid", color: "#e02020", width: 1.5 }, label: { show: false } },
        ],
      },
      markPoint: {
        data: [
          { coord: [S0.value, currentPnl], symbol: "circle", symbolSize: 8, itemStyle: { color: "#e02020" }, label: { show: true, formatter: p => p.value, fontSize: 10 } },
          { coord: [sliderRealValue.value, +calcCombinedPnl({ spot: sliderRealValue.value, dte, iv }).toFixed(0)], symbol: "diamond", symbolSize: 10, itemStyle: { color: "#e02020" }, label: { show: true, formatter: p => p.value, fontSize: 10 } },
        ],
      },
    }],
  };
}

function buildTimeChart() {
  const data = [];
  const N = 100;
  for (let i = 0; i <= N; i++) {
    const days = (timeSliderMax.value * i) / N;
    data.push([+days.toFixed(1), +calcCombinedPnl({ dte: days }).toFixed(0)]);
  }

  return {
    tooltip: { trigger: "axis", formatter: p => `剩余: ${p[0].axisValue.toFixed(1)}天<br/>组合盈亏: ${p[0].data[1]}` },
    grid: { left: 55, right: 15, top: 15, bottom: 30 },
    xAxis: { type: "value", name: "剩余天数", min: 0, max: timeSliderMax.value, splitLine: { show: false } },
    yAxis: { type: "value", name: "盈亏", splitLine: { show: false } },
    series: [{
      type: "line", data, smooth: true, symbol: "none",
      lineStyle: { width: 2, color: "#ea580c" },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(234,88,12,0.15)" }, { offset: 1, color: "rgba(234,88,12,0.02)" },
        ]),
      },
      markLine: {
        silent: true,
        symbol: "none",
        data: [
          { yAxis: 0, lineStyle: { type: "dashed", color: "#999" } },
          { xAxis: sliderRealValue.value, lineStyle: { type: "solid", color: "#ea580c", width: 1.5 }, label: { show: false } },
        ],
      },
      markPoint: {
        data: [
          { coord: [maxDTE.value, +calcCombinedPnl({ dte: maxDTE.value }).toFixed(0)], symbol: "circle", symbolSize: 8, itemStyle: { color: "#ea580c" }, label: { show: true, formatter: p => p.value, fontSize: 10 } },
          { coord: [sliderRealValue.value, +calcCombinedPnl({ dte: sliderRealValue.value }).toFixed(0)], symbol: "diamond", symbolSize: 10, itemStyle: { color: "#ea580c" }, label: { show: true, formatter: p => p.value, fontSize: 10 } },
        ],
      },
    }],
  };
}

function buildIvChart() {
  const minIv = 0;
  const maxIv = ivMaxValue.value;
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
      markLine: {
        silent: true,
        symbol: "none",
        data: [
          { yAxis: 0, lineStyle: { type: "dashed", color: "#999" } },
          { xAxis: sliderRealValue.value * 100, lineStyle: { type: "solid", color: "#7c3aed", width: 1.5 }, label: { show: false } },
        ],
      },
      markPoint: {
        data: [
          { coord: [avgIV.value * 100, +calcCombinedPnl({ iv: avgIV.value }).toFixed(0)], symbol: "circle", symbolSize: 8, itemStyle: { color: "#7c3aed" }, label: { show: true, formatter: p => p.value, fontSize: 10 } },
          { coord: [sliderRealValue.value * 100, +calcCombinedPnl({ iv: sliderRealValue.value }).toFixed(0)], symbol: "diamond", symbolSize: 10, itemStyle: { color: "#7c3aed" }, label: { show: true, formatter: p => p.value, fontSize: 10 } },
        ],
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
watch(() => props.positions.length, (len, oldLen) => {
  if (len > 0) {
    // 新增持仓时重置所有滑块
    if (!oldLen || oldLen === 0) {
      sliderPercent.value = defaultSliderPercent();
      timeSliderPercent.value = defaultTimeSliderPercent();
      ivSliderPercent.value = avgIV.value && ivMaxValue.value ? (avgIV.value / ivMaxValue.value) * 100 : 0;
    }
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