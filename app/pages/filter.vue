<template>
  <div v-loading="loading" class="max-md:w-[140%]">
    <el-affix :offset="0">
      <div class="flex justify-between text-[12px] mb-[12px]">
        <el-button @click="handleQuery" class="flex-1" type="primary">
          刷新
        </el-button>
        <Nav />
      </div>
    </el-affix>
    <FilterInfo :all_data="all_data" />
  </div>
</template>
<script setup>
import { stock_code_map } from "~/data";
import { get_http_data } from "~/utils";
import _ from "lodash";
import FilterInfo from "~/components/analysis/FilterInfo";
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
