<template>
  <div class="grid grid-cols-2 max-md:grid-cols-1">
    <VChart
      :option="deltaOption"
      style="height: 300px; width: 100%; margin: auto"
    />
    <VChart
      :option="代替正股Option"
      style="height: 300px; width: 100%; margin: auto"
    />
    <VChart
      :option="gammaOption"
      style="height: 300px; width: 100%; margin: auto"
    />
    <VChart
      :option="单日损耗Option"
      style="height: 300px; width: 100%; margin: auto"
    />
  </div>
</template>
<script setup>
import {
  UNIT,
  stock_code_map,
  deadline_list,
  stock_color_map,
  stock_sorted_list,
} from "~/data";
import dayjs from "dayjs";
import _ from "lodash";
const 到期天数List = deadline_list.map(
  (date) => dayjs(date, "YYYYMMDD").diff(dayjs(), "days") + 1
);
const props = defineProps(["all_data"]);
function getBarOps({ stockCodeList, name, dataList }) {
  return {
    backgroundColor: "#fefefe",
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        crossStyle: {
          color: "#999",
        },
      },
    },
    xAxis: [
      {
        type: "category",
        data: stockCodeList.map((code) => stock_code_map[code]),
        axisPointer: {
          type: "shadow",
        },
        axisLabel: {
          rotate: 61, // 旋转角度
        },
      },
    ],
    yAxis: [
      {
        name,
      },
    ],
    series: {
      type: "bar",
      name,
      data: dataList,
    },
  };
}
const deltaOption = computed(() => {
  let all_data = props.all_data.filter((el) => el["持仓"]);
  if (!all_data?.length) return {};
  const stockCodeList = stock_sorted_list.filter((el) =>
    Array.from(new Set(all_data.map((el) => el["正股代码"]))).includes(el)
  );
  const dataList = stockCodeList.map((code) => {
    let codeOptions = all_data.filter((el) => el["正股代码"] === code);
    return get_list_all_delta(codeOptions);
  });
  return getBarOps({
    stockCodeList,
    name: "Delta",
    dataList,
  });
});

const 代替正股Option = computed(() => {
  let all_data = props.all_data.filter((el) => el["持仓"]);
  if (!all_data?.length) return {};
  const stockCodeList = stock_sorted_list.filter((el) =>
    Array.from(new Set(all_data.map((el) => el["正股代码"]))).includes(el)
  );
  const dataList = stockCodeList.map((code) => {
    let codeOptions = all_data.filter((el) => el["正股代码"] === code);
    return get_list_all_代替正股(codeOptions);
  });
  return getBarOps({
    stockCodeList,
    name: "代替正股",
    dataList,
  });
});

const gammaOption = computed(() => {
  let all_data = props.all_data.filter((el) => el["持仓"]);
  if (!all_data?.length) return {};
  const stockCodeList = stock_sorted_list.filter((el) =>
    Array.from(new Set(all_data.map((el) => el["正股代码"]))).includes(el)
  );
  const dataList = stockCodeList.map((code) => {
    let codeOptions = all_data.filter((el) => el["正股代码"] === code);
    return get_list_all_gamma(codeOptions);
  });
  return getBarOps({
    stockCodeList,
    name: "Gamma",
    dataList,
  });
});

const 单日损耗Option = computed(() => {
  let all_data = props.all_data.filter((el) => el["持仓"]);
  if (!all_data?.length) return {};
  const stockCodeList = stock_sorted_list.filter((el) =>
    Array.from(new Set(all_data.map((el) => el["正股代码"]))).includes(el)
  );
  const dataList = stockCodeList.map((code) => {
    let codeOptions = all_data.filter((el) => el["正股代码"] === code);
    return get_list_all_单日损耗(codeOptions);
  });
  return getBarOps({
    stockCodeList,
    name: "单日损耗",
    dataList,
  });
});

function get_list_all_delta(list) {
  let sum = 0;
  list.forEach((el) => {
    sum += el["持仓"] * el["Delta"];
  });
  return Math.floor(sum * 100) / 100;
}
function get_list_all_代替正股(list) {
  let sum = 0;
  list.forEach((el) => {
    sum += el["持仓"] * el["Delta"] * el["正股价格"] * UNIT;
  });
  return Math.floor(sum);
}
function get_list_all_gamma(list) {
  let sum = 0;
  list.forEach((el) => {
    let Gamma = el["Gamma"];
    if (el["沽购"] === "沽") Gamma = -Gamma;
    sum += el["持仓"] * Gamma;
  });
  return Math.floor(sum * 100) / 100;
}
function get_list_all_单日损耗(list) {
  let sum = 0;
  list.forEach((el) => {
    sum += el["持仓"] * el["单日损耗"];
  });
  return Math.floor(sum * 100) / 100;
}
</script>
