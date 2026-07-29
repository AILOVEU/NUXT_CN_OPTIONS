<template>
  <div class="min-h-screen bg-slate-100 py-4 px-1">
    <div class="mx-auto bg-white rounded-xl shadow-md p-2">
      <div class="mb-6 p-4 bg-slate-50 rounded-lg">
        <p class="text-sm text-slate-600 mb-3 font-medium">选择横轴变量：</p>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="selectedAxis" type="radio" value="none" name="axisRadio" class="accent-blue-500" @change="handleAxisChange" />
            <span>不绘图（全部可编辑）</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="selectedAxis" type="radio" value="days" name="axisRadio" class="accent-blue-500" @change="handleAxisChange" />
            <span>到期天数(0-120)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="selectedAxis" type="radio" value="strike" name="axisRadio" class="accent-blue-500" @change="handleAxisChange" />
            <span>行权价(现价80%~120%)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="selectedAxis" type="radio" value="spot" name="axisRadio" class="accent-blue-500" @change="handleAxisChange" />
            <span>正股价格(2.8~3.2)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="selectedAxis" type="radio" value="vol" name="axisRadio" class="accent-blue-500" @change="handleAxisChange" />
            <span>隐含波动率(0-30%)</span>
          </label>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-1 mb-1">
        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">到期剩余天数</label>
          <input v-model.number="params.daysToExpire" type="number" min="0" :disabled="selectedAxis === 'days'" @input="calcOption" class="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-100 disabled:cursor-not-allowed" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">行权价 K</label>
          <input
            v-model.number="params.strikePrice"
            type="number"
            step="0.01"
            min="0.01"
            :disabled="selectedAxis === 'strike'"
            @input="calcOption"
            class="border border-slate-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">正股现价 S</label>
          <input v-model.number="params.spotPrice" type="number" step="0.01" min="0.01" :disabled="selectedAxis === 'spot'" @input="calcOption" class="border border-slate-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-100 disabled:cursor-not-allowed" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">隐含波动率 %</label>
          <input v-model.number="params.impliedVol" type="number" step="0.1" min="0.01" :disabled="selectedAxis === 'vol'" @input="calcOption" class="border border-slate-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-100 disabled:cursor-not-allowed" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">无风险利率 %</label>
          <input v-model.number="params.riskFreeRate" type="number" step="0.01" min="0" @input="calcOption" class="border border-slate-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-600">期权类型</label>
          <select v-model="params.optionType" @change="calcOption" class="border border-slate-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="call">购（看涨 Call）</option>
            <option value="put">沽（看跌 Put）</option>
          </select>
        </div>
      </div>

      <div class="bg-blue-50 rounded-lg p-2 border border-blue-100 mb-1">
        <h3 class="font-semibold text-blue-800 mb-1 text-[16px]">实时定价结果</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center py-1 border-b border-blue-100">
            <span class="text-slate-700">期权理论价格：</span>
            <span class="font-bold text-blue-700 text-lg">{{ result.optionPrice }}</span>
          </div>
          <div class="flex justify-between items-center py-1 border-b border-blue-100">
            <span class="text-slate-700">内在价值：</span>
            <span class="font-bold text-emerald-600 text-lg">
              {{ result.intrinsicValue }} <span class="text-sm font-normal text-slate-500">（占比 {{ result.intrinsicRatio }}%）</span>
            </span>
          </div>
          <div class="flex justify-between items-center py-1">
            <span class="text-slate-700">时间价值：</span>
            <span class="font-bold text-orange-600 text-lg">
              {{ result.timeValue }} <span class="text-sm font-normal text-slate-500">（占比 {{ result.timeRatio }}%）</span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="selectedAxis !== 'none'" class="border border-slate-200 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-slate-700 mb-3">价值变化曲线图</h3>
        <div ref="chartRef" class="w-full h-[420px]"></div>
      </div>
      <div v-else class="text-center text-slate-500 py-10 text-lg">当前未选择横轴变量，仅单点计算，不生成曲线图表</div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, nextTick, watch } from "vue";
import * as echarts from "echarts";

const chartRef = ref(null);
let chartInstance = null;
const selectedAxis = ref("none");

const params = reactive({
  daysToExpire: 30,
  strikePrice: 3.0,
  spotPrice: 3.0,
  impliedVol: 18,
  riskFreeRate: 1.5,
  optionType: "call",
});

const result = reactive({
  optionPrice: "0.0000",
  intrinsicValue: "0.0000",
  timeValue: "0.0000",
  intrinsicRatio: "0.00",
  timeRatio: "0.00",
});

// 高精度标准正态累积分布函数
function normCDF(x) {
  const pi = Math.PI;
  const a = [0.31938153, -0.356563782, 1.781477937, -1.821255978, 1.330274429];
  const gamma = 0.2316419;

  if (x >= 0) {
    let k = 1 / (1 + gamma * x);
    let poly = k * (a[0] + k * (a[1] + k * (a[2] + k * (a[3] + k * a[4]))));
    return 1 - (Math.exp((-x * x) / 2) / Math.sqrt(2 * pi)) * poly;
  } else {
    return 1 - normCDF(-x);
  }
}

// BS核心公式
function blackScholes(S, K, T, r, sigma, optType) {
  if (T <= 0) {
    return optType === "call" ? Math.max(0, S - K) : Math.max(0, K - S);
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  let price;
  if (optType === "call") {
    price = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
  } else {
    price = K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
  }
  return Math.max(0, price);
}

// 价值计算入口
function calcValue(S, K, days, volPct, ratePct, type) {
  const T = days / 252;
  const sigma = volPct / 100;
  const r = ratePct / 100;

  const premium = blackScholes(S, K, T, r, sigma, type);
  const intrinsic = type === "call" ? Math.max(0, S - K) : Math.max(0, K - S);
  const timeValue = Math.max(0, premium - intrinsic);

  return {
    premium: Number(premium.toFixed(6)),
    intrinsic: Number(intrinsic.toFixed(6)),
    time: Number(timeValue.toFixed(6)),
  };
}

// ========== 新增：仅更新图表数据（不销毁重建，性能更好） ==========
function updateChartData() {
  const range = getAxisRange();
  if (!range || !chartInstance) return;
  const data = generateLineData(range);

  chartInstance.setOption({
    series: [
      { data: data.map((item) => [item[0], item[1]]) },
      { data: data.map((item) => [item[0], item[2]]) },
      { data: data.map((item) => [item[0], item[3]]) },
    ]
  });
}

// 页面单点实时计算
const calcOption = () => {
  const res = calcValue(params.spotPrice, params.strikePrice, params.daysToExpire, params.impliedVol, params.riskFreeRate, params.optionType);
  let inRatio = 0,
    tmRatio = 0;
  if (res.premium > 0.0001) {
    inRatio = (res.intrinsic / res.premium) * 100;
    tmRatio = (res.time / res.premium) * 100;
  }
  result.optionPrice = res.premium.toFixed(4);
  result.intrinsicValue = res.intrinsic.toFixed(4);
  result.timeValue = res.time.toFixed(4);
  result.intrinsicRatio = inRatio.toFixed(2);
  result.timeRatio = tmRatio.toFixed(2);

  // ========== 新增：参数变化时同步更新图表 ==========
  if (selectedAxis.value !== "none" && chartInstance) {
    updateChartData();
  }
};

// 获取横轴区间配置
function getAxisRange() {
  switch (selectedAxis.value) {
    case "days":
      return { min: 0, max: 120, name: "到期天数(天)", key: "days" };
    case "strike":
      return { min: +(params.spotPrice * 0.8).toFixed(4), max: +(params.spotPrice * 1.2).toFixed(4), name: "行权价", key: "strike" };
    case "spot":
      return { min: 2.5, max: 3.5, name: "正股价格", key: "spot" };
    case "vol":
      return { min: 0, max: 30, name: "隐含波动率(%)", key: "vol" };
    default:
      return null;
  }
}

// 生成曲线原始数据
function generateLineData(range, pointNum = 180) {
  if (!range) return [];
  const { min, max, key } = range;
  const list = [];
  const stepCnt = pointNum - 1;

  for (let i = 0; i <= pointNum; i++) {
    const percent = i / stepCnt;
    const x = min + (max - min) * percent;

    let s = params.spotPrice;
    let k = params.strikePrice;
    let tDay = params.daysToExpire;
    let vol = params.impliedVol;

    switch (key) {
      case "days":
        tDay = x;
        break;
      case "strike":
        k = x;
        break;
      case "spot":
        s = x;
        break;
      case "vol":
        vol = x;
        break;
    }

    const val = calcValue(s, k, tDay, vol, params.riskFreeRate, params.optionType);
    list.push([+x.toFixed(4), +val.premium.toFixed(4), +val.intrinsic.toFixed(4), +val.time.toFixed(4)]);
  }
  return list;
}

// 切换横轴、重绘图表统一入口
const handleAxisChange = async () => {
  // 切换到不绘图模式：销毁实例
  if (selectedAxis.value === "none") {
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }
    calcOption();
    return;
  }

  // 只有实例不存在时才初始化，避免重复销毁重建
  if (!chartInstance) {
    await nextTick();
    if (!chartRef.value) return;
    chartInstance = echarts.init(chartRef.value);
  }

  const range = getAxisRange();
  const data = generateLineData(range);

  const option = {
    tooltip: {
      trigger: "axis",
      formatter(params) {
        let tipText = `${range.name}：${params[0].axisValue.toFixed(4)}<br/>`;
        params.forEach((item) => {
          tipText += `${item.seriesName}：${(+item.data[1] * 10000).toFixed(0)}<br/>`;
        });
        return tipText;
      },
    },
    legend: {
      data: ["期权总价格", "内在价值", "时间价值"],
      top: 10,
    },
    grid: { left: 60, right: 30, top: 60, bottom: 60 },
    xAxis: {
      type: "value",
      name: range.name,
      min: range.min,
      max: range.max,
      splitNumber: 10,
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      name: "期权价值",
      min: 0,
      scale: false,
    },
    series: [
      {
        name: "期权总价格",
        type: "line",
        smooth: false,
        data: data.map((item) => [item[0], item[1]]),
        lineStyle: { width: 2, color: "#2563eb" },
        symbol: "none",
      },
      {
        name: "内在价值",
        type: "line",
        smooth: false,
        data: data.map((item) => [item[0], item[2]]),
        lineStyle: { width: 2, color: "#059669" },
        symbol: "none",
      },
      {
        name: "时间价值",
        type: "line",
        smooth: false,
        data: data.map((item) => [item[0], item[3]]),
        lineStyle: { width: 2, color: "#ea580c" },
        symbol: "none",
      },
    ],
  };
  // true 表示完全替换配置，不与旧配置合并，避免切换横轴时残留
  chartInstance.setOption(option, true);
  calcOption();
};

// 窗口大小变化自适应
window.addEventListener("resize", () => {
  if (chartInstance) chartInstance.resize();
});

onMounted(() => {
  calcOption();
  handleAxisChange();
});
</script>