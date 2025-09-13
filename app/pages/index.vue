<template>
  <el-button @click="refresh">刷新</el-button>
  <el-table
    :data="tableData.data"
    style="width: 100%"
    v-loading="tableData.loading"
    table-layout="auto"
    size="small"
    border
    stripe
    highlight-current-row
    height="800px"
    :row-class-name="getRowClassName"
  >
    <el-table-column
      v-for="key in tableData.columns"
      :key="key"
      :prop="key"
      :label="key"
      sortable
      :fix="fixedCols.includes(key)"
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
const fixedCols = ["C_价格", "期权", "P_价格"];
const tableData = reactive({
  data: [],
  loading: false,
  columns: [
    "C_合约",
    "C_价值",
    "C_信息",
    'C_持仓',
    "C_价格",
    "期权",
    "P_价格",
    'P_持仓',
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

function getRowClassName(){
  
}
</script>
