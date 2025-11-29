<template>
  <div v-loading="loading || globalLoading.value" class="max-md:w-[200%]">
    <Nav />
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
import BarInfo from "~/components/analysis/BarInfo";
import TimeInfo from "~/components/analysis/TimeInfo";
import MoneyInfo from "~/components/analysis/MoneyInfo";
import FilterInfo from "~/components/analysis/FilterInfo";
import { useGlobalLoading } from "~/stores/useGlobalLoading.js";
const { globalLoading } = useGlobalLoading();
const stockCodeList = Object.keys(stock_code_map);
const all_data = ref([]);
const combo_list = ref([]);
const loading = ref(false);
async function handleQuery() {
  loading.value = true;
  const [data, list] = await get_http_data(stockCodeList);
  combo_list.value = list;
  all_data.value = data;
  loading.value = false;
}
handleQuery();
</script>
