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
      <!-- <Card header="气泡图分析">
        <BubbleInfo :all_data="all_data" />
      </Card> -->
      <!-- <Card header="持仓占比分析">
        <PercentInfo :all_data="all_data" />
      </Card> -->
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
import BarInfo from "~/components/analysis/BarInfo";
import TimeInfo from "~/components/analysis/TimeInfo";
import MoneyInfo from "~/components/analysis/MoneyInfo";
import FilterInfo from "~/components/analysis/FilterInfo";
import { useHttpStore } from "~/stores/useHttpStore.js";
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
  const [data, list] = await get_http_data(持仓JSON.value, stockCodeList);
  combo_list.value = list;
  all_data.value = data;
  loading.value = false;
}
</script>
