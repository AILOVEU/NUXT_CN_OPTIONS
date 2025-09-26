<template>
  <div v-loading="loading">
    <el-button @click="handleQuery">刷新</el-button>
    <div class="flex justify-between flex-wrap mx-auto">
      <VChart :option="正股分布Option" style="height: 500px; width: 550px" />
      <VChart :option="时间分布Option" style="height: 500px; width: 550px" />
      <VChart :option="沽购分布Option" style="height: 500px; width: 550px" />
    </div>
  </div>
</template>
<script setup>
import { stock_code_map, deadline_list, UNIT } from "~/data";
import { get_http_data } from "~/utils";
import _ from "lodash";
// const stockCodeList = ["510050", "510300"];
const stockCodeList = Object.keys(stock_code_map);
const 持仓JSON = ref([]);
useFetch("/api/queryHoldJson").then((res) => {
  持仓JSON.value = res.data.value || [];
});
const optionType = ["购", "沽"];
const holdInfo = {};
const 正股分布 = ref({});
const 时间分布 = ref({});
const 沽购分布 = ref({});
const loading = ref(false);
function getPieOptions({ title, seriesData }) {
  return {
    title: {
      text: title,
      left: "bottom",
    },
    tooltip: {
      trigger: "item",
    },
    legend: {
      orient: "vertical",
      bottom: "center",
    },
    series: [
      {
        radius: [75, 90],
        // radius: '50%',
        type: "pie",
        data: seriesData,
        label: {
          formatter: "{b}:{c} ({d}%)",
        },
      },
    ],
  };
}
const 正股分布Option = computed(() => {
  return getPieOptions({
    title: "正股分布",
    seriesData: _.sortBy(
      Object.keys(正股分布.value).map((code) => ({
        name: stock_code_map[code],
        value: get_list_all_hold(正股分布.value[code]),
      })),
      ["value"]
    ),
  });
});
const 时间分布Option = computed(() => {
  return getPieOptions({
    title: "时间分布",
    seriesData: Object.keys(时间分布.value).map((date) => ({
      name: date,
      value: get_list_all_hold(时间分布.value[date]),
    })),
  });
});
const 沽购分布Option = computed(() => {
  return getPieOptions({
    title: "沽购分布",
    seriesData: Object.keys(沽购分布.value).map((type) => ({
      name: type,
      value: get_list_all_hold(沽购分布.value[type]),
    })),
  });
});
async function handleQuery() {
  loading.value = true;
  let options_list = await get_http_data(持仓JSON.value, stockCodeList);
  loading.value = false;
  options_list = options_list.filter((el) => el["持仓"]);
  stockCodeList.forEach((code) => {
    holdInfo[code] = options_list.filter((el) => el["正股代码"] === code);
    optionType.forEach((type) => {
      holdInfo[code + "-" + type] = holdInfo[code].filter((el) =>
        el["期权名称"].includes(type)
      );
      deadline_list.forEach((date) => {
        holdInfo[code + "-" + type + "-" + date] = holdInfo[
          code + "-" + type
        ].filter((el) => el["到期日"].includes(date));
      });
    });
    deadline_list.forEach((date) => {
      holdInfo[code + "-" + date] = holdInfo[code].filter((el) =>
        el["到期日"].includes(date)
      );
    });
  });
  optionType.forEach((type) => {
    holdInfo[type] = options_list.filter((el) => el["期权名称"].includes(type));
    沽购分布.value[type] = holdInfo[type];
  });
  stockCodeList.forEach((code) => {
    holdInfo[code] = options_list.filter((el) => el["正股代码"] === code);
    正股分布.value[code] = holdInfo[code];
  });
  deadline_list.forEach((date) => {
    holdInfo[date] = options_list.filter((el) => el["到期日"].includes(date));
    时间分布.value[date] = holdInfo[date];
  });
  console.log(holdInfo);
}

function get_list_all_hold(list) {
  let sum = 0;
  list.forEach((el) => {
    sum += el["持仓"] * el["最新价"] * UNIT;
  });
  return sum;
}
</script>
