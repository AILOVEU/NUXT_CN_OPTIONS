<template>
  <div class="max-md:w-[100%]">
    <div>
      <Nav />
      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>
    <VChart :option="options" style="height: 2400px; width: 2400px; margin: auto" />
  </div>
</template>

<script setup>
import { get_http_data } from "~/utils/options";
import { OPTIONS_MAP } from "~/data";
import { useGlobal } from "~/stores/useGlobal.js";
import _ from "lodash";
const { setGlobalLoading, isMobile } = useGlobal();

const vixsData = ref([{}]);

const options = ref({});
const LENG = 10;
const BEND = 2025;
function getFilterVixsData(index) {
  let yearMonthList = [];
  for (let i = BEND - LENG + 1; i <= BEND; i++) {
    for (let j = 1; j <= 12; j++) {
      yearMonthList.push(`${i}/${j}/`);
    }
  }
  yearMonthList = _.reverse(yearMonthList);
  console.log("yearMonthList", yearMonthList);
  return vixsData.value?.filter((el) => el.date.startsWith(yearMonthList[index]));
}

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
  return [...ops, { value: "all", label: "全" }];
});
const stockCode = ref(stockCodeOptions.value[0].value);

async function handleQuery() {
  vixsData.value = await $fetch("/api/queryVixsDataJson", {
    method: "post",
    body: {
      codeList: [stockCode.value],
    },
  });
  vixsData.value = vixsData.value.filter((el) => el.code === stockCode.value);
  options.value = {
    xAxis: {
      data: vixsData.value.map((el) => el.date),
    },
    yAxis: {},
    series: [
      {
        type: "candlestick",
        data: vixsData.value.map((el) => [el.open, el.close, el.low, el.high]),
      },
    ],
  };

  // 配置基础参数
  const rowNum = LENG; // 行数
  const colNum = 12; // 列数
  const gap = 1; // 网格间距（百分比）
  const padding = 2; // 整体内边距（百分比）

  // 动态生成5×12的grid数组
  const gridArr = [];
  // 动态生成x轴数组
  const xAxisArr = [];
  // 动态生成y轴数组
  const yAxisArr = [];
  // 动态生成series数组（60个柱状图）
  const seriesArr = [];

  // 计算每个网格的宽度和高度（扣除间距和内边距）
  const gridWidth = (100 - 2 * padding - (colNum - 1) * gap) / colNum;
  const gridHeight = (100 - 2 * padding - (rowNum - 1) * gap) / rowNum;

  // 循环生成每行每列的配置
  let index = 0; // 全局索引（0-59，对应60个图表）
  for (let row = 0; row < rowNum; row++) {
    for (let col = 0; col < colNum; col++) {
      // 1. 计算当前grid的位置
      const left = padding + col * (gridWidth + gap);
      const top = padding + row * (gridHeight + gap);
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
        data: getFilterVixsData(index).map((el) => el.date), // 每个小柱状图的x轴分类
        // axisLabel: { fontSize: 8 }, // 缩小标签字体适配小网格
        // axisLine: { lineStyle: { width: 0.5 } }, // 细化轴线
      });

      // 3. 生成当前grid对应的y轴
      yAxisArr.push({
        gridIndex: index,
        type: "value",
        // min: 1, // Y轴最小值固定为0
        // max: 3.2, // Y轴最大值固定为100
        // axisLabel: { fontSize: 8 },
        // axisLine: { lineStyle: { width: 0.5 } },
        // splitLine: { lineStyle: { width: 0.5, color: "#eee" } }, // 细化分割线
      });

      // 4. 生成当前grid对应的柱状图series（随机模拟数据）
      seriesArr.push({
        name: `图表${index + 1}`,
        type: "candlestick",
        xAxisIndex: index,
        yAxisIndex: index,
        data: getFilterVixsData(index).map((el) => [el.open, el.close, el.low, el.high]),
        itemStyle: { borderRadius: 1 }, // 小圆角适配小柱状图
        barWidth: "60%", // 柱状图宽度占网格x轴的60%
      });

      index++;
    }
  }

  options.value = {
    title: {
      text: stockCode.value,
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
