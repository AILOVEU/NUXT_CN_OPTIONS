<template>
  <div class="flex justify-between text-[12px]">
    <el-button @click="refresh">刷新</el-button>
    <div class="flex items-center">
      <a href="/">T型</a>
      <div class="w-[200px]"></div>
      <a href="/hold">持仓</a>
    </div>
  </div>
  <div class="w-full pb-[12px]">
    <el-radio-group v-model="stockCode" size="small">
      <el-radio-button
        v-for="stock_code in stockCodeList"
        :key="stock_code"
        :value="stock_code"
        @click="() => tableRef.setScrollTop(0)"
      >
        {{ stock_show_name_map[stock_code] }}
      </el-radio-button>
    </el-radio-group>
  </div>

  <div class="mx-auto">
    <el-table
      :data="filteredTableData"
      style="width: 100%"
      v-loading="tableData.loading"
      size="small"
      border
      height="950px"
      :highlight-current-row="false"
      :row-style="getRowStyle"
      :cell-style="getCellStyle"
      ref="tableRef"
    >
      <el-table-column
        v-for="{ label, width } in tableData.columns"
        :key="label"
        :prop="label"
        :label="label"
        :width="width"
        align="center"
      >
        <template #default="{ row }" v-if="label === '期权'">
          <Center :row="row" />
        </template>
        <template #default="{ row }" v-if="label.includes('_价格')">
          <Price :row="row" :isCall="label.includes('C')" />
        </template>
        <template #default="{ row }" v-if="label.includes('_信息')">
          <Info :row="row" :isCall="label.includes('C')" />
        </template>
        <template #default="{ row }" v-if="label.includes('_合约')">
          <Options :row="row" :isCall="label.includes('C')" />
        </template>
        <template #default="{ row }" v-if="label.includes('_价值')">
          <Time :row="row" :isCall="label.includes('C')" />
        </template>
        <template #default="{ row }" v-if="label.includes('_持仓')">
          <Hold :row="row" :isCall="label.includes('C')" />
        </template>
      </el-table-column>
    </el-table>
    {{ 持仓JSON }}
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
import { stock_show_name_map, stock_sort_map, 行权价_range_map } from "~/data";
const tableRef = ref();
const stockCodeList = computed(() => {
  let list = Object.keys(stock_show_name_map);
  list.sort(function (a, b) {
    return stock_sort_map[a] - stock_sort_map[b];
  });
  return list;
});
const stockCode = ref(stockCodeList.value[0]);
const tableData = reactive({
  data: [],
  loading: false,
  columns: [
    {
      label: "C_合约",
    },
    {
      label: "C_价值",
      width: "120px",
    },
    {
      label: "C_信息",
      width: "180px",
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
      width: "180px",
    },
    {
      label: "P_价值",
      width: "120px",
    },
    {
      label: "P_合约",
    },
  ],
});
const 持仓JSON = ref([]);
useFetch("/api/queryHoldJson").then((res) => {
  持仓JSON.value = res.data.value || [];
});
async function refresh() {
  tableData.loading = true;
  const tData = await queryT(持仓JSON.value);
  tableData.data = tData || [];
  tableData.loading = false;
}
const 行权价RangeDict = reactive({ ...行权价_range_map });

const filteredTableData = computed(() => {
  return tableData.data.filter((el) => {
    if (el["正股代码"] !== stockCode.value) return false;
    if (el["C持仓"] || el["P持仓"]) return true;
    if (el["期权"]?.includes("A")) return false;
    if (el._current || el._split) return true;
    return (
      el["行权价"] * 1000 >= 行权价RangeDict[stockCode.value][0] &&
      el["行权价"] * 1000 <= 行权价RangeDict[stockCode.value][1]
    );
  });
});

function getCellStyle({ column, row }) {
  if (row?.["_current"]) return { backgroundColor: "#f5f7fa" };
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
// .el-table td.el-table__cell, .el-table th.el-table__cell.is-leaf{
//   border: 0;
// }
</style>
