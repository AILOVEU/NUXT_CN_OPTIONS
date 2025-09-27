<template>
  <VChart :option="option" style="height: 900px; width: 100vw" />
</template>
<script setup>
import { UNIT } from "~/data";

const props = defineProps(["all_data"]);
const option = computed(() => {
  if (!props.all_data?.length) return {};
  const stockCodeList = Array.from(
    new Set(props.all_data.map((el) => el["正股代码"]))
  );
  const dataList = stockCodeList.map((code) => {
    let codeOptions = props.all_data.filter((el) => el["正股代码"] === code);
    return codeOptions.map((el) => [el["到期天数"], el["隐波"], el]);
  });
  return {
    title: {
      text: "全部期权信息",
    },
    legend: {
      data: stockCodeList,
      bottom: "0",
    },
    xAxis: {
      splitLine: {
        lineStyle: {
          type: "dashed",
        },
      },
    },
    yAxis: {
      // type: 'log',
      splitLine: {
        lineStyle: {
          type: "dashed",
        },
      },
      scale: true,
    },
    series: dataList.map((el) => ({
      name: el[0][2]["正股代码"],
      data: el,
      type: "scatter",
      symbolSize: function (el) {
        let data = el[2];
        return Math.sqrt((data["Delta"] / data["最新价"]) * 40000) / 16;
      },
      emphasis: {
        focus: "series",
        label: {
          show: true,
          formatter: function (param) {
            const data = param.data[2];
            return `${data["正股代码"]} 价：${Math.floor(
              data["最新价"] * UNIT
            )} \n 隐波:${data["隐波"]}\nDelta: ${data["Delta"]}`;
          },
          position: "top",
        },
      },
    })),
  };
});
</script>
