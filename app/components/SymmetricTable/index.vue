<template>
  <el-table :data="filteredTableData" size="small" border height="100%" :highlight-current-row="false" :row-style="getRowStyle" :cell-style="getCellStyle" ref="tableRef">
    <el-table-column v-for="{ label, type } in tableData.columns" :key="type + label" :prop="type + label" align="center" :width="getColumnWidth(label)">
      <template #header>
        <div v-if="type" class="leading-[1.2]">
          <div class="leading-[1.2]">{{ type }}{{ dayjs(label, "YYYY-MM-DD").format("M月") }}</div>
          <div class="leading-[1.2]">({{ dayjs(label, "YYYY-MM-DD").diff(dayjs(), "days") + 1 }})</div>
        </div>
        <div v-else class="leading-[1.2]">
          {{ label }}
        </div>
      </template>
      <template #default="{ row }" v-if="label === '期权'">
        <Center :row="row" />
      </template>
      <template #default="{ row }" v-if="label !== '期权'">
        <Info :row="row" :isCall="type === 'C'" :date="label" :tiledData="props.tiledData" :mode="props.mode" />
      </template>
    </el-table-column>
  </el-table>
</template>
<script setup>
import { OPTIONS_MAP, deadline_list } from "~/data";
import dayjs from "dayjs";
import Center from "./components/Center.vue";
import Info from "./components/Info.vue";
import { queryGrid } from "~/utils/queryGrid.js";
import { useGlobal } from "~/stores/useGlobal.js";
const { globalLoading, isMobile } = useGlobal();
const props = defineProps(["mode", "symmetricData", "tiledData"]);

const tableRef = ref();
const reversed_deadline_list = [...deadline_list].reverse();
const tableData = reactive({
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
  if (isMobile) {
    return label === "期权" ? "80px" : "120px";
  }
  return label === "期权" ? "80px" : "161px";
}
const filteredTableData = computed(() => {
  return props.symmetricData.filter((el) => {
    if (el["is行内有持仓"]) return true;
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
  const 实值style = { border: "3px solid rgb(255, 220, 220)", background: "white" };
  const 虚值style = { border: "3px solid rgb(190, 220, 190)", background: "white" };
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
watch(
  () => props.symmetricData,
  () => {
    tableRef.value?.setScrollTop(0);
  },
  {
    immediate: true,
    deep: true,
  }
);
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
