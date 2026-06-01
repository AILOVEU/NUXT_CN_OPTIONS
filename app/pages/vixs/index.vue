<template>
  <div class="max-md:w-[300%]">
    <div>
      <Nav />
      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>
    <div class="w-full overflow-auto h-[30vh] max-md:h-[90vh]">
      <VChart :option="总览options" ref="echartRef" :style="{ height: isMobile ? '90vh' : '30vh', width: isMobile ? '300vw' : '100vw', margin: 'auto' }" />
    </div>
    <div class="w-full overflow-auto h-[calc(100vh-100px)] max-md:h-[calc(210vh-100px)]">
      <VChart :option="options" ref="echartRef" :style="{ height: rowNum * (isMobile ? 60 : 45) + 'vh', width: isMobile ? '150vw' : '100vw', margin: 'auto' }" />
    </div>
  </div>
</template>

<script setup>
import { get_http_data } from "~/utils/options";
import { OPTIONS_MAP } from "~/data";
import { useGlobal } from "~/stores/useGlobal.js";
import _ from "lodash";
import dayjs from "dayjs";
import { getFourWednesdayOfMonth, getDatesBetween, resizeFontSize, getMoreThanTen, getLessThanTen, getFourWednesdayInRange } from "~/utils/utils";
const { setGlobalLoading, isMobile } = useGlobal();
const vixsData = ref([]);
const echartRef = ref();
const BEND = 2025;
const rowNum = ref(1);

function handleStockCodeChange() {
  // tableRef.value.setScrollTop(0);
  setTimeout(() => {
    handleQuery();
  });
}

const stockCodeOptions = computed(() => {
  let ops = OPTIONS_MAP.map((el) => ({
    value: el.code,
    label: el.showName,
  }));
  return [
    ...ops,
    // { value: "all", label: "全" }
  ];
});
const stockCode = ref(stockCodeOptions.value[0].value);
const highlightDates = getFourWednesdayInRange("2000-01-01", "2025-12-31");
function getMin(list) {
  let min = list[0]?.low || 0;
  list.forEach((el) => {
    if (el.low < min) {
      min = el.low;
    }
  });
  return isNaN(min) ? 0 : min;
}
function getMax(list) {
  let max = list[0]?.high || 0;
  list.forEach((el) => {
    if (el.high > max) {
      max = el.high;
    }
  });
  return max;
}
let loading = ref(false);
async function handleQuery() {
  loading.value = true;
  vixsData.value = await $fetch("/api/queryVixsDataJson", {
    method: "post",
    body: {
      codeList: [stockCode.value],
    },
  });
  loading.value = false;
  vixsData.value = vixsData.value.filter((el) => el.code === stockCode.value).filter((el) => el.date);
}
const options = computed(() => {
  if (!vixsData.value.length) return {};
  let monthLen = Array.from(new Set(vixsData.value.map((el) => dayjs(el["date"], "YYYY-MM-DD").format("YYYY-MM"))))?.length;
  // 配置基础参数
  const colNum = 1; // 列数
  rowNum.value = Math.floor(monthLen / 12) + 1; // 行数
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
  // 关键：给每个网格预留上下边距比例，统一留白比例
  const Y_SCALE_RATIO = 0.01; // 上下各留8%留白，可微调 0.05~0.15

  // 循环生成每行每列的配置
  for (let row = 0; row < rowNum.value; row++) {
    for (let col = 0; col < colNum; col++) {
      let index = row * colNum + col;
      if (row * 12 + col + 1 > vixsData.value.length) continue;
      const yearStr = BEND - row;
      const monthVal = col * 12 + 1;
      function getZeroNumber(month) {
        return month < 10 ? "0" + month : month;
      }
      const curYearMonthStrList = [
        `${yearStr}-${getZeroNumber(monthVal)}-`,
        `${yearStr}-${getZeroNumber(monthVal + 1)}-`,
        `${yearStr}-${getZeroNumber(monthVal + 2)}-`,
        `${yearStr}-${getZeroNumber(monthVal + 3)}-`,
        `${yearStr}-${getZeroNumber(monthVal + 4)}-`,
        `${yearStr}-${getZeroNumber(monthVal + 5)}-`,
        `${yearStr}-${getZeroNumber(monthVal + 6)}-`,
        `${yearStr}-${getZeroNumber(monthVal + 7)}-`,
        `${yearStr}-${getZeroNumber(monthVal + 8)}-`,
        `${yearStr}-${getZeroNumber(monthVal + 9)}-`,
        `${yearStr}-${getZeroNumber(monthVal + 10)}-`,
        `${yearStr}-${getZeroNumber(monthVal + 11)}-`,
      ];
      // 获取当月日期列表
      const curYearMonthDayList = getDatesBetween(
        dayjs(curYearMonthStrList[0], "YYYY-MM-").startOf("month").format("YYYY-MM-DD"),
        dayjs(curYearMonthStrList[curYearMonthStrList.length - 1], "YYYY-MM-")
          .endOf("month")
          .format("YYYY-MM-DD")
      );
      const curYearFilteredData = vixsData.value?.filter((el) => el.date.startsWith(yearStr + "-")); // 获取20xx年xx月的数据
      let filteredData = vixsData.value?.filter((el) => curYearMonthStrList.some((curYearMonthStr) => el.date.startsWith(curYearMonthStr))); // 获取20xx年xx月的数据
      filteredData = curYearMonthDayList.map((date) => filteredData.find((item) => item.date === date) || { date }); // 构建完整日期数据
      // 获取当月第第四个周三
      const monthFourthWednesdayList = curYearMonthStrList.map((curYearMonthStr) => getFourWednesdayOfMonth(curYearMonthStr + "01"));
      // const curMonthFourthWednesday = getFourWednesdayOfMonth(curYearMonthStr + "01");
      const xAxisData = filteredData.map((el) => el.date);
      const seriesData = filteredData.map((el) => [el.open, el.close, el.low, el.high]);

      const left = padding + col * (gridWidth + gap);
      const top = padding + row * (gridHeight + gap);
      const curMin = _.min(filteredData.map((el) => el.low));
      const curMax = _.max(filteredData.map((el) => el.high));
      const yMin = curMin * (1 - Y_SCALE_RATIO);
      const yMax = curMax * (1 + Y_SCALE_RATIO);

      gridArr.push({
        left: `${left}%`,
        top: `${top}%`,
        width: `${gridWidth}%`,
        height: `${gridHeight}%`,
        containLabel: true, // 确保坐标轴标签不超出grid
      });
      // 2. 生成当前grid对应的x轴（简单分类数据）
      xAxisArr.push({
        gridIndex: index,
        type: "category",
        data: xAxisData, // 每个小柱状图的x轴分类
        axisLabel: {
          rotate: 45,
          fontSize: 16,
          interval: 0, // 强制显示所有标签（核心）
          // 核心：只显示 -01 结尾的日期
          formatter: (value) => {
            return value.endsWith("-01") ? value : "";
          },
        },
      });
      // 3. 生成当前grid对应的y轴
      yAxisArr.push({
        gridIndex: index,
        type: "value",
        // interval: 10,
        axisLabel: { show: false }, // 小格子可隐藏y刻度，更干净
        splitLine: { show: false },
        min: getLessThanTen(getMin(curYearFilteredData)),
        max: getMoreThanTen(getMax(curYearFilteredData)),
      });

      // ====================== 新增：每月1号蓝色背景高亮（底层） ======================
      const bgData = xAxisData.map((date) => {
        if (date.endsWith("-01")) {
          return yMax;
        }
        return null;
      });

      // 4. 生成当前grid对应的柱状图series（随机模拟数据）
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
        markLine: {
          symbol: "none",
          label: {
            show: false,
          },
          // 标记线整体样式
          lineStyle: {
            color: "rgba(254, 217, 131,0.6)", // 红色高亮
            width: 1, // 线宽
            type: "solid", // 实线
          },
          // 标记线数据：定位到2024-05-09的垂直标记线
          data: [
            // {
            //   name: yearStr + "-03-04",
            //   xAxis: yearStr + "-03-04",
            // },
            // {
            //   name: yearStr + "-03-14",
            //   xAxis: yearStr + "-03-14",
            // },
            ...monthFourthWednesdayList.map((curMonthFourthWednesday) => ({
              name: curMonthFourthWednesday,
              xAxis: curMonthFourthWednesday,
            })),
          ],
        },
      });

      seriesArr.push({
        name: `图表${index + 1}`,
        type: "candlestick",
        xAxisIndex: index,
        yAxisIndex: index,
        data: seriesData,
        itemStyle: { borderRadius: 1 }, // 小圆角适配小柱状图
        barWidth: "100%", // 柱状图宽度占网格x轴的60%
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

      // graphicArr.push({
      //   type: "text", // 元素类型：文本
      //   // 定位：绑定 grid 区域（关键，实现精准对齐）
      //   left: `${graphicLeft}%`,
      //   top: `${graphicTop}%`,
      //   // width: `${gridWidth}%`,
      //   // height: `${gridHeight}%`,
      //   // 文本样式配置
      //   style: {
      //     text: `${stockCode.value}  ${yearStr}年${季度List[col]}`, // grid 标题内容
      //     fontSize: isMobile ? 18 : 40, // 字体大小
      //     fontWeight: "bold", // 字体加粗
      //     fill: "rgba('233,233,233,0.1')", // 字体颜色
      //     textAlign: "left", // 文本对齐方式（与 left 配合）
      //   },
      //   // 可选：响应式配置（窗口 resize 时自动调整）
      //   responsive: true,
      // });
    }
  }

  return {
    // graphic: graphicArr,
    title: {
      // text: stockCode.value,
      left: "center",
      top: 10,
    },
    // 提示框（鼠标悬浮显示数据）
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    grid: gridArr,
    xAxis: xAxisArr,
    yAxis: yAxisArr,
    series: seriesArr,
  };
});
const 总览options = computed(() => {
  return {
    // graphic: graphicArr,
    title: {
      // text: stockCode.value,
      left: "center",
      top: 10,
    },
    // 提示框（鼠标悬浮显示数据）
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    // grid: gridArr,
    xAxis: [
      {
        type: "category",
        data: vixsData.value.map((el) => el.date), // 每个小柱状图的x轴分类
      },
    ],
    yAxis: [
      {
        type: "value",
        interval: 10,
      },
    ],
    series: [
      {
        // name: `图表${index + 1}`,
        type: "candlestick",
        data: vixsData.value.map((el) => [el.open, el.close, el.low, el.high]),
        itemStyle: { borderRadius: 1 }, // 小圆角适配小柱状图
        barWidth: "100%", // 柱状图宽度占网格x轴的60%
        // markLine: {
        //   symbol: "none",
        //   label: {
        //     show: false,
        //   },
        //   // 标记线整体样式
        //   lineStyle: {
        //     color: "rgba(255,0,0,0.6)", // 红色高亮
        //     width: 0.5, // 线宽
        //     type: "dashed", // 实线
        //   },
        //   // 标记线数据：定位到2024-05-09的垂直标记线
        //   data: monthFourthWednesdayList.map((curMonthFourthWednesday) => ({
        //     name: curMonthFourthWednesday,
        //     xAxis: curMonthFourthWednesday,
        //   })),
        // },
      },
    ],
  };
});
handleQuery();
</script>
<style scoped></style>
