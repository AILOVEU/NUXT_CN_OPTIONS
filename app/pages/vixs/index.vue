<template>
  <div class="max-md:w-[300%]">
    <div>
      <Nav />
      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>
    <div class="w-full overflow-auto h-[calc(100vh-100px)] max-md:h-[calc(300vh-100px)]">
      <VChart :option="options" ref="echartRef" :style="{ height: rowNum * 25 + 'vh', width: isMobile ? '300vw' : '200vw', margin: 'auto' }" />
    </div>
  </div>
</template>

<script setup>
import { get_http_data } from "~/utils/options";
import { OPTIONS_MAP } from "~/data";
import { useGlobal } from "~/stores/useGlobal.js";
import _ from "lodash";
import dayjs from "dayjs";
import { getFourthWednesdayOfMonth, getDatesBetween, resizeFontSize } from "~/utils/utils";
const { setGlobalLoading, isMobile } = useGlobal();
const vixsData = ref([{}]);
const echartRef = ref();
const options = ref({});
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
const highlightDates = [
  "2010-01-27",
  "2010-02-24",
  "2010-03-24",
  "2010-04-28",
  "2010-05-26",
  "2010-06-23",
  "2010-07-28",
  "2010-08-25",
  "2010-09-22",
  "2010-10-27",
  "2010-11-24",
  "2010-12-22",
  "2011-01-26",
  "2011-02-23",
  "2011-03-23",
  "2011-04-27",
  "2011-05-25",
  "2011-06-22",
  "2011-07-27",
  "2011-08-24",
  "2011-09-28",
  "2011-10-26",
  "2011-11-23",
  "2011-12-28",
  "2012-01-25",
  "2012-02-22",
  "2012-03-28",
  "2012-04-25",
  "2012-05-23",
  "2012-06-27",
  "2012-07-25",
  "2012-08-22",
  "2012-09-26",
  "2012-10-24",
  "2012-11-28",
  "2012-12-26",
  "2013-01-23",
  "2013-02-27",
  "2013-03-27",
  "2013-04-24",
  "2013-05-22",
  "2013-06-26",
  "2013-07-24",
  "2013-08-28",
  "2013-09-25",
  "2013-10-23",
  "2013-11-27",
  "2013-12-25",
  "2014-01-22",
  "2014-02-26",
  "2014-03-26",
  "2014-04-23",
  "2014-05-28",
  "2014-06-25",
  "2014-07-23",
  "2014-08-27",
  "2014-09-24",
  "2014-10-22",
  "2014-11-26",
  "2014-12-24",
  "2015-01-28",
  "2015-02-25",
  "2015-03-25",
  "2015-04-22",
  "2015-05-27",
  "2015-06-24",
  "2015-07-22",
  "2015-08-26",
  "2015-09-23",
  "2015-10-28",
  "2015-11-25",
  "2015-12-23",
  "2016-01-27",
  "2016-02-24",
  "2016-03-23",
  "2016-04-27",
  "2016-05-25",
  "2016-06-22",
  "2016-07-27",
  "2016-08-24",
  "2016-09-28",
  "2016-10-26",
  "2016-11-23",
  "2016-12-28",
  "2017-01-25",
  "2017-02-22",
  "2017-03-22",
  "2017-04-26",
  "2017-05-24",
  "2017-06-28",
  "2017-07-26",
  "2017-08-23",
  "2017-09-27",
  "2017-10-25",
  "2017-11-22",
  "2017-12-27",
  "2018-01-24",
  "2018-02-28",
  "2018-03-28",
  "2018-04-25",
  "2018-05-23",
  "2018-06-27",
  "2018-07-25",
  "2018-08-22",
  "2018-09-26",
  "2018-10-24",
  "2018-11-28",
  "2018-12-26",
  "2019-01-23",
  "2019-02-27",
  "2019-03-27",
  "2019-04-24",
  "2019-05-22",
  "2019-06-26",
  "2019-07-24",
  "2019-08-28",
  "2019-09-25",
  "2019-10-23",
  "2019-11-27",
  "2019-12-25",
  "2020-01-22",
  "2020-02-26",
  "2020-03-25",
  "2020-04-22",
  "2020-05-27",
  "2020-06-24",
  "2020-07-22",
  "2020-08-26",
  "2020-09-23",
  "2020-10-28",
  "2020-11-25",
  "2020-12-23",
  "2021-01-27",
  "2021-02-24",
  "2021-03-24",
  "2021-04-28",
  "2021-05-26",
  "2021-06-23",
  "2021-07-28",
  "2021-08-25",
  "2021-09-22",
  "2021-10-27",
  "2021-11-24",
  "2021-12-22",
  "2022-01-26",
  "2022-02-23",
  "2022-03-23",
  "2022-04-27",
  "2022-05-25",
  "2022-06-22",
  "2022-07-27",
  "2022-08-24",
  "2022-09-28",
  "2022-10-26",
  "2022-11-23",
  "2022-12-28",
  "2023-01-25",
  "2023-02-22",
  "2023-03-22",
  "2023-04-26",
  "2023-05-24",
  "2023-06-28",
  "2023-07-26",
  "2023-08-23",
  "2023-09-27",
  "2023-10-25",
  "2023-11-22",
  "2023-12-27",
  "2024-01-24",
  "2024-02-28",
  "2024-03-27",
  "2024-04-24",
  "2024-05-22",
  "2024-06-26",
  "2024-07-24",
  "2024-08-28",
  "2024-09-25",
  "2024-10-23",
  "2024-11-27",
  "2024-12-25",
  "2025-01-22",
  "2025-02-26",
  "2025-03-26",
  "2025-04-23",
  "2025-05-28",
  "2025-06-25",
  "2025-07-23",
  "2025-08-27",
  "2025-09-24",
  "2025-10-22",
  "2025-11-26",
  "2025-12-24",
];
async function handleQuery() {
  vixsData.value = await $fetch("/api/queryVixsDataJson", {
    method: "post",
    body: {
      codeList: [stockCode.value],
    },
  });
  vixsData.value = vixsData.value.filter((el) => el.code === stockCode.value);

  let monthLen = Array.from(new Set(vixsData.value.map((el) => dayjs(el["date"], "YYYY-MM-DD").format("YYYY-MM"))))?.length;
  // 配置基础参数
  const colNum = 4; // 列数
  rowNum.value = Math.floor(monthLen / 3 / colNum) + 1; // 行数
  setTimeout(() => {
    echartRef.value.resize();
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
  // 循环生成每行每列的配置
  for (let row = 0; row < rowNum.value; row++) {
    for (let col = 0; col < colNum; col++) {
      let index = row * colNum + col;
      if (row * colNum * 3 + col + 1 > vixsData.value.length) continue;
      const left = padding + col * (gridWidth + gap);
      const top = padding + row * (gridHeight + gap);
      const graphicLeft = left + gridWidth / 4;
      const graphicTop = top + gridHeight / 3;

      const yearStr = BEND - row;
      const monthVal = col * 3 + 1;
      function getZeroNumber(month) {
        return month < 10 ? "0" + month : month;
      }
      const curYearMonthStrList = [`${yearStr}-${getZeroNumber(monthVal)}-`, `${yearStr}-${getZeroNumber(monthVal + 1)}-`, `${yearStr}-${getZeroNumber(monthVal + 2)}-`];
      // 获取当月日期列表
      const curYearMonthDayList = getDatesBetween(dayjs(curYearMonthStrList[0], "YYYY-MM-").startOf("month").format("YYYY-MM-DD"), dayjs(curYearMonthStrList[2], "YYYY-MM-").endOf("month").format("YYYY-MM-DD"));
      let filteredData = vixsData.value?.filter((el) => curYearMonthStrList.some((curYearMonthStr) => el.date.startsWith(curYearMonthStr))); // 获取20xx年xx月的数据
      filteredData = curYearMonthDayList.map((date) => filteredData.find((item) => item.date === date) || { date }); // 构建完整日期数据
      // 获取当月第第四个周三
      const monthFourthWednesdayList = curYearMonthStrList.map((curYearMonthStr) => getFourthWednesdayOfMonth(curYearMonthStr + "01"));
      // const curMonthFourthWednesday = getFourthWednesdayOfMonth(curYearMonthStr + "01");
      const xAxisData = filteredData.map((el) => el.date);
      const seriesData = filteredData.map((el) => [el.open, el.close, el.low, el.high]);
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
      });

      // 3. 生成当前grid对应的y轴
      yAxisArr.push({
        gridIndex: index,
        type: "value",
        interval: 10,

        min: 0,
        max: 100,
      });
      const 季度List = ["一季度", "二季度", "三季度", "四季度"];

      // 4. 生成当前grid对应的柱状图series（随机模拟数据）
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
          label: {
            show: false,
          },
          // 标记线整体样式
          lineStyle: {
            color: "rgba(255,0,0,0.4)", // 红色高亮
            width: 0.5, // 线宽
            type: "dashed", // 实线
          },
          // 标记线数据：定位到2024-05-09的垂直标记线
          data: monthFourthWednesdayList.map((curMonthFourthWednesday) => ({
            name: curMonthFourthWednesday,
            xAxis: curMonthFourthWednesday,
          })),
        },
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
          text: `${stockCode.value}  ${yearStr}${季度List[col]}`, // grid 标题内容
          fontSize: isMobile ? 10 : 40, // 字体大小
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
    graphic: graphicArr,
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
}
handleQuery();
</script>
<style scoped></style>
