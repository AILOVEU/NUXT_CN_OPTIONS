<template>
  <div v-loading="tableData.loading || globalLoading.value" class="max-md:w-[140%]">
    <!-- {{tableData.data}} -->
    <div>
      <Nav />

      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>

    <div class="w-full h-[calc(100vh-80px)] mx-auto">
      <el-table :data="filteredTableData" style="width: 100%" size="small" border height="100%" :highlight-current-row="false" :row-style="getRowStyle" :cell-style="getCellStyle" ref="tableRef">
        <el-table-column v-for="{ label, type } in tableData.columns" :key="type + label" :prop="type + label" align="center" :width="label === '期权' ? '100px' : '220px'">
          <template #header>
            <div v-if="type" class="leading-[1.2]">
              <div class="leading-[1.2]">{{ type }}{{ dayjs(label, "YYYYMMDD").format("M月") }}</div>
              <div class="leading-[1.2]">({{ dayjs(label, "YYYYMMDD").diff(dayjs(), "days") + 1 }})</div>
            </div>
            <div v-else class="leading-[1.2]">
              {{ label }}
            </div>
          </template>
          <template #default="{ row }" v-if="label === '期权'">
            <Center :row="row" />
          </template>
          <template #default="{ row }" v-if="label !== '期权'">
            <Info :row="row" :isCall="type === 'C'" :date="label" />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup>
import { stock_show_name_map, stock_sort_map, 行权价_range_map, deadline_list } from "~/data";
import dayjs from "dayjs";
import Center from "~/components/hold/Center.vue";
import Info from "~/components/hold/Info.vue";
import { queryHold } from "~/utils/queryHold.js";
import { useGlobalLoading } from "~/stores/useGlobalLoading.js";
const { globalLoading } = useGlobalLoading();
const tableRef = ref();
const stockCodeOptions = computed(() => {
  let list = Object.keys(stock_show_name_map);
  list.sort(function (a, b) {
    return stock_sort_map[a] - stock_sort_map[b];
  });
  let ops = list.map((code) => ({
    value: code,
    label: stock_show_name_map[code],
  }));
  return [...ops, { value: "all", label: "全" }];
});
const stockCode = ref(stockCodeOptions.value[0].value);
const reversed_deadline_list = [...deadline_list].reverse();
const tableData = reactive({
  data: [],
  loading: false,
  columns: [
    ...reversed_deadline_list.map((el) => ({ type: "C", label: el })),
    {
      label: "期权",
      type: "",
    },
    ...deadline_list.map((el) => ({ type: "P", label: el })),
  ],
});
async function handleQuery() {
  tableData.loading = true;
  const holdData = await queryHold(stockCode.value === "all" ? Object.keys(stock_show_name_map) : [stockCode.value]);
  tableData.data = holdData || [];
  tableData.loading = false;
}
handleQuery();
function handleStockCodeChange() {
  tableRef.value.setScrollTop(0);
  setTimeout(() => {
    handleQuery();
  });
}
const 行权价RangeDict = reactive({ ...行权价_range_map });
const filteredTableData = computed(() => {
  return tableData.data.filter((el) => {
    if (el["_持仓"]) return true;
    // if (el["正股代码"] !== stockCode.value) return false;
    if (el["期权"]?.includes("A")) return false;
    if (el["行权价"] * 1000 < 5000 && (el["行权价"] * 1000) % 100 !== 0) return false;
    if (el._current || el._split) return true;
    return el["行权价"] * 1000 >= 行权价RangeDict[el["正股代码"]][0] && el["行权价"] * 1000 <= 行权价RangeDict[el["正股代码"]][1];
  });
});

function getCellStyle({ column, row }) {
  if (column?.["property"] === "期权") return { backgroundColor: "rgba(255,255,255,0.01)", fontWeight: "600" };
  // if (column?.["property"]?.includes("C_") && row?.["C机会"])
  //   return { backgroundColor: "rgba(190, 220, 190,0.5)" };
  // if (column?.["property"]?.includes("P_") && row?.["P机会"])
  //   return { backgroundColor: "rgba(190, 220, 190,0.5)" };
  // 红 | 绿
  // -------
  // 绿 | 红
  // const 实值style = { backgroundColor: "rgb(255, 220, 220)" };
  // const 虚值style = { backgroundColor: "rgb(190, 220, 190)" };
  // if (row["行权价"] > row["正股价格"]) {
  //   return column?.["property"]?.includes("C_") ? 虚值style : 实值style;
  // } else {
  //   return column?.["property"]?.includes("C_") ? 实值style : 虚值style;
  // }
  return { backgroundColor: "white" };
}
function getRowStyle({ row }) {
  return {};
}
</script>
<style lang="less">
.el-table--small .cell {
  padding: 0 0px;
}
.el-table--small .el-table__cell {
  padding: 0px 0;
}
.el-radio-group {
  justify-content: center;
  width: 100%;
}
.el-radio-button {
  flex: 1;
}
// .el-table td.el-table__cell, .el-table th.el-table__cell.is-leaf{
//   border: 0;
// }
</style>
