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

const filteredTableData = computed(() => {
  return tableData.data.filter((el) => el["正股"] === stockName.value);
});

function getCellStyle({ column, row }) {
  if (row?.["_current"]) return {};
  if (row?.["_split"]) return { backgroundColor: "black", color: "black" };
  if (column?.["property"] === "期权") return { backgroundColor: "#ccc" };
  // 红 | 绿
  // -------
  // 绿 | 红
  const 实值style = { backgroundColor: "rgba(228,8,10,0.02)" };
  const 虚值style = { backgroundColor: "rgba(73,253,2,0.02)" };
  if (row["行权价"] > row["正股价格"]) {
    return column?.["property"]?.includes("C_") ? 虚值style : 实值style;
  } else {
    return column?.["property"]?.includes("C_") ? 实值style : 虚值style;
  }
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
.el-radio-group{
  justify-content: center;
  width: 100%;
}
.el-radio-button{
  flex: 1;
}
</style>
