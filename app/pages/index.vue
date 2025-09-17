<template>
  <el-button @click="refresh">刷新</el-button>
  <div class="w-full pb-[12px]">
    <el-radio-group v-model="stockName" size="small">
      <el-radio-button
        v-for="stock in stockNameList"
        :key="stock"
        :value="stock"
      >
        {{ stock }}
      </el-radio-button>
    </el-radio-group>
  </div>

  <el-table
    :data="filteredTableData"
    style="width: 100%"
    v-loading="tableData.loading"
    table-layout="auto"
    size="small"
    border
    height="950px"
    :highlight-current-row="false"
    :row-style="getRowStyle"
    :cell-style="getCellStyle"
  >
    <el-table-column
      v-for="key in tableData.columns"
      :key="key"
      :prop="key"
      :label="key"
      sortable
      align="center"
    >
      <template #default="{ row }" v-if="key === '期权'">
        <Center :row="row" />
      </template>
      <template #default="{ row }" v-if="key.includes('_价格')">
        <Price :row="row" :isCall="key.includes('C')" />
      </template>
      <template #default="{ row }" v-if="key.includes('_信息')">
        <Info :row="row" :isCall="key.includes('C')" />
      </template>
      <template #default="{ row }" v-if="key.includes('_合约')">
        <Options :row="row" :isCall="key.includes('C')" />
      </template>
      <template #default="{ row }" v-if="key.includes('_价值')">
        <Time :row="row" :isCall="key.includes('C')" />
      </template>
      <template #default="{ row }" v-if="key.includes('_持仓')">
        <Hold :row="row" :isCall="key.includes('C')" />
      </template>
    </el-table-column>
  </el-table>
</template>
<script setup>
import { stock_name_map } from "~/data";
const stockNameList = computed(() => {
  return Object.keys(stock_name_map);
});
const stockName = ref(stockNameList.value[0]);
const tableData = reactive({
  data: [],
  loading: false,
  columns: [
    "C_合约",
    "C_价值",
    "C_信息",
    "C_持仓",
    "C_价格",
    "期权",
    "P_价格",
    "P_持仓",
    "P_信息",
    "P_价值",
    "P_合约",
  ],
});
async function refresh() {
  tableData.loading = true;
  const res = await useFetch("/api/queryOps");
  tableData.data = res.data.value || [];
  tableData.loading = false;
}
const 行权价RangeDict = reactive({
  上证50ETF: [2800, 3400],
  沪深300ETF: [4000, 5000],
  中证500ETF: [5500, 8000],
  科创50ETF: [1000, 1600],
  科创板50ETF: [1000, 1600],
});
const filteredTableData = computed(() => {
  return tableData.data.filter((el) => {
    if (el["正股"] !== stockName.value) return false;
    if (el["C持仓"] || el["P持仓"]) return true;
    if (el["期权"]?.includes("A")) return false;
    if (el._current || el._split) return true;
    return (
      el["行权价"] * 1000 >= 行权价RangeDict[stockName.value][0] &&
      el["行权价"] * 1000 <= 行权价RangeDict[stockName.value][1]
    );
  });
});

function getCellStyle({ column, row }) {
  if (row?.["_current"]) return {};
  if (row?.["_split"]) return { backgroundColor: "black", color: "black" };
  if (column?.["property"] === "期权")
    return { backgroundColor: "rgba(255,255,255,0.01)", fontWeight: "600" };

  if (column?.["property"]?.includes("C_") && row?.["C机会"])
    return { backgroundColor: "rgba(190, 220, 190,0.5)" };
  if (column?.["property"]?.includes("P_") && row?.["P机会"])
    return { backgroundColor: "rgba(190, 220, 190,0.5)" };

  // 红 | 绿
  // -------
  // 绿 | 红
  const 实值style = { backgroundColor: "rgb(255, 220, 220)" };
  const 虚值style = { backgroundColor: "rgb(190, 220, 190)" };
  // if (row["行权价"] > row["正股价格"]) {
  //   return column?.["property"]?.includes("C_") ? 虚值style : 实值style;
  // } else {
  //   return column?.["property"]?.includes("C_") ? 实值style : 虚值style;
  // }
  return { backgroundColor: 'white'};
}
function getRowStyle({ row }) {
  return {};
}
</script>
<style lang="less">
.el-table--small .cell {
  padding: 0 2px;
}
.el-table--small .el-table__cell {
  padding: 2px 0;
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
