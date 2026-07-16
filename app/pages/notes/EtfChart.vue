<script setup>
import { computed, ref, watch, onMounted } from "vue";
import * as echarts from "echarts";

const props = defineProps({
  name: String,
  code: String,
  prevClose: Number,
  data: Array,
});

const chartRef = ref(null);
let chartInstance = null;

const times = computed(() => props.data.map((d) => d[0]));
const closePrices = computed(() => props.data.map((d) => d[4]));
const volumes = computed(() => props.data.map((d) => d[5]));

// 当日收盘涨跌幅
const pctChange = computed(() => {
  if (!props.prevClose || !props.data.length) return 0;
  const last = props.data[props.data.length - 1][4];
  return (((last - props.prevClose) / props.prevClose) * 100).toFixed(2);
});
const isUp = computed(() => Number(pctChange.value) >= 0);

// 当日最高价、最低价
const dayHigh = computed(() => {
  if (!props.data.length) return 0;
  return Math.max(...props.data.map((item) => item[2]));
});
const dayLow = computed(() => {
  if (!props.data.length) return 0;
  return Math.min(...props.data.map((item) => item[3]));
});

// 最高点相对昨收涨跌幅
const highPct = computed(() => {
  if (!props.prevClose || dayHigh.value === 0) return "0.00";
  return (((dayHigh.value - props.prevClose) / props.prevClose) * 100).toFixed(2);
});
// 最低点相对昨收涨跌幅
const lowPct = computed(() => {
  if (!props.prevClose || dayLow.value === 0) return "0.00";
  return (((dayLow.value - props.prevClose) / props.prevClose) * 100).toFixed(2);
});

// 当日振幅
function getAmplitude() {
  if (!props.prevClose || !props.data.length) return "0.00";
  const high = dayHigh.value;
  const low = dayLow.value;
  return (((high - low) / props.prevClose) * 100).toFixed(2);
}

// 核心：滑动窗口±30分钟局部高低点 + 10分钟内同类型极值只留第一个
function getLocalExtremumMarkPoints() {
  const dataList = props.data;
  const total = dataList.length;
  if (total === 0) return [];
  const markPoints = [];
  const windowRange = 30; // 前后各30根K线窗口
  const duplicateGap = 10; // 10根K线=10分钟内重复极值忽略

  // 记录最近一次高点、低点索引，用于去重
  let lastHighIdx = -Infinity;
  let lastLowIdx = -Infinity;

  for (let i = 0; i < total; i++) {
    // 滑动窗口边界
    const left = Math.max(0, i - windowRange);
    const right = Math.min(total - 1, i + windowRange);
    let winMax = -Infinity;
    let winMin = Infinity;

    // 计算窗口内最高最低价格
    for (let j = left; j <= right; j++) {
      const h = dataList[j][2];
      const l = dataList[j][3];
      if (h > winMax) winMax = h;
      if (l < winMin) winMin = l;
    }

    const currHigh = dataList[i][2];
    const currLow = dataList[i][3];
    const currTime = dataList[i][0];

    // 当前是局部高点
    if (currHigh === winMax) {
      // 判断距离上一个高点是否超过10根K线，不足则跳过
      if (i - lastHighIdx >= duplicateGap) {
        markPoints.push({
          coord: [i, currHigh],
          symbol: "triangle",
          symbolRotate: 0,
          symbolSize: 10,
          itemStyle: { color: "#ef4444" },
          label: {
            show: true,
            formatter: currTime,
            position: "top",
            fontSize: 12,
            color: "#ef4444",
          },
        });
        lastHighIdx = i;
      }
    }

    // 当前是局部低点
    if (currLow === winMin) {
      // 判断距离上一个低点是否超过10根K线，不足则跳过
      if (i - lastLowIdx >= duplicateGap) {
        markPoints.push({
          coord: [i, currLow],
          symbol: "triangle",
          symbolRotate: 180,
          symbolSize: 10,
          itemStyle: { color: "#22c55e" },
          label: {
            show: true,
            formatter: currTime,
            position: "bottom",
            fontSize: 12,
            color: "#22c55e",
          },
        });
        lastLowIdx = i;
      }
    }
  }
  return markPoints;
}

function initChart() {
  if (!chartRef.value) return;

  chartInstance = echarts.init(chartRef.value);

  const upColor = "#ef4444";
  const downColor = "#22c55e";
  const lineColor = isUp.value ? upColor : downColor;
  const markData = getLocalExtremumMarkPoints();

  const option = {
    grid: [
      { left: 60, right: 20, top: 30, height: "55%" },
      { left: 60, right: 20, top: "72%", height: "20%" },
    ],
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      formatter: (params) => {
        const time = params[0].axisValue;
        const idx = times.value.indexOf(time);
        const d = props.data[idx];
        if (!d) return "";

        const open = d[1];
        const high = d[2];
        const low = d[3];
        const close = d[4];
        const vol = d[5];
        const prev = props.prevClose;

        const amplitude = (((high - low) / prev) * 100).toFixed(2);
        const changeVal = close - prev;
        const changePct = ((changeVal / prev) * 100).toFixed(2);
        const tipUp = changePct >= 0;
        const color = tipUp ? "#ef4444" : "#22c55e";
        const sign = tipUp ? "+" : "";

        return `
          <div style="font-weight:600;margin-bottom:4px">${time}</div>
          开: ${open}<br/>
          高: ${high}<br/>
          低: ${low}<br/>
          收: ${close}<br/>
          量: ${vol.toLocaleString()}<br/>
          振幅: ${amplitude}%<br/>
          <span style="color:${color}">涨跌幅: ${sign}${changePct}%</span>
        `;
      },
    },
    xAxis: [
      {
        type: "category",
        data: times.value,
        gridIndex: 0,
        axisLine: { lineStyle: { color: "#ddd" } },
        axisLabel: { show: false },
        axisTick: { show: false },
      },
      {
        type: "category",
        data: times.value,
        gridIndex: 1,
        axisLine: { lineStyle: { color: "#ddd" } },
        axisLabel: { color: "#666", fontSize: 11 },
        axisTick: { show: false },
      },
    ],
    yAxis: [
      {
        type: "value",
        gridIndex: 0,
        scale: true,
        splitLine: { lineStyle: { color: "#f0f0f0" } },
        axisLabel: { color: "#666", fontSize: 11 },
      },
      {
        type: "value",
        gridIndex: 1,
        splitLine: { show: false },
        axisLabel: { show: false },
        axisTick: { show: false },
      },
    ],
    series: [
      {
        name: "价格",
        type: "line",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: closePrices.value,
        smooth: true,
        symbol: "none",
        lineStyle: { color: lineColor, width: 1.5 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: isUp.value ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)" },
            { offset: 1, color: "rgba(255,255,255,0)" },
          ]),
        },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { type: "dashed", color: "#999", width: 1 },
          data: [{ yAxis: props.prevClose, label: { formatter: "昨收", fontSize: 10, color: "#999" } }],
        },
        markPoint: {
          data: markData,
        },
      },
      {
        name: "成交量",
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes.value,
        itemStyle: {
          color: (params) => {
            const idx = params.dataIndex;
            if (idx === 0) return "#999";
            return props.data[idx][4] >= props.data[idx - 1][4] ? upColor : downColor;
          },
        },
      },
    ],
  };

  chartInstance.setOption(option);
}

function resize() {
  chartInstance?.resize();
}

onMounted(() => {
  initChart();
  window.addEventListener("resize", resize);
});

watch(
  () => [props.data, props.prevClose],
  () => {
    if (chartInstance) {
      chartInstance.dispose();
    }
    initChart();
  },
  { deep: true }
);
</script>

<template>
  <div class="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-4">
    <div class="flex justify-between items-start mb-2">
      <div class="title-wrap">
        <span class="font-semibold text-base text-gray-800 mr-2">{{ code }}</span>
        <span class="text-sm text-gray-500">{{ name }}</span>
      </div>
      <!-- 右侧丰富数据区域 -->
      <div class="text-right">
        <!-- 当日收盘涨跌（主大号字体） -->
        <div class="font-bold text-lg" :class="isUp ? 'text-[red]' : 'text-[green]'">{{ isUp ? "+" : "" }}{{ pctChange }}%</div>
        <!-- 最高点涨幅 -->
        <div class="text-xs mt-1" :class="Number(highPct) >= 0 ? 'text-[red]' : 'text-[green]'">
          最高 <span class="inline-block text-left font-mono">{{ Number(highPct) >= 0 ? "+" : "" }}{{ highPct }}%</span>
        </div>
        <!-- 最低点跌幅 -->
        <div class="text-xs mt-0.5" :class="Number(lowPct) >= 0 ? 'text-[red]' : 'text-[green]'">
          最低 <span class="inline-block text-left font-mono">{{ Number(lowPct) >= 0 ? "+" : "" }}{{ lowPct }}%</span>
        </div>
        <!-- 振幅 无红绿颜色 -->
        <div class="text-xs mt-0.5 text-gray-500 flex justify-between items-center">
          <span class="text-xs text-gray-500">振幅</span> <span class="inline-block text-right font-mono">{{ getAmplitude() }}%</span>
        </div>
      </div>
    </div>
    <div ref="chartRef" class="w-full h-[230px]"></div>
  </div>
</template>
