<template>
  <div v-loading="loading || globalLoading.value" class="max-md:w-[255%]">
    <Nav />
    <div class="mt-[20px] flex flex-col gap-[20px] mx-[10px] pb-[200px]">
      <Card header="非组合概览_UnComboOverview">
        <UnComboOverview :tiledData="tiledData" :comboList="comboList" />
      </Card>
      <Card header="组合概览_ComboOverview" v-if="comboList.length">
        <ComboOverview :tiledData="tiledData" :comboList="comboList" />
      </Card>
      <Card header="Gamma翻转_Flip"> <Flip :gammaFlipData="gammaFlipData" /> </Card>
      <Card header="资金分析_MoneyTrend">
        <MoneyTrend :tiledData="tiledData" :comboList="comboList" />
      </Card>
      <Card header="交割单_OrderTimeline">
        <OrderTimeline :orderList="orderList" />
      </Card>
      <Card header="时间价值分析_SankeyInfo">
        <SankeyInfo :tiledData="tiledData" :comboList="comboList" />
      </Card>
      <Card header="持仓分析_BarInfo">
        <BarInfo :tiledData="tiledData" />
      </Card>
    </div>
  </div>
</template>
<script setup>
import { OPTIONS_MAP } from "~/data";
import { get_http_data } from "~/utils/options";
import _ from "lodash";
import BarInfo from "./components/BarInfo";
import OrderTimeline from "./components/OrderTimeline";
import SankeyInfo from "./components/SankeyInfo";
import MoneyTrend from "./components/MoneyTrend";
import UnComboOverview from "./components/UnComboOverview";
import ComboOverview from "./components/ComboOverview";
import Flip from "./components/Flip";
import { useGlobal } from "~/stores/useGlobal.js";
const { globalLoading } = useGlobal();
const tiledData = ref([]);
const comboList = ref([]);
const orderList = ref([]);
const gammaFlipData = ref({});
const loading = ref(false);
async function handleQuery() {
  loading.value = true;
  let [data, list, , order, flip] = await get_http_data(OPTIONS_MAP.map((el) => el.code));
  comboList.value = list;
  tiledData.value = data;
  order.sort(function (a, b) {
    if (a["正股代码"] === b["正股代码"]) {
      // a["正股代码"] === "510500" && a["_split"] && console.log(a["行权价"], b["行权价"]);
      if (a["行权价"] === b["行权价"]) {
        return a["到期月"] - b["到期月"];
      }
      return a["行权价"] - b["行权价"];
    }
    const aSort = OPTIONS_MAP.findIndex((el) => el.code === a["正股代码"]);
    const bSort = OPTIONS_MAP.findIndex((el) => el.code === b["正股代码"]);
    return aSort - bSort;
  });
  orderList.value = order;
  gammaFlipData.value = flip;
  loading.value = false;
}
handleQuery();
</script>
