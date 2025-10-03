<template>
  <div v-loading="loading">
    <el-button @click="handleQuery">刷新</el-button>
    <DescInfo :all_data="all_data" :combo_list="combo_list"/>
    <BarInfo :all_data="all_data" />
    <BubbleInfo :all_data="all_data" />
    <PercentInfo :all_data="all_data" />
  </div>
</template>
<script setup>
import { stock_code_map, deadline_list, UNIT, stock_sort_map } from "~/data";
import { MOCK_HOLD_DATA } from "~/utils";
import { get_http_data } from "~/utils";
import _ from "lodash";
import PercentInfo from "./PercentInfo";
import BubbleInfo from "./BubbleInfo";
import BarInfo from "./BarInfo";
import DescInfo from "./DescInfo";
const stockCodeList = Object.keys(stock_code_map);
const 持仓JSON = ref([]);
useFetch("/api/queryHoldJson").then((res) => {
  持仓JSON.value = res.data.value || [];
});
const all_data = ref([]);
const combo_list = ref([])
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
