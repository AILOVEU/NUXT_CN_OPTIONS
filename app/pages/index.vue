<template>
  <div v-loading="tableData.loading || globalLoading.value" class="max-md:w-[250%]">
    <div>
      <Nav />

      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>
    <div class="h-[calc(100vh-80px)] max-md:h-[calc(250vh-120px)] flex justify-center">
      <div class="mx-auto overflow-x-auto">
        <el-table :data="filteredTableData" style="width: 100%" size="small" border height="100%" :highlight-current-row="false" :row-style="getRowStyle" :cell-style="getCellStyle" ref="tableRef">
          <el-table-column #default="{ row }" align="center" width="100" label="C_合约" prop="C_合约"><Options :row="row" :isCall="true" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="100" label="C_价值" prop="C_价值"><Time :row="row" :isCall="true" /> </el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="C_信息" prop="C_信息"><Info :row="row" :isCall="true" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="C_持仓" prop="C_持仓"><Hold :row="row" :isCall="true" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="125" lalbel="C_价格" prop="C_价格"><Price :row="row" :isCall="true" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="100" label="期权" prop="期权"><Center :row="row" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="125" lalbel="P_价格" prop="P_价格"><Price :row="row" :isCall="false" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="P_持仓" prop="P_持仓"><Hold :row="row" :isCall="false" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="P_信息" prop="P_信息"><Info :row="row" :isCall="false" /></el-table-column>
          <el-table-column #default="{ row }" align="center" width="100" label="P_价值" prop="P_价值"><Time :row="row" :isCall="false" /> </el-table-column>
          <el-table-column #default="{ row }" align="center" width="100" label="P_合约" prop="P_合约"><Options :row="row" :isCall="false" /></el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>
<script setup>
import Center from "~/components/t/Center.vue";
import Price from "~/components/t/Price.vue";
import Info from "~/components/t/Info.vue";
import Options from "~/components/t/Options.vue";
import Time from "~/components/t/Time.vue";
import Hold from "~/components/t/Hold.vue";
import { queryT } from "~/utils/queryT.js";
import { OPTIONS_MAP } from "~/data";
import { useGlobalLoading } from "~/stores/useGlobalLoading.js";
const { globalLoading } = useGlobalLoading();

const tableRef = ref();
const stockCodeOptions = computed(() => {
  return OPTIONS_MAP.map((el) => ({
    value: el.code,
    label: el.showName,
  }));
});
const stockCode = ref(stockCodeOptions.value[0].value);
const tableData = reactive({
  data: [],
  loading: false,
  columns: [
    {
      label: "C_合约",
      width: "150px",
    },
    {
      label: "C_价值",
      width: "120px",
    },
    {
      label: "C_信息",
      width: "160px",
    },
    {
      label: "C_持仓",
      width: "180px",
    },
    {
      label: "C_价格",
      width: "160px",
    },
    {
      label: "期权",
      width: "100px",
    },
    {
      label: "P_价格",
      width: "160px",
    },
    {
      label: "P_持仓",
      width: "180px",
    },
    {
      label: "P_信息",
      width: "160px",
    },
    {
      label: "P_价值",
      width: "120px",
    },
    {
      label: "P_合约",
      width: "150px",
    },
  ],
});
async function handleQuery() {
  tableData.loading = true;
  const tData = await queryT([stockCode.value]);
  tableData.data = tData || [];
  tableData.loading = false;
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
    if (el["正股代码"] !== stockCode.value) return false;
    if (el["C持仓"] || el["P持仓"]) return true;
    if (el["期权"]?.includes("A")) return false;
    if (el._current || el._split) return true;
    const targetRangeArr = OPTIONS_MAP.find((item) => item.code === stockCode.value).行权价Range;
    return el["千行权价"] >= targetRangeArr[0] && el["千行权价"] <= targetRangeArr[1];
  });
});

function getCellStyle({ column, row }) {
  if (row?.["_current"]) return { backgroundColor: "#f5f7fa" };
  if (row?.["_split"]) return { backgroundColor: "black", color: "black" };
  if (column?.["property"] === "期权") return { backgroundColor: "rgba(255,255,255,0.01)", fontWeight: "600" };

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
