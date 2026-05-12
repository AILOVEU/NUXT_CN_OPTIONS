<template>
  <div class="max-md:w-[300%]">
    <div>
      <Nav />
      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>
    <div class="w-full overflow-auto h-[calc(100vh-100px)] max-md:h-[calc(300vh-100px)]">
      <VChart :option="options" ref="echartRef" :style="{ height: rowNum * (isMobile ? 60 : 30) + 'vh', width: isMobile ? '300vw' : '200vw', margin: 'auto' }" />
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
const { setGlobalLoading, isMobile } = useGlobal();
const stockCodeOptions = computed(() => {
  let ops = OPTIONS_MAP.map((el) => ({
    value: el.code,
    label: el.showName,
  }));
  return [...ops, { value: "all", label: "全" }];
});
const fundData = ref([]);
const echartRef = ref();
const rowNum = ref(1);
const BEND = 2025;
const stockCode = ref(stockCodeOptions.value[0].value);

onMounted(async () => {
  handleQuery();
});

// 全局计算所有数据的最大/最小值（所有格子共用）
function getGlobalMax(list) {
  if (!Array.isArray(list) || list.length === 0) return 100;
  return list.reduce((max, item) => Math.max(max, item.high || 0), 0);
}
function getGlobalMin(list) {
  if (!Array.isArray(list) || list.length === 0) return 0;
  return list.reduce((min, item) => Math.min(min, item.low || 0), Infinity);
}

let loading = ref(false);
async function handleQuery() {
  loading.value = true;
  fundData.value = await $fetch("/api/queryFundDataJson", {
    method: "get",
    params: {
      fundCode: stockCode.value,
    },
  });
  loading.value = false;
}

function handleStockCodeChange() {
  setTimeout(() => {
    handleQuery();
  });
}

const options = computed(() => {
  if (!fundData.value?.length) return {};

  let monthLen = Array.from(new Set(fundData.value.map((el) => dayjs(el["date"], "YYYY-MM-DD").format("YYYY-MM"))))?.length;
  const colNum = 4;
  rowNum.value = Math.floor(monthLen / 3 / colNum) + 1;
  setTimeout(() => {
    echartRef.value?.resize();
  });
  const gap = 1;
  const padding = 0.5;

  const gridArr = [];
  const xAxisArr = [];
  const yAxisArr = [];
  const seriesArr = [];
  const graphicArr = [];

  const gridWidth = (100 - 2 * padding - (colNum - 1) * gap) / colNum;
  const gridHeight = (100 - 2 * padding - (rowNum.value - 1) * gap) / rowNum.value;

  // 关键：给每个网格预留上下边距比例，统一留白比例
  const Y_SCALE_RATIO = 0.01; // 上下各留8%留白，可微调 0.05~0.15

  for (let row = 0; row < rowNum.value; row++) {
    for (let col = 0; col < colNum; col++) {
      let index = row * colNum + col;
      if (row * colNum * 3 + col + 1 > fundData.value.length) continue;
      const yearStr = BEND - row;
      const monthVal = col * 3 + 1;
      function getZeroNumber(month) {
        return month < 10 ? "0" + month : month;
      }
      const curYearMonthStrList = [`${yearStr}-${getZeroNumber(monthVal)}-`, `${yearStr}-${getZeroNumber(monthVal + 1)}-`, `${yearStr}-${getZeroNumber(monthVal + 2)}-`];
      const curYearMonthDayList = getDatesBetween(dayjs(curYearMonthStrList[0], "YYYY-MM-").startOf("month").format("YYYY-MM-DD"), dayjs(curYearMonthStrList[2], "YYYY-MM-").endOf("month").format("YYYY-MM-DD"));
      const curYearFilteredData = fundData.value?.filter((el) => el.date.startsWith(yearStr + "-"));
      let filteredData = fundData.value?.filter((el) => curYearMonthStrList.some((curYearMonthStr) => el.date.startsWith(curYearMonthStr)));
      filteredData = curYearMonthDayList.map((date) => filteredData.find((item) => item.date === date) || { date });

      const xAxisData = filteredData.map((el) => el.date);
      const seriesData = filteredData.map((el) => [el.open, el.close, el.low, el.high, el.date]);
      const left = padding + col * (gridWidth + gap);
      const top = padding + row * (gridHeight + gap);

      const graphicLeft = left + gridWidth / 4;
      const graphicTop = top + gridHeight / 4;
      gridArr.push({
        left: `${left}%`,
        top: `${top}%`,
        width: `${gridWidth}%`,
        height: `${gridHeight}%`,
        containLabel: true,
      });

      xAxisArr.push({
        gridIndex: index,
        type: "category",
        data: xAxisData,
        axisLabel: {
          rotate: 10,
          fontSize: 10,
        },
      });

      const curMin = _.min(filteredData.map((el) => el.low));
      const curMax = _.max(filteredData.map((el) => el.high));
      const yMin = curMin * (1 - Y_SCALE_RATIO);
      const yMax = curMax * (1 + Y_SCALE_RATIO);

      yAxisArr.push({
        gridIndex: index,
        type: "value",
        min: yMin,
        max: yMax,
        axisLabel: { show: false }, // 小格子可隐藏y刻度，更干净
        splitLine: { show: false },
      });

      // ====================== 新增：每月1号蓝色背景高亮（底层） ======================
      const bgData = xAxisData.map((date) => {
        if (date.endsWith("-01")) {
          return yMax;
        }
        return null;
      });

      seriesArr.push({
        type: "bar",
        xAxisIndex: index,
        yAxisIndex: index,
        data: bgData,
        barWidth: "100%",
        itemStyle: {
          color: "rgba(30, 144, 255, 0.15)", // 透明蓝色背景（可自行调整透明度）
        },
        z: 1, // 放在蜡烛下层，不覆盖K线
      });
      // ============================================================================

      const 季度List = ["一季度", "二季度", "三季度", "四季度"];

      seriesArr.push({
        name: `${stockCode.value}_${yearStr}_${季度List[col]}`,
        type: "candlestick",
        xAxisIndex: index,
        yAxisIndex: index,
        data: seriesData,
        itemStyle: { borderRadius: 1 },
        barWidth: "100%", // 缩小一点，留出背景边距更好看
        z: 2, // 确保K线在上层
        markLine: {
          symbol: "none",
          label: { show: true },
          lineStyle: {
            color: "rgba(255,0,0,0.6)",
            width: 0.5,
            type: "dashed",
          },
          data: [
            { name: yearStr + dayjs().format("-MM-DD"), xAxis: yearStr + dayjs().format("-MM-DD") },
            { name: yearStr + dayjs().format("-MM-DD"), xAxis: yearStr + dayjs().format("-MM-DD") },
          ],
        },
      });

      graphicArr.push({
        type: "text",
        left: `${graphicLeft}%`,
        top: `${graphicTop}%`,
        style: {
          text: `${stockCode.value}  ${yearStr}年${季度List[col]}`,
          fontSize: isMobile ? 18 : 40,
          fontWeight: "bold",
          fill: "rgba(233,233,233,0.2)",
          textAlign: "left",
        },
        responsive: true,
      });
    }
  }

  return {
    graphic: graphicArr,
    title: { left: "center", top: 10 },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
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
</script>
<style scoped></style>
