<template>
  <div v-loading="loading">
    <el-affix :offset="0">
      <div class="flex justify-between text-[12px] mb-[12px]">
        <el-button @click="handleQuery" class="flex-1" type="primary">
          刷新
        </el-button>
        <Nav />
      </div>
    </el-affix>
    <Map />
    <div class="mt-[20px] flex flex-col gap-[20px] mx-[10px]">
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
  </div>
</template>
<script setup>
import { stock_code_map } from "~/data";
import { get_http_data } from "~/utils";
import _ from "lodash";
import { ElMessage } from "element-plus";
import PercentInfo from "~/components/analysis/PercentInfo";
import BubbleInfo from "~/components/analysis/BubbleInfo";
import BarInfo from "~/components/analysis/BarInfo";
import TimeInfo from "~/components/analysis/TimeInfo";
import MoneyInfo from "~/components/analysis/MoneyInfo";
import FilterInfo from "~/components/analysis/FilterInfo";
import { useHttpStore } from "~/stores/useHttpStore.js";
const { httpStore, setHttpStore } = useHttpStore();
const stockCodeList = Object.keys(stock_code_map);
const 持仓JSON = ref([]);
useFetch("/api/queryHoldJson").then((res) => {
  持仓JSON.value = res.data.value || [];
});
const all_data = ref([]);
const combo_list = ref([]);
const loading = ref(false);
async function handleQuery() {
  // if (httpStore.value) {
  //   ElMessage("网络请求，使用缓存代替");
  //   const [data, list] = httpStore.value;
  //   combo_list.value = list;
  //   all_data.value = data;
  //   return;
  // }
  loading.value = true;
  // plan 1
  const [data, list] = await get_http_data(持仓JSON.value, stockCodeList);
  setHttpStore([data, list]);
  combo_list.value = list;
  all_data.value = data;
  loading.value = false;
  // plan 2
  // all_data.value = MOCK_HOLD_DATA;
  // loading.value = false;
}
</script>
