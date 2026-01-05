<template>
  <div v-loading="tableData.loading || globalLoading.value" :style="{ width: isMobile && mode === 'hold' ? '350%' : '100%' }">
    <!-- {{tableData.data}} -->
    <div>
      <Nav v-if="mode === 'hold'" />
      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>

    <div class="h-[calc(100vh-80px)] max-md:h-[calc(350vh-85px)] flex justify-center">
      <div class="mx-auto overflow-x-auto">
        <el-table :data="filteredTableData" size="small" border height="100%" :highlight-current-row="false" :row-style="getRowStyle" :cell-style="getCellStyle" ref="tableRef">
          <el-table-column v-for="{ label, type } in tableData.columns" :key="type + label" :prop="type + label" align="center" :width="getColumnWidth(label)">
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
              <Info :row="row" :isCall="type === 'C'" :date="label" :formData="props.formData" :mode="mode" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>
<script setup>
import { OPTIONS_MAP, deadline_list } from "~/data";
import dayjs from "dayjs";
import Center from "./components/Center.vue";
import Info from "./components/Info.vue";
import { queryHold } from "~/utils/queryHold.js";
import { useGlobal } from "~/stores/useGlobal.js";
const { globalLoading, isMobile } = useGlobal();

const props = defineProps(["mode", "formData"]);

const mode = computed(() => {
  return props.mode || "hold";
});

const tableRef = ref();
const stockCodeOptions = computed(() => {
  let ops = OPTIONS_MAP.map((el) => ({
    value: el.code,
    label: el.showName,
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
function getColumnWidth(label) {
  if (isMobile.value) {
    return label === "期权" ? "80px" : "120px";
  }
  return label === "期权" ? "80px" : "161px";
}
async function handleQuery() {
  tableData.loading = true;
  const holdData = await queryHold(stockCode.value === "all" ? OPTIONS_MAP.map((el) => el.code) : [stockCode.value]);
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
const filteredTableData = computed(() => {
  return tableData.data.filter((el) => {
    if (el["_持仓"] && mode.value === "hold") return true;
    if (el._current || el._split) return true;
    // if (el["正股代码"] !== stockCode.value) return false;
    if (el["is旧期权"]) return false;
    if (el["千行权价"] < 5000 && el["千行权价"] % 100 !== 0) return false;
    const targetRangeArr = OPTIONS_MAP.find((item) => item.code === el["正股代码"]).行权价Range;
    return el["千行权价"] >= targetRangeArr[0] && el["千行权价"] <= targetRangeArr[1];
  });
});

function getCellStyle({ column, row }) {
  if (row["_split"] || row["_current"]) return {};
  if (column?.["property"] === "期权") return { backgroundColor: "#CBDCEB", fontWeight: "600", border: "1px solid white" };
  // 红 | 绿
  // -------
  // 绿 | 红
  const 实值style = { border: "3px solid rgb(255, 220, 220)" };
  const 虚值style = { border: "3px solid rgb(190, 220, 190)" };
  if (row["行权价"] > row["正股价格"]) {
    return column?.["property"]?.includes("C") ? 虚值style : 实值style;
  } else {
    return column?.["property"]?.includes("C") ? 实值style : 虚值style;
  }
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
