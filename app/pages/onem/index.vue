<template>
  <MouseXLine />
  <div>
    <Nav />
    <div class="w-full pb-[12px]">
      <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
    </div>
  </div>
  <div class="w-full p-2 box-border" :key="stockCode">
    <div v-for="(item, index) in dailyKlineData" :key="index" class="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
      <h3 class="m-0 p-3 bg-[#f7f8fa] border-b border-[#eee] flex items-baseline gap-4">
        <span class="text-base font-semibold text-[#1f2329]">{{ item.date }}</span>
        <span v-if="item.hasData" class="text-sm font-medium flex gap-3.5">
          <span
            :class="{
              'text-red-600': item.change > 0,
              'text-green-600': item.change < 0,
              'text-[#86909c]': item.change === 0,
            }"
          >
            {{ item.change > 0 ? "+" : "" }}{{ item.change.toFixed(3) }} ({{ item.change > 0 ? "+" : "" }}{{ item.changePercent.toFixed(2) }}%)
          </span>
          <span class="text-[#86909c]">振幅 {{ item.amplitude.toFixed(2) }}%</span>
        </span>
        <span v-else class="text-sm text-[#86909c]">无交易数据</span>
      </h3>

      <!-- ✅ 动态高度：(yMax - yMin) * 10px -->
      <VChart
        :option="getEchartsKlineOption(item.data, item.preClose, item.high, item.low)"
        :style="{
          height: `${(item.yMax - item.yMin) * 1000}px`,
          width: '100%',
          margin: '0 auto',
        }"
        class="block"
      />
    </div>
  </div>
</template>

<script setup>
import { OPTIONS_MAP } from "~/data";
const stockCodeOptions = computed(() => {
  const ops = OPTIONS_MAP.map((el) => ({
    value: el.code,
    label: el.showName,
  }));
  return [...ops, { value: "all", label: "全" }];
});

const chartWidth = ref(window.innerWidth);
const dailyKlineData = ref([]);
const stockCode = ref(stockCodeOptions.value[0].value);

async function handleQuery() {
  try {
    const _tiledData = await $fetch("/api/queryMinutesData", {
      method: "get",
      params: {
        fundCode: stockCode.value,
      },
    });
    dailyKlineData.value = transformToDailyKline(_tiledData);
  } catch (error) {
  } finally {
  }
}
onMounted(async () => {
  handleQuery();
});

function handleStockCodeChange() {
  handleQuery();
}

function transformToDailyKline(aaa) {
  const dayMap = {};

  aaa.forEach((item) => {
    const date = item.time.split(" ")[0];
    const klineItem = {
      time: new Date(item.time).getTime(),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
    };

    if (!dayMap[date]) {
      dayMap[date] = [];
    }
    dayMap[date].push(klineItem);
  });

  const dayEntries = Object.keys(dayMap).map((date) => {
    const data = dayMap[date];
    const hasData = data.length > 0;

    if (!hasData) {
      return { date, data, hasData: false };
    }

    const open = data[0].open;
    const close = data[data.length - 1].close;
    const high = Math.max(...data.map((i) => i.high));
    const low = Math.min(...data.map((i) => i.low));
    const amplitude = ((high - low) / open) * 100;

    return {
      date,
      data,
      hasData: true,
      open,
      close,
      high,
      low,
      amplitude,
    };
  });

  let lastValidClose = null;
  for (let i = 0; i < dayEntries.length; i++) {
    const current = dayEntries[i];
    if (current.hasData) {
      current.preClose = lastValidClose ?? current.open;
      current.change = current.close - current.preClose;
      current.changePercent = (current.change / current.preClose) * 100;

      // ✅ 计算 Y 轴范围
      const maxDev = Math.max(current.high - current.preClose, current.preClose - current.low);
      current.yMin = current.preClose - maxDev;
      current.yMax = current.preClose + maxDev;

      lastValidClose = current.close;
    } else {
      current.preClose = null;
      current.change = 0;
      current.changePercent = 0;
    }
  }

  return dayEntries;
}

const getEchartsKlineOption = (data, preClose, dayHigh, dayLow) => {
  const filtered = data.filter((item) => {
    const t = new Date(item.time);
    const h = t.getHours();
    const m = t.getMinutes();
    if ((h === 11 && m >= 30) || h === 12) return false;
    return true;
  });

  const xAxisData = filtered.map((item) => {
    const d = new Date(item.time);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  });

  const seriesData = filtered.map((item) => [item.open, item.close, item.low, item.high]);

  // Y 轴对称居中
  const maxDev = Math.max(dayHigh - preClose, preClose - dayLow);
  const yMin = preClose - maxDev;
  const yMax = preClose + maxDev;

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      formatter: (params) => {
        const timeStr = xAxisData[params[0].dataIndex];
        const d = params[0].data;
        return `${timeStr}<br/>开盘：${d[0]}<br/>收盘：${d[1]}<br/>最低：${d[2]}<br/>最高：${d[3]}`;
      },
    },
    grid: { left: "10%", right: "10%", top: "15%", bottom: "15%" },
    xAxis: {
      type: "category",
      data: xAxisData,
      axisLabel: {
        formatter: (v) => (v.endsWith(":00") || v.endsWith(":30") ? v : ""),
        interval: 0,
        rotate: 0,
      },
      axisTick: {
        alignWithLabel: true,
        interval: (i, v) => v.endsWith(":00") || v.endsWith(":30"),
      },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      min: yMin,
      max: yMax,
      scale: false,
      axisLabel: { formatter: (v) => v.toFixed(3) },
    },
    series: [
      {
        name: "1分钟K线",
        type: "candlestick",
        data: seriesData,
        itemStyle: {
          color: "#ef5350",
          color0: "#26a69a",
          borderColor: "#ef5350",
          borderColor0: "#26a69a",
        },
        markLine: preClose
          ? {
              silent: true,
              data: [{ yAxis: preClose }],
              lineStyle: { color: "#666", type: "dashed", width: 1 },
              label: { formatter: "前收", color: "#666", fontSize: 11 },
            }
          : undefined,
      },
    ],
  };
};
</script>
