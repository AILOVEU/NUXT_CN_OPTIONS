<template>
  <div class="flex justify-between">
    <el-button @click="refresh">刷新</el-button>
    <div class="flex items-center">
      <a href="/">T型</a>
      <div class="w-[300px]"></div>
      <a href="/hold">持仓</a>
    </div>
  </div>
  <div class="w-full pb-[12px]">
    <el-radio-group v-model="stockName" size="small">
      <el-radio-button
        v-for="stock in stockNameList"
        :key="stock"
        :value="stock"
        @click="() => tableRef.setScrollTop(0)"
      >
        {{ stock }}
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
        v-for="{ label, type, width } in tableData.columns"
        :key="type + label"
        :prop="type + label"
        :width="width"
        align="center"
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
import { stock_name_map } from "~/data";
import dayjs from "dayjs";
import Center from "~/components/hold/Center.vue";
import Info from "~/components/hold/Info.vue";

const tableRef = ref();
const stockNameList = computed(() => {
  return Object.keys(stock_name_map);
});
const stockName = ref(stockNameList.value[0]);
const deadline_list = [
  "20250924",
  "20251022",
  "20251126",
  "20251224",
  "20260128",
  "20260225",
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
async function refresh() {
  tableData.loading = true;
  const res = await useFetch("/api/queryHold");
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
    if (el["期权"]?.includes("A")) return false;
    if (el._current || el._split) return true;
    return (
      el["行权价"] * 1000 >= 行权价RangeDict[stockName.value][0] &&
      el["行权价"] * 1000 <= 行权价RangeDict[stockName.value][1]
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
