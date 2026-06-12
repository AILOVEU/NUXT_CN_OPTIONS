<template>
  <Nav />
  <!-- <el-table :data="tiledData" style="width: 100%" size="small" border stripe height="100%" :highlight-current-row="false" ref="tableRef">
    <el-table-column v-for="col in Object.values(stock_index_fields_dict)" :label="col" align="center" fixed="left" #default="{ $index, row }">
      {{ row[col] }}
    </el-table-column>
  </el-table> -->
  <!-- {{ tableData.data }} -->
  <el-button @click="handleQuery">获取</el-button>
  <div class="flex flex-col gap-[5px] py-[15px] text-[2em]">
    <div class="flex">
      <div>购代替正股: {{ formatNumberToWan(持仓Info.购代替正股) }}</div>
    </div>
    <div class="flex">
      <div>沽代替正股: {{ formatNumberToWan(持仓Info.沽代替正股) }}</div>
    </div>
  </div>
  <el-table :data="tableData.data" size="small" border height="100%" :highlight-current-row="false" ref="tableRef">
    <el-table-column v-for="{ label, type } in tableData.columns" :key="type + label" :prop="type + label" align="center">
      <template #header>
        <div v-if="type" class="leading-[1.2]">
          <div class="leading-[1.2]">{{ type }}{{ label }}</div>
        </div>
        <div v-else class="leading-[1.2] flex items-center gap-[2px] justify-center cursor-pointer" @click="() => captureRef.download()">
          <div>{{ label }}</div>
          <el-button link>⬇</el-button>
        </div>
      </template>
      <template #default="{ row }" v-if="label === '期权'">
        <Center :row="row" />
      </template>
      <template #default="{ row }" v-if="label !== '期权'">
        <Info :row="row" :isCall="type === 'C'" :date="label" :tiledData="tiledData" mode="hold" :indexVal="[]" showTypeVal="精简" />
      </template>
    </el-table-column>
  </el-table>
</template>
<script setup>
import { formatNumberToWan, formatDecimal } from "~/utils/utils";
import { STOCK_INDEX_OPTIONS_MAP, stock_index_fields_dict } from "~/data";
import { get_http_data_stock_index } from "~/utils/stockIndexOptions";
import Center from "./components/Center";
import Info from "./components/Info";
import _ from "lodash";
const deadline_list = ["2606", "2607", "2608", "2609", "2612", "2703"];
const reversed_deadline_list = _.reverse([...deadline_list]);
const tableData = reactive({
  columns: [
    ...reversed_deadline_list.map((el) => ({ type: "C", label: el })),
    {
      label: "期权",
      type: "",
    },
    ...deadline_list.map((el) => ({ type: "P", label: el })),
  ],
  data: [],
});
const tiledData = ref([]);
const loading = ref(false);
async function handleQuery() {
  loading.value = true;
  let [data, _data] = await queryStockIndexGrid([STOCK_INDEX_OPTIONS_MAP.map((el) => el["code"])]);
  tableData.data = data;
  tiledData.value = _data;
  loading.value = false;
}

const 持仓Info = computed(() => {
  const 持仓List = tiledData.value.filter((el) => el["持仓"]);
  let 购代替正股 = 0;
  持仓List
    .filter((el) => el["沽购"] === "购")
    .forEach((el) => {
      购代替正股 += el["正股价格"] * el["合约单位"] * el["Delta"];
    });
  购代替正股 = formatDecimal(购代替正股, 0);

  let 沽代替正股 = 0;
  持仓List
    .filter((el) => el["沽购"] === "沽")
    .forEach((el) => {
      沽代替正股 += el["正股价格"] * el["合约单位"] * el["Delta"];
    });
  沽代替正股 = formatDecimal(沽代替正股, 0);

  return {
    购代替正股,
    沽代替正股,
  };
});
// handleQuery();
</script>
