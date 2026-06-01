<template>
  <div class="max-md:w-[300%]">
    <div>
      <Nav />
      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" :disabled="loading" />
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center h-[calc(100vh-100px)] max-md:h-[calc(300vh-100px)]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-500">数据加载中...</p>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!fundData.length" class="flex items-center justify-center h-[calc(100vh-100px)] max-md:h-[calc(300vh-100px)]">
      <p class="text-gray-500">暂无数据</p>
    </div>

    <!-- 图表容器 -->
    <div v-else class="w-full overflow-auto h-[calc(100vh-100px)] max-md:h-[calc(300vh-100px)]">
      <VChart
        :option="options"
        ref="echartRef"
        :style="{
          height: rowNum * (isMobile ? 60 : 45) + 'vh',
          width: isMobile ? '280vw' : '95vw',
          margin: 'auto',
        }"
      />
    </div>
  </div>
</template>

<script setup>
import _ from "lodash";
import { get_http_data } from "~/utils/options";
import { OPTIONS_MAP } from "~/data";
import dayjs from "dayjs";
import { useGlobal } from "~/stores/useGlobal.js";
import { getFourWednesdayOfMonth, getDatesBetween, resizeFontSize, getMinPointFiveMultiple, getMaxPointFiveMultipleLessThan } from "~/utils/utils";

// ==================== 常量定义（提取魔法数字） ====================
const { setGlobalLoading, isMobile } = useGlobal();
const BEND = 2025;
const COL_NUM = 1; // 固定列数
const GAP = 1; // 网格间距
const PADDING = 0.5; // 图表内边距
const Y_SCALE_RATIO = 0.01; // Y轴上下留白比例
const BG_COLOR = "rgba(30, 144, 255, 0.15)"; // 月初背景色
const MARK_LINE_COLOR = "rgba(254, 217, 131, 0.6)"; // 交割日线颜色
const TODAY_LINE_COLOR = "rgba(255, 0, 0, 0.6)"; // 今日线颜色
const WATERMARK_COLOR = "rgba(233, 233, 233, 0.2)"; // 水印颜色
const DEBOUNCE_DELAY = 300; // 防抖延迟

// ==================== 响应式数据 ====================
const stockCodeOptions = computed(() => {
  const ops = OPTIONS_MAP.map((el) => ({
    value: el.code,
    label: el.showName,
  }));
  return [...ops, { value: "all", label: "全" }];
});

const fundData = ref([]);
const echartRef = ref();
const rowNum = ref(1);
const stockCode = ref(stockCodeOptions.value[0].value);
const loading = ref(false);
const abortController = ref(null); // 用于取消请求

// ==================== 工具函数（提取复用） ====================
// 补零函数
function getZeroNumber(month) {
  return month < 10 ? `0${month}` : month;
}

// 格式化小数
function formatDecimal(num, decimal) {
  if (num === undefined || num === null || isNaN(num)) return "--";
  return Number(num).toFixed(decimal);
}

// 格式化数字为万单位
function formatNumberToWan(num) {
  if (num === undefined || num === null || isNaN(num)) return "--";
  return Number(num).toLocaleString();
}

// ==================== 业务逻辑 ====================
// 带取消功能的查询函数
async function handleQuery() {
  // 取消上一个未完成的请求
  if (abortController.value) {
    abortController.value.abort();
  }

  // 创建新的取消控制器
  abortController.value = new AbortController();

  loading.value = true;
  setGlobalLoading(true);

  try {
    fundData.value = await $fetch("/api/queryFundDataJson", {
      method: "get",
      params: {
        fundCode: stockCode.value,
      },
      signal: abortController.value.signal,
    });
  } catch (error) {
    // 忽略取消请求的错误
    if (error.name !== "AbortError") {
      console.error("数据查询失败:", error);
      fundData.value = [];
    }
  } finally {
    loading.value = false;
    setGlobalLoading(false);
  }
}

// 防抖处理股票代码切换
const debouncedHandleQuery = _.debounce(handleQuery, DEBOUNCE_DELAY);

function handleStockCodeChange() {
  debouncedHandleQuery();
}

// 生成图表配置
const options = computed(() => {
  if (!fundData.value?.length) return {};

  // 计算年份数量（行数）
  const uniqueYears = Array.from(new Set(fundData.value.map((el) => dayjs(el.date, "YYYY-MM-DD").year())));
  rowNum.value = uniqueYears.length;

  // 计算网格尺寸
  const gridWidth = (100 - 2 * PADDING - (COL_NUM - 1) * GAP) / COL_NUM;
  const gridHeight = (100 - 2 * PADDING - (rowNum.value - 1) * GAP) / rowNum.value;

  const gridArr = [];
  const xAxisArr = [];
  const yAxisArr = [];
  const seriesArr = [];
  const graphicArr = [];

  // 按年份倒序处理（最新年份在最上面）
  for (let row = 0; row < rowNum.value; row++) {
    const year = BEND - row;
    const index = row;

    // 生成当年12个月的前缀
    const monthPrefixes = Array.from({ length: 12 }, (_, i) => `${year}-${getZeroNumber(i + 1)}-`);

    // 获取当年所有日期范围
    const startDate = dayjs(`${year}-01-01`).format("YYYY-MM-DD");
    const endDate = dayjs(`${year}-12-31`).format("YYYY-MM-DD");
    const allDatesInYear = getDatesBetween(startDate, endDate);

    // 过滤当年数据并补全缺失日期
    const yearData = fundData.value.filter((el) => el.date.startsWith(`${year}-`));
    const completeYearData = allDatesInYear.map((date) => yearData.find((item) => item.date === date) || { date });

    // 获取每月第四个周三（交割日）
    const monthFourthWednesdayList = monthPrefixes.map((prefix) => getFourWednesdayOfMonth(`${prefix}01`));

    // 计算网格位置
    const left = PADDING;
    const top = PADDING + row * (gridHeight + GAP);

    // 添加网格
    gridArr.push({
      left: `${left}%`,
      top: `${top}%`,
      width: `${gridWidth}%`,
      height: `${gridHeight}%`,
      containLabel: true,
    });

    // 添加X轴
    xAxisArr.push({
      gridIndex: index,
      type: "category",
      data: allDatesInYear,
      axisLabel: {
        rotate: 45,
        fontSize: 16,
        interval: 0,
        formatter: (value) => (value.endsWith("-01") ? value : ""),
      },
    });

    // 计算Y轴范围
    const validLows = completeYearData.map((el) => el.low).filter((v) => v !== undefined);
    const validHighs = completeYearData.map((el) => el.high).filter((v) => v !== undefined);

    const curMin = validLows.length ? _.min(validLows) : 0;
    const curMax = validHighs.length ? _.max(validHighs) : 100;

    const yMin = curMin * (1 - Y_SCALE_RATIO);
    const yMax = curMax * (1 + Y_SCALE_RATIO);

    // 添加Y轴
    yAxisArr.push({
      gridIndex: index,
      type: "value",
      min: yMin,
      max: yMax,
      axisLabel: { show: false },
      splitLine: { show: false },
    });

    // ==================== 月初蓝色背景高亮 ====================
    const bgData = allDatesInYear.map((date) => (date.endsWith("-01") ? yMax : null));

    seriesArr.push({
      type: "bar",
      xAxisIndex: index,
      yAxisIndex: index,
      data: bgData,
      barWidth: "100%",
      itemStyle: { color: BG_COLOR },
      z: 1,
      markLine: {
        symbol: "none",
        label: { show: false },
        lineStyle: {
          color: MARK_LINE_COLOR,
          width: 1,
          type: "solid",
        },
        data: monthFourthWednesdayList.map((date) => ({
          name: date,
          xAxis: date,
        })),
      },
    });

    // ==================== K线图 ====================
    const seriesData = completeYearData.map((el) => [el.open, el.close, el.low, el.high, el.date]);

    seriesArr.push({
      name: `${stockCode.value}_${year}年`,
      type: "candlestick",
      xAxisIndex: index,
      yAxisIndex: index,
      data: seriesData,
      itemStyle: { borderRadius: 1 },
      barWidth: "100%",
      z: 2,
      markLine: {
        symbol: ["none", "triangle"],
        label: { show: true },
        lineStyle: {
          color: TODAY_LINE_COLOR,
          width: 1,
          type: "solid",
        },
        data: [
          {
            name: `${year}${dayjs().format("-MM-DD")}`,
            xAxis: `${year}${dayjs().format("-MM-DD")}`,
          },
        ],
      },
    });

    // ==================== 水印文字 ====================
    graphicArr.push({
      type: "text",
      left: `${left + gridWidth / 4}%`,
      top: `${top + gridHeight / 4}%`,
      style: {
        text: `${stockCode.value}  ${year}年`,
        fontSize: isMobile ? 18 : 40,
        fontWeight: "bold",
        fill: WATERMARK_COLOR,
        textAlign: "left",
      },
      responsive: true,
    });
  }

  // 图表渲染后调整大小
  nextTick(() => {
    echartRef.value?.resize();
  });

  return {
    graphic: graphicArr,
    title: { left: "center", top: 10 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: function (params) {
        // 优先取蜡烛图数据
        const target = params.find((p) => p.seriesType === "candlestick") || params[0];
        if (!target || !target.data) return "";

        const { name, marker } = target;
        const data = target.data;
        const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const weekNumb = dayjs(name).day();

        if (data[1] === undefined) return `${marker}${name} ${weekdays[weekNumb]}<br />`;

        const 收盘 = data[2];
        const 开盘 = data[1];
        const 涨跌 = formatDecimal((100 * (收盘 - 开盘)) / 开盘, 2);
        const 涨跌幅度 = formatDecimal((100 * (data[4] - data[3])) / data[3], 2);

        return `${marker}${name} ${weekdays[weekNumb]}<br />
        收盘：${formatNumberToWan(收盘)}<br/>
        开盘：${formatNumberToWan(开盘)}<br/><br/>
        <span style="color: ${涨跌 > 0 ? "red" : "green"}">${涨跌 > 0 ? "涨" : "跌"}: ${涨跌}%</span>
        <br/>
        <span>波幅: ${涨跌幅度}%</span>
        <br/><br/>
        最高：${formatNumberToWan(data[4])}<br/>
        最低：${formatNumberToWan(data[3])}`;
      },
    },
    grid: gridArr,
    xAxis: xAxisArr,
    yAxis: yAxisArr,
    series: seriesArr,
  };
});

// ==================== 生命周期 ====================
onMounted(() => {
  handleQuery();
});

onUnmounted(() => {
  // 清理防抖函数
  debouncedHandleQuery.cancel();

  // 取消未完成的请求
  if (abortController.value) {
    abortController.value.abort();
  }
});
</script>

<style scoped></style>
