<template>
  <div v-loading="loading || globalLoading.value" class="max-md:w-[255%]">
    <Nav />
    <div class="mt-[20px] flex flex-col gap-[20px] mx-[10px] pb-[200px]">
      <Card header="概览">
        <Overview :all_data="all_data" :comboList="comboList" />
      </Card>
      <Card header="资金分析">
        <MoneyTrend :all_data="all_data" :comboList="comboList" />
      </Card>
      <Card header="时间价值分析">
        <SankeyInfo :all_data="all_data" :comboList="comboList" />
      </Card>
      <Card header="持仓分析">
        <BarInfo :all_data="all_data" />
      </Card>
    </div>
  </div>
</template>
<script setup>
import { OPTIONS_MAP } from "~/data";
import { get_http_data } from "~/utils/options";
import _ from "lodash";
import BarInfo from "./components/BarInfo";
import SankeyInfo from "./components/SankeyInfo";
import MoneyTrend from "./components/MoneyTrend";
import Overview from './components/Overview';
import { useGlobal } from "~/stores/useGlobal.js";
const { globalLoading } = useGlobal();
const all_data = ref([]);
const comboList = ref([]);
const loading = ref(false);
async function handleQuery() {
  loading.value = true;
  const [data, list] = await get_http_data(OPTIONS_MAP.map((el) => el.code));
  comboList.value = list;
  all_data.value = data;
  loading.value = false;
}
handleQuery();
</script>
