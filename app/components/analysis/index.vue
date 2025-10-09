<template>
  <div v-loading="loading">
    <el-button @click="handleQuery">刷新</el-button>
    <Card header="资金分析">
      <MoneyInfo :all_data="all_data" :combo_list="combo_list" />
    </Card>
    <Card header="时间价值分析">
      <TimeInfo :all_data="all_data" :combo_list="combo_list" />
    </Card>
    <Card header="持仓分析">
      <BarInfo :all_data="all_data" />
    </Card>
    <Card header="气泡图分析">
      <BubbleInfo :all_data="all_data" />
    </Card>
    <Card header="持仓占比分析">
      <PercentInfo :all_data="all_data" />
    </Card>
    <Card header="筛选">
      <FilterInfo :all_data="all_data" />
    </Card>
  </div>
</template>
<script setup>
import { stock_code_map } from "~/data";
import { get_http_data } from "~/utils";
import _ from "lodash";
import PercentInfo from "./PercentInfo";
import BubbleInfo from "./BubbleInfo";
import BarInfo from "./BarInfo";
import TimeInfo from "./TimeInfo";
import MoneyInfo from "./MoneyInfo";
import FilterInfo from "./FilterInfo";
const stockCodeList = Object.keys(stock_code_map);
const 持仓JSON = ref([]);
useFetch("/api/queryHoldJson").then((res) => {
  持仓JSON.value = res.data.value || [];
});
const all_data = ref([]);
const combo_list = ref([]);
const loading = ref(false);
async function handleQuery() {
  loading.value = true;
  // plan 1
  const [data, list] = await get_http_data(持仓JSON.value, stockCodeList);
  combo_list.value = list;
  all_data.value = data;
  loading.value = false;
  // plan 2
  // all_data.value = MOCK_HOLD_DATA;
  // loading.value = false;
}
</script>
