<template>
  <div class="flex flex-col h-full">
    <div class="w-full pb-[12px] h-[30px]" v-if="!isMobile">
      <TabSelect :options="typeOptions" v-model="showTypeVal" />
    </div>
    <div class="w-full pb-[12px] h-[30px]">
      <TabSelectMult :options="columnOptions" v-model="columnVal" />
    </div>
    <div class="w-full pb-[12px] h-[30px]" v-if="showTypeVal !== '打印'">
      <TabSelectMult :options="indexOptions" v-model="indexVal" />
    </div>
    <div class="h-[calc(100%-120px)]">
      <Capture title="期权T型" ref="captureRef" :style="{ 'border-left': '10px solid #576a8f', 'border-right': '10px solid #576a8f' }">
        <div class="w-full flex justify-center items-center h-[28px] text-[24px] font-semibold text-[white] bg-[#576a8f]">{{ dayStr }}</div>
        <el-table :data="filteredTableData" size="small" border height="100%" :highlight-current-row="false" :row-style="getRowStyle" :cell-style="getCellStyle" ref="tableRef">
          <el-table-column v-for="{ label, type } in showColumns" :key="type + label" :prop="type + label" align="center" :width="getWrapperColumnWidth(label)">
            <template #header>
              <div v-if="type" class="leading-[1.2]">
                <div class="leading-[1.2]">{{ type }}{{ dayjs(label, "YYYY-MM-DD").format("M月") }}</div>
                <div class="leading-[1.2] text-rose-950">({{ dayjs(label, "YYYY-MM-DD").diff(dayjs(), "days") + 1 }})</div>
              </div>
              <div v-else class="leading-[1.2] flex items-center gap-[2px] justify-center cursor-pointer" @click="() => captureRef.download()">
                <div>{{ label }}</div>
                <el-button link>⬇</el-button>
              </div>
            </template>
            <template #default="{ row }" v-if="label === '期权'">
              <Center :row="row" />
            </template>
            <template #default="{ row }" v-if="label !== '期权'">
              <Info :row="row" :isCall="type === 'C'" :date="label" :tiledData="props.tiledData" :mode="props.mode" :indexVal="indexVal" :showTypeVal="showTypeVal" :innerWidth="getInnerColumnWidth()" />
            </template>
          </el-table-column>
        </el-table>
      </Capture>
    </div>
  </div>
</template>
<script setup>
import { OPTIONS_MAP, deadline_list } from "~/data";
import dayjs from "dayjs";
import Center from "./components/Center.vue";
import Info from "./components/Info.vue";
import { useGlobal } from "~/stores/useGlobal.js";
const { globalLoading, isMobile } = useGlobal();
const props = defineProps(["mode", "symmetricData", "tiledData"]);
const dayStr = computed(() => dayjs().format("YYYY-MM-DD HH:mm:ss") || " ");
const tableRef = ref();
const reversed_deadline_list = [...deadline_list].reverse();
const typeOptions = ["精简", "打印"].map((el) => ({ label: el, value: el }));
const showTypeVal = ref("精简");
const indexOptions = ["一手价", "打和点", "溢价率", "杠杆", "隐波", "Delta", "Vega", "Gamma", "单日损耗", "一手成本价", "仓位", "持仓量", "增仓量"].map((el) => ({ label: el, value: el }));
const indexVal = ref([]);
const columnVal = ref([]);
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
const columnOptions = computed(() => {
  return tableData.columns.map((el) => el.label).map((el) => ({ label: el, value: el }));
});
const showColumns = computed(() => {
  if (!columnVal.value.length) return tableData.columns;
  return tableData.columns.filter((el) => columnVal.value.includes(el.label));
});
function getInnerColumnWidth() {
  if (isMobile) return "90px";
  return showTypeVal.value === "打印" ? "380px" : "160px";
}
function getWrapperColumnWidth(label) {
  if (label === "期权") return "80px";
  if (isMobile) return "100px";
  return showTypeVal.value === "打印" ? "300px" : "172px";
}
const filteredTableData = computed(() => {
  return props.symmetricData.filter((el) => {
    if (el._current || el._split) return true;
    if (el["is保留行"]) return true;
    // if (el["正股代码"] !== stockCode.value) return false;
    if (el["is旧期权"]) return false;
    // if (el["千行权价"] < 5000 && el["千行权价"] % 100 !== 0) return false;
    return true;
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
  const 实值style = { border: "2px solid rgb(255, 220, 220)", background: "white" };
  const 虚值style = { border: "2px solid rgb(190, 220, 190)", background: "white" };
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

const captureRef = ref(null);
</script>
<style lang="less">
.el-table--small .cell {
  padding: 0 0px !important;
}
.el-table--small .el-table__cell {
  padding: 0px 0 !important;
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
