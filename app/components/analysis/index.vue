<template>
  <div v-loading="loading">
    <el-button @click="handleQuery">刷新</el-button>
    <BubbleInfo :all_data="all_data" />
    <PercentInfo :options_list="options_list"/>
  </div>
</template>
<script setup>
import { stock_code_map, deadline_list, UNIT, stock_sort_map } from "~/data";
import { MOCK_HOLD_DATA } from "~/utils";
import { get_http_data } from "~/utils";
import _ from "lodash";
import PercentInfo from "./PercentInfo";
import BubbleInfo from "./BubbleInfo";
const stockCodeList = Object.keys(stock_code_map);
const 持仓JSON = ref([]);
useFetch("/api/queryHoldJson").then((res) => {
  持仓JSON.value = res.data.value || [];
});
const all_data = ref();
const options_list = ref();
const loading = ref(false);
async function handleQuery() {
  loading.value = true;
  // plan 1
  options_list.value = await get_http_data(持仓JSON.value, stockCodeList);
  all_data.value = [...options_list.value];
  options_list.value = options_list.value.filter((el) => el["持仓"]);
  loading.value = false;
  // plan 2
  // options_list.value = MOCK_HOLD_DATA;
  // all_data.value = [...options_list.value];
  // loading.value = false;
}
</script>
