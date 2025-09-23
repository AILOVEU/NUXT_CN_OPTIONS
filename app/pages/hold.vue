<template>
  <div>
    <div class="flex justify-between text-[12px] mb-[12px]">
      <el-button @click="refresh" size="small">刷新</el-button>
      <el-button @click="copy" size="small">复制持仓</el-button>
      <div class="flex items-center">
        <a href="/">T型</a>
        <div class="w-[10vw]"></div>
        <a href="/hold">持仓</a>
      </div>
    </div>
    <div class="w-full pb-[12px]">
      <TabSelect
        :options="stockCodeOptions"
        v-model="stockCode"
        @click="handleStockCodeChange"
      />
    </div>
  </div>

  <div class="w-full h-[calc(100vh-100px)]">
    <el-table
      :data="filteredTableData"
      style="width: 100%"
      v-loading="tableData.loading"
      size="small"
      border
      height="100%"
      :highlight-current-row="false"
      :row-style="getRowStyle"
      :cell-style="getCellStyle"
      ref="tableRef"
    >
      <el-table-column
        v-for="{ label, type, width } in tableData.columns"
        :key="type + label"
        :prop="type + label"
        :width="width"
        align="center"
        :minWidth="label === '期权' ? '65px' : '120px'"
      >
        <template #header>
          <div v-if="type">
            <div>{{ type }}{{ dayjs(label, "YYYYMMDD").format("M月") }}</div>
            <div>
              ({{ dayjs(label, "YYYYMMDD").diff(dayjs(), "days") + 1 }})
            </div>
          </div>
          <div v-else>
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
</template>
<script setup>
import { stock_show_name_map, stock_sort_map, 行权价_range_map } from "~/data";
import dayjs from "dayjs";
import Center from "~/components/hold/Center.vue";
import Info from "~/components/hold/Info.vue";
import { queryHold } from "~/utils/queryHold.js";
import { useCopy } from "~/utils";
function copy() {
  useCopy(JSON.stringify(持仓JSON.value));
}
const tableRef = ref();
const stockCodeOptions = computed(() => {
  let list = Object.keys(stock_show_name_map);
  list.sort(function (a, b) {
    return stock_sort_map[a] - stock_sort_map[b];
  });
  return list.map((code) => ({
    value: code,
    label: stock_show_name_map[code],
  }));
});
const stockCode = ref(stockCodeOptions.value[0].value);
const deadline_list = [
  "20250924",
  "20251022",
  // "20251126",
  "20251224",
  // "20260128",
  // "20260225",
  "20260325",
];
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
const 持仓JSON = ref([]);
useFetch("/api/queryHoldJson").then((res) => {
  持仓JSON.value = res.data.value || [];
});
async function refresh() {
  tableData.loading = true;
  const holdData = await queryHold(持仓JSON.value, stockCode.value);
  tableData.data = holdData || [];
  tableData.loading = false;
}
function handleStockCodeChange() {
  tableRef.value.setScrollTop(0);
  setTimeout(() => {
    refresh();
  });
}
const 行权价RangeDict = reactive({ ...行权价_range_map });
const filteredTableData = computed(() => {
  return tableData.data.filter((el) => {
    if (el["正股代码"] !== stockCode.value) return false;
    if (el["期权"]?.includes("A")) return false;
    if (el._current || el._split) return true;
    return (
      el["行权价"] * 1000 >= 行权价RangeDict[stockCode.value][0] &&
      el["行权价"] * 1000 <= 行权价RangeDict[stockCode.value][1]
    );
  });
});

function getCellStyle({ column, row }) {
  if (column?.["property"] === "期权")
    return { backgroundColor: "rgba(255,255,255,0.01)", fontWeight: "600" };
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
