<template>
  <div v-loading="tableData.loading || globalLoading.value" class="max-md:w-[335%]">
    <div>
      <Nav />

      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>
    <div class="h-[calc(100vh-80px)] max-md:h-[calc(335vh-120px)] flex justify-center">
      <div class="mx-auto overflow-x-auto">
        <el-table :data="filteredTableData" style="width: 100%" size="small" border height="100%" :highlight-current-row="false" :row-style="getRowStyle" :cell-style="getCellStyle" ref="tableRef">
          <el-table-column #default="{ row }" align="center" width="100" label="C_合约" prop="C_合约"><Options :row="getRowTargetOption(row, 'C')" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="100" label="C_价值" prop="C_价值"><Time :row="getRowTargetOption(row, 'C')" /> </el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="C_信息" prop="C_信息"><Info :row="getRowTargetOption(row, 'C')" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="C_持仓" prop="C_持仓"><Hold :row="getRowTargetOption(row, 'C')" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="125" lalbel="C_价格" prop="C_价格"><Price :row="getRowTargetOption(row, 'C')" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="80" label="期权" prop="期权"><Center :row="row" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="125" lalbel="P_价格" prop="P_价格"><Price :row="getRowTargetOption(row, 'P')" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="P_持仓" prop="P_持仓"><Hold :row="getRowTargetOption(row, 'P')" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="P_信息" prop="P_信息"><Info :row="getRowTargetOption(row, 'P')" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="100" label="P_价值" prop="P_价值"><Time :row="getRowTargetOption(row, 'P')" /> </el-table-column>
          <el-table-column #default="{ row }" align="center" width="100" label="P_合约" prop="P_合约"><Options :row="getRowTargetOption(row, 'P')" /></el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>
<script setup>
import Center from "./components/Center.vue";
import Price from "./components/Price.vue";
import Info from "./components/Info.vue";
import Options from "./components/Options.vue";
import Time from "./components/Time.vue";
import Hold from "./components/Hold.vue";
import { queryT } from "~/utils/queryT.js";
import { OPTIONS_MAP } from "~/data";
import { useGlobal } from "~/stores/useGlobal.js";
const { globalLoading } = useGlobal();
const tableRef = ref();
const stockCodeOptions = computed(() => {
  let ops = OPTIONS_MAP.map((el) => ({
    value: el.code,
    label: el.showName,
  }));
  return [...ops, { value: "all", label: "全" }];
});
const stockCode = ref(stockCodeOptions.value[0].value);
const tableData = reactive({
  data: [],
  combo_list: [],
  tiledData: [],
  loading: false,
});
async function handleQuery() {
  tableData.loading = true;
  const [tData, combo_list, tiledData] = await queryT(stockCode.value === "all" ? OPTIONS_MAP.map((el) => el.code) : [stockCode.value]);
  tableData.data = tData || [];
  tableData.combo_list = combo_list;
  tableData.tiledData = tiledData;
  tableData.loading = false;
}
function getRowTargetOption(row, callType) {
  // row
  // C期权名称: "50ETF购3月3300"
  // P期权名称: "50ETF沽3月3300"
  // is旧期权: false
  // 到期日: "2026-03-25"
  // 千行权价: 3300
  // 正股代码: "510050"
  // 正股价格: 3.15
  // 行权价: 3.3
  if (!row["C期权名称"]) return row;
  if (callType === "C") return tableData.tiledData.find((el) => el["期权名称"] === row["C期权名称"]) || {};
  if (callType === "P") return tableData.tiledData.find((el) => el["期权名称"] === row["P期权名称"]) || {};
  return row;
}
handleQuery();
function handleStockCodeChange() {
  tableRef.value.setScrollTop(0);
  setTimeout(() => {
    handleQuery();
  });
}
const filteredTableData = computed(() => {
  return tableData.data.filter((el) => {
    if (el["is行内有持仓"]) return true;
    if (el["is旧期权"]) return false;
    if (el._current || el._split) return true;
    const targetRangeArr = OPTIONS_MAP.find((item) => item.code === el["正股代码"]).行权价Range;
    return el["千行权价"] >= targetRangeArr[0] && el["千行权价"] <= targetRangeArr[1];
  });
});

function getCellStyle({ column, row }) {
  if (row?.["_current"]) return { backgroundColor: "#f5f7fa" };
  if (row?.["_split"]) return { backgroundColor: "black", color: "black" };
  if (column?.["property"] === "期权") return { backgroundColor: "#CBDCEB", fontWeight: "600", border: "1px solid white" };
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
  return { backgroundColor: "white" };
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
</style>
