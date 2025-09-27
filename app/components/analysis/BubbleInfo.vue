<template>
  <VChart :option="option" style="height: 900px; width: 100vw" />
</template>
<script setup>
import { UNIT, stock_code_map } from "~/data";

const props = defineProps(["all_data"]);
const option = computed(() => {
  let all_data = props.all_data;
  if (!all_data?.length) return {};
  all_data = all_data.filter((el) => el["隐波"]).filter(el=> el['隐波'] < 35);
  const stockCodeList = Array.from(
    new Set(all_data.map((el) => el["正股代码"]))
  );
  const dataList = stockCodeList.map((code) => {
    let codeOptions = all_data.filter((el) => el["正股代码"] === code);
    return codeOptions.map((el) => {
      const isCall = el["期权名称"].includes("购");
      const 到期天数 = isCall ? el["到期天数"] : -el["到期天数"];
      return [到期天数, el["隐波"], { ...el, 到期天数 }];
    });
  });
  return {
    title: {
      text: "全部期权信息",
    },
    legend: {
      data: stockCodeList.map((el) => stock_code_map[el]),
      bottom: "0",
    },
    xAxis: {
      // type: 'category',
      splitLine: {
        lineStyle: {
          type: "dashed",
        },
      },
    },
    yAxis: {
      // type: "log",
      splitLine: {
        lineStyle: {
          type: "dashed",
        },
      },
      scale: true,
    },
    series: dataList.map((el) => ({
      name: stock_code_map[el[0][2]["正股代码"]],
      data: el,
      type: "scatter",
      symbolSize: function (el) {
        let data = el[2];
        const value = Math.abs(data["Delta"]) / data["最新价"];
        return Math.sqrt(value * value * 5000) / 16;
      },
      emphasis: {
        focus: "series",
        label: {
          show: true,
          formatter: function (param) {
            const data = param.data[2];
            return `${data['期权名称']}  价：${Math.floor(
              data["最新价"] * UNIT
            )} \n 隐波:${data["隐波"]}  Delta: ${data["Delta"]}`;
          },
          position: "top",
        },
      },
    })),
  };
});
</script>
