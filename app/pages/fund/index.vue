<template>
  <div class="max-md:w-[100%]">
    <div>
      <Nav />
      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>
    <VChart :option="options" ref="echartRef" :style="{ height: rowNum * 300 + 'px', width: '2400px', margin: 'auto' }" />
  </div>
</template>

<script setup>
import { get_http_data } from "~/utils/options";
import { OPTIONS_MAP } from "~/data";
import dayjs from "dayjs";
import { useGlobal } from "~/stores/useGlobal.js";
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
const LENG = 10;
const BEND = 2025;
function getFilterFundData(index) {
  const yearMonthList = [];
  for (let i = BEND; i >= BEND - LENG + 1; i--) {
    for (let j = 1; j <= 12; j++) {
      yearMonthList.push(`${i}-${j < 10 ? "0" + j : j}-`);
    }
  }
  return fundData.value?.filter((el) => el.date.startsWith(yearMonthList[index]));
}
const stockCode = ref(stockCodeOptions.value[0].value);

onMounted(async () => {
  handleQuery();
});

async function handleQuery() {
  fundData.value = await $fetch("/api/queryFundDataJson", {
    method: "get",
    params: {
      fundCode: stockCode.value,
    },
  });

  let monthLen = Array.from(new Set(fundData.value.map((el) => dayjs(el["date"], "YYYY-MM-DD").format("YYYY-MM"))))?.length;
  console.log("monthLen", monthLen);
  const colNum = 12; // 列数
  rowNum.value = Math.floor(monthLen / colNum) + 1; // 行数
  setTimeout(() => {
    echartRef.value.resize();
  });
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
  const gridHeight = (100 - 2 * padding - (rowNum.value - 1) * gap) / rowNum.value;

  for (let row = 0; row < rowNum.value; row++) {
    for (let col = 0; col < colNum; col++) {
      let index = row * colNum + col;
      if (index + 1 > fundData.value.length) continue;
      const filterFundData = getFilterFundData(index);
      // console.log("filterFundData", filterFundData);
      const xAxisData = filterFundData.map((el) => el.date);
      const seriesData = filterFundData.map((el) => [el.open, el.close, el.low, el.high]);
      const left = padding + col * (gridWidth + gap);
      const top = padding + row * (gridHeight + gap);
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

      yAxisArr.push({
        gridIndex: index,
        type: "value",
        // min: 1, // Y轴最小值固定为0
        // max: 3.2, // Y轴最大值固定为100
      });

      seriesArr.push({
        name: `图表${index + 1}`,
        type: "candlestick",
        xAxisIndex: index,
        yAxisIndex: index,
        data: seriesData,
        itemStyle: { borderRadius: 1 }, // 小圆角适配小柱状图
        barWidth: "60%", // 柱状图宽度占网格x轴的60%
      });
    }
  }

  options.value = {
    title: {
      text: stockCode.value,
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
