<template>
  <!-- 卡片容器 -->
  <div class="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-4">
    <!-- 头部标题行 -->
    <div class="flex justify-between items-center mb-2">
      <div class="title-wrap">
        <span class="font-semibold text-base text-gray-800 mr-2">{{ code }}</span>
        <span class="text-sm text-gray-500">{{ name }}</span>
      </div>
      <div class="font-semibold text-base" :class="isUp ? 'text-red-500' : 'text-green-500'">{{ isUp ? "+" : "" }}{{ pctChange }}%</div>
    </div>
    <!-- 图表容器 -->
    <div ref="chartRef" class="w-full h-[230px]"></div>
  </div>
</template>
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

const pctChange = computed(() => {
  if (!props.prevClose || !props.data.length) return 0;
  const last = props.data[props.data.length - 1][4];
  return (((last - props.prevClose) / props.prevClose) * 100).toFixed(2);
});

const isUp = computed(() => Number(pctChange.value) >= 0);

function initChart() {
  if (!chartRef.value) return;

  chartInstance = echarts.init(chartRef.value);

  const upColor = "#ef4444";
  const downColor = "#22c55e";
  const lineColor = isUp.value ? upColor : downColor;

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

        // 振幅
        const amplitude = (((high - low) / prev) * 100).toFixed(2);
        // 涨跌额、涨跌幅
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
