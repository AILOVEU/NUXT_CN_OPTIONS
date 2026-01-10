<template>
  <div class="max-md:w-[300%]">
    <div>
      <Nav />
      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>
    <div class="w-full overflow-auto h-[calc(100vh-100px)] max-md:h-[calc(300vh-100px)]">
      <VChart :option="options" ref="echartRef" :style="{ height: rowNum * (isMobile ? 20 : 30) + 'vh', width: isMobile ? '300vw' : '200vw', margin: 'auto' }" />
    </div>
  </div>
</template>

<script setup>
import { get_http_data } from "~/utils/options";
import { OPTIONS_MAP } from "~/data";
import dayjs from "dayjs";
import { useGlobal } from "~/stores/useGlobal.js";
import { getFourthWednesdayOfMonth, getDatesBetween, resizeFontSize, getMinPointFiveMultiple, getMaxPointFiveMultipleLessThan } from "~/utils/utils";
const { setGlobalLoading, isMobile } = useGlobal();
const stockCodeOptions = computed(() => {
  let ops = OPTIONS_MAP.map((el) => ({
    value: el.code,
    label: el.showName,
  }));
  return [...ops, { value: "all", label: "全" }];
});
const fundData = ref([{}]);
const echartRef = ref();
const options = ref({});
const rowNum = ref(1);
const BEND = 2025;
const stockCode = ref(stockCodeOptions.value[0].value);

onMounted(async () => {
  handleQuery();
});

function getMax(list) {
  if (!Array.isArray(list)) return 0;
  let max = list[0]?.high || 0;
  list.forEach((el) => {
    if (el.high > max) {
      max = el.high;
    }
  });
  return max;
}
function getMin(list) {
  if (!Array.isArray(list)) return 0;
  let min = list[0]?.low || 0;
  list.forEach((el) => {
    if (el.low < min) {
      min = el.low;
    }
  });
  return isNaN(min) ? 0 : min;
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

  let monthLen = Array.from(new Set(fundData.value.map((el) => dayjs(el["date"], "YYYY-MM-DD").format("YYYY-MM"))))?.length;
  console.log("monthLen", monthLen);
  const colNum = 4; // 列数
  rowNum.value = Math.floor(monthLen / 3 / colNum) + 1; // 行数
  setTimeout(() => {
    echartRef.value?.resize();
  });
  const gap = 1; // 网格间距（百分比）
  const padding = 0.5; // 整体内边距（百分比）

  // 动态生成5×12的grid数组
  const gridArr = [];
  // 动态生成x轴数组
  const xAxisArr = [];
  // 动态生成y轴数组
  const yAxisArr = [];
  // 动态生成series数组（60个柱状图）
  const seriesArr = [];

  const graphicArr = [];
  // 计算每个网格的宽度和高度（扣除间距和内边距）
  const gridWidth = (100 - 2 * padding - (colNum - 1) * gap) / colNum;
  const gridHeight = (100 - 2 * padding - (rowNum.value - 1) * gap) / rowNum.value;

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
      // 获取当月日期列表
      const curYearMonthDayList = getDatesBetween(dayjs(curYearMonthStrList[0], "YYYY-MM-").startOf("month").format("YYYY-MM-DD"), dayjs(curYearMonthStrList[2], "YYYY-MM-").endOf("month").format("YYYY-MM-DD"));
      const curYearFilteredData = fundData.value?.filter((el) => el.date.startsWith(yearStr + "-"));
      console.log(index, curYearFilteredData);
      let filteredData = fundData.value?.filter((el) => curYearMonthStrList.some((curYearMonthStr) => el.date.startsWith(curYearMonthStr))); // 获取20xx年xx月的数据
      filteredData = curYearMonthDayList.map((date) => filteredData.find((item) => item.date === date) || { date }); // 构建完整日期数据
      // console.log("filterFundData", filterFundData);
      const xAxisData = filteredData.map((el) => el.date);
      const seriesData = filteredData.map((el) => [el.open, el.close, el.low, el.high]);
      const left = padding + col * (gridWidth + gap);
      const top = padding + row * (gridHeight + gap);

      const graphicLeft = left + gridWidth / 4;
      const graphicTop = top + gridHeight / 2;
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
      });
      console.log(index, "max", getMax(curYearFilteredData));
      console.log(index, "min", getMin(curYearFilteredData));

      yAxisArr.push({
        gridIndex: index,
        type: "value",
        interval: 0.5,
        min: getMaxPointFiveMultipleLessThan(getMin(curYearFilteredData)), // Y轴最小值固定为0
        max: getMinPointFiveMultiple(getMax(curYearFilteredData)), // Y轴最大值固定为100
      });
      const 季度List = ["一季度", "二季度", "三季度", "四季度"];
      seriesArr.push({
        name: `${stockCode.value}_${yearStr}_${季度List[col]}`,
        type: "candlestick",
        xAxisIndex: index,
        yAxisIndex: index,
        data: seriesData,
        itemStyle: { borderRadius: 1 }, // 小圆角适配小柱状图
        barWidth: "100%", // 柱状图宽度占网格x轴的60%
      });

      graphicArr.push({
        type: "text", // 元素类型：文本
        // 定位：绑定 grid 区域（关键，实现精准对齐）
        left: `${graphicLeft}%`,
        top: `${graphicTop}%`,
        // width: `${gridWidth}%`,
        // height: `${gridHeight}%`,
        // 文本样式配置
        style: {
          text: `${stockCode.value}  ${yearStr}年${季度List[col]}`, // grid 标题内容
          fontSize: isMobile ? 18 : 40, // 字体大小
          fontWeight: "bold", // 字体加粗
          fill: "rgba('233,233,233,0.1')", // 字体颜色
          textAlign: "left", // 文本对齐方式（与 left 配合）
        },
        // 可选：响应式配置（窗口 resize 时自动调整）
        responsive: true,
      });
    }
  }

  options.value = {
    // 2. 核心：graphic 组件配置 grid 专属标题
    graphic: graphicArr,
    title: {
      // text: stockCode.value,
      left: "center",
      top: 10,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    grid: gridArr,
    xAxis: xAxisArr,
    yAxis: yAxisArr,
    series: seriesArr,
  };
}

function handleStockCodeChange() {
  // tableRef.value.setScrollTop(0);
  setTimeout(() => {
    handleQuery();
  });
}
</script>
<style scoped></style>
