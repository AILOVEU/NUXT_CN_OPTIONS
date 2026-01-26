<template>
  <div>
    <el-form :model="formData" label-width="auto" label-suffix=":">
      <el-form-item label="正股">
        <el-select v-model="formData.正股List" multiple>
          <el-option v-for="item in stockOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="到期日">
        <el-select v-model="formData.到期日List" multiple>
          <el-option v-for="date in deadline_list" :key="date" :label="date" :value="date" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
  <div class="grid grid-cols-2">
    <VChart :option="deltaOption" style="height: 300px; width: 100%; margin: auto" />
    <VChart :option="代替正股Option" style="height: 300px; width: 100%; margin: auto" />
    <VChart :option="gammaOption" style="height: 300px; width: 100%; margin: auto" />
    <VChart :option="单日损耗Option" style="height: 300px; width: 100%; margin: auto" />
  </div>
</template>
<script setup>
import { formatNumberToWan, formatDecimal } from "~/utils/utils";
import { OPTIONS_MAP, deadline_list } from "~/data";
import dayjs from "dayjs";
import _ from "lodash";
const stockOptions = OPTIONS_MAP.map((el) => ({
  label: el.name,
  value: el.code,
}));

const formData = reactive({
  正股List: [...OPTIONS_MAP.map((el) => el.code)],
  到期日List: [...deadline_list],
});

function getSpaceBetween4Div($1, $2, $3, $4) {
  return `<div style="font-size: 14px;display:flex;justify-content: space-between;column-gap: 30px;height: 24px;">
            <div style="display:flex;align-items: center;justify-content: space-between;column-gap: 5px;">
              <div>${$3}</div>
              <div style='color: #409eff;border-radius: 3px;width: 40px;text-align: right;'>${$4}</div>
            </div>
            <div style="display:flex;align-items: center;">
              <div style='width: 70px;text-align: right;'>${$1}</div>
              <div style='width: 5px;text-align: right;'>${$2}</div>
            </div>
          </div>`;
}

const props = defineProps(["all_data"]);
function getBarOps({ stockCodeList, name, dataList, title, dataMap }) {
  return {
    title: {
      text: title,
    },
    backgroundColor: "#fefefe",
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        crossStyle: {
          color: "#999",
        },
      },
      formatter: function (params) {
        let listStr = "<br />";
        console.log("params", params);
        const name = params[0].name;
        // 标题取第一个item的name（x轴名称）
        let result = `${name}<br/>`;
        // 遍历所有系列
        params.forEach((item) => {
          const formatted = formatNumberToWan(item.value);
          result += `${item.seriesName}：${formatted}<br/>`;
        });

        listStr += _.sortBy(dataMap[name], (el) => -el["排序字段"])
          .map(
            (el) =>
              `${getSpaceBetween4Div(
                //
                el["展示字段"],
                // 占位
                "",
                // 名称
                el["期权名称"],
                el["持仓"]
              )}`
          )
          .join("");

        return result + listStr;
      },
    },
    xAxis: [
      {
        type: "category",
        data: stockCodeList.map((code) => OPTIONS_MAP.find((el) => el.code === code).name),
        axisPointer: {
          type: "shadow",
        },
        axisLabel: {
          rotate: 61, // 旋转角度
        },
      },
    ],
    yAxis: {
      type: "value",
    },
    series: {
      type: "bar",
      name,
      data: dataList,
    },
  };
}

const filteredData = computed(() => {
  return (
    props.all_data
      ?.filter((el) => el["持仓"])
      ?.filter((el) => formData.正股List.includes(el["正股代码"]))
      ?.filter((el) => formData.到期日List.includes(el["到期日"])) || []
  );
});
const deltaOption = computed(() => {
  let all_data = filteredData.value;
  if (!all_data?.length) return {};
  const stockCodeList = OPTIONS_MAP.map((el) => el.code).filter((el) => Array.from(new Set(all_data.map((el) => el["正股代码"]))).includes(el));
  const dataList = stockCodeList.map((code) => {
    let codeOptions = all_data.filter((el) => el["正股代码"] === code);
    return get_list_all_delta(codeOptions);
  });
  const dataMap = {};
  stockCodeList.forEach((code) => {
    const name = OPTIONS_MAP.find((el) => el.code == code).name;
    dataMap[name] = all_data
      .filter((el) => el["正股代码"] === code)
      .map((el) => ({
        排序字段: el["Delta"] * el["持仓"],
        展示字段: formatDecimal(el["Delta"] * el["持仓"], 2).toFixed(2),
        期权名称: el["期权名称"],
        持仓: el["持仓"],
      }));
  });
  return getBarOps({
    stockCodeList,
    name: "Delta",
    title: "Delta",
    dataList,
    dataMap,
  });
});
const 代替正股Option = computed(() => {
  let all_data = filteredData.value;
  if (!all_data?.length) return {};
  const stockCodeList = OPTIONS_MAP.map((el) => el.code).filter((el) => Array.from(new Set(all_data.map((el) => el["正股代码"]))).includes(el));
  let 代替正股Sum = 0;
  const dataList = stockCodeList.map((code) => {
    let codeOptions = all_data.filter((el) => el["正股代码"] === code);
    let val = get_list_all_代替正股(codeOptions);
    代替正股Sum += val;
    return val;
  });
  const dataMap = {};
  stockCodeList.forEach((code) => {
    const name = OPTIONS_MAP.find((el) => el.code == code).name;
    dataMap[name] = all_data
      .filter((el) => el["正股代码"] === code)
      .map((el) => ({
        排序字段: el["代替正股价"] * el["持仓"],
        展示字段: formatNumberToWan(formatDecimal(el["代替正股价"] * el["持仓"], 0)),
        期权名称: el["期权名称"],
        持仓: el["持仓"],
      }));
  });
  return getBarOps({
    stockCodeList,
    name: "代替正股",
    title: `代替正股 ( ${formatNumberToWan(代替正股Sum)} ) `,
    dataList,
    dataMap,
  });
});

const gammaOption = computed(() => {
  let all_data = filteredData.value;
  if (!all_data?.length) return {};
  const stockCodeList = OPTIONS_MAP.map((el) => el.code).filter((el) => Array.from(new Set(all_data.map((el) => el["正股代码"]))).includes(el));
  const dataList = stockCodeList.map((code) => {
    let codeOptions = all_data.filter((el) => el["正股代码"] === code);
    return get_list_all_gamma(codeOptions);
  });
  const dataMap = {};
  stockCodeList.forEach((code) => {
    const name = OPTIONS_MAP.find((el) => el.code == code).name;
    dataMap[name] = all_data
      .filter((el) => el["正股代码"] === code)
      .map((el) => ({
        排序字段: el["Gamma"] * el["持仓"],
        展示字段: formatDecimal(el["Gamma"] * el["持仓"], 1),
        期权名称: el["期权名称"],
        持仓: el["持仓"],
      }));
  });
  return getBarOps({
    stockCodeList,
    name: "Gamma",
    title: "Gamma",
    dataList,
    dataMap,
  });
});

const 单日损耗Option = computed(() => {
  let all_data = filteredData.value;
  if (!all_data?.length) return {};
  const stockCodeList = OPTIONS_MAP.map((el) => el.code).filter((el) => Array.from(new Set(all_data.map((el) => el["正股代码"]))).includes(el));
  let 单日损耗Sum = 0;
  const dataList = stockCodeList.map((code) => {
    let codeOptions = all_data.filter((el) => el["正股代码"] === code);
    let val = get_list_all_单日损耗(codeOptions);
    单日损耗Sum += val;
    return val;
  });
  单日损耗Sum = 单日损耗Sum.toFixed(0);
  const dataMap = {};
  stockCodeList.forEach((code) => {
    const name = OPTIONS_MAP.find((el) => el.code == code).name;
    dataMap[name] = all_data
      .filter((el) => el["正股代码"] === code)
      .map((el) => ({
        排序字段: el["单日损耗"] * el["持仓"],
        展示字段: formatDecimal(el["单日损耗"] * el["持仓"], 1),
        期权名称: el["期权名称"],
        持仓: el["持仓"],
      }));
  });
  return getBarOps({
    stockCodeList,
    name: "单日损耗",
    title: `单日损耗 ( ${formatNumberToWan(单日损耗Sum)} ) `,
    dataList,
    dataMap,
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
    sum += el["持仓"] * el["代替正股价"];
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
