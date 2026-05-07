<template>
  <div class="flex flex-col h-full">
    <div class="w-full pb-[12px] h-[30px]">
      <TabSelect :options="typeOptions" v-model="showTypeVal" />
    </div>
    <div class="w-full pb-[12px] h-[30px]">
      <TabSelectMult :options="columnOptions" v-model="columnVal" />
    </div>
    <div class="w-full pb-[12px] h-[30px]">
      <TabSelectMult :options="indexOptions" v-model="indexVal" />
    </div>
    <div class="h-[calc(100%-35px)] px-[5px]" ref="captureRef">
      <el-table :data="filteredTableData" size="small" border height="100%" :highlight-current-row="false" :row-style="getRowStyle" :cell-style="getCellStyle" ref="tableRef">
        <el-table-column v-for="{ label, type } in showColumns" :key="type + label" :prop="type + label" align="center" :width="getColumnWidth(label)">
          <template #header>
            <div v-if="type" class="leading-[1.2]">
              <div class="leading-[1.2]">{{ type }}{{ dayjs(label, "YYYY-MM-DD").format("M月") }}</div>
              <div class="leading-[1.2] text-rose-950">({{ dayjs(label, "YYYY-MM-DD").diff(dayjs(), "days") + 1 }})</div>
            </div>
            <div v-else class="leading-[1.2] flex items-center gap-[2px] justify-center cursor-pointer" @click="download">
              <div>{{ label }}</div>
              <el-button link>⬇</el-button>
            </div>
          </template>
          <template #default="{ row }" v-if="label === '期权'">
            <Center :row="row" />
          </template>
          <template #default="{ row }" v-if="label !== '期权'">
            <Info :row="row" :isCall="type === 'C'" :date="label" :tiledData="props.tiledData" :mode="props.mode" :indexVal="indexVal" :showTypeVal="showTypeVal" :width="getInfoColumnWidth()" />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup>
import { OPTIONS_MAP, deadline_list } from "~/data";
import dayjs from "dayjs";
import Center from "./components/Center.vue";
import Info from "./components/Info.vue";
import { queryGrid } from "~/utils/queryGrid.js";
import { useGlobal } from "~/stores/useGlobal.js";
const { globalLoading, isMobile } = useGlobal();
const props = defineProps(["mode", "symmetricData", "tiledData", "onlyShowHold"]);

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
function getInfoColumnWidth() {
  return showTypeVal.value === "打印" ? "300px" : "152px";
}
function getColumnWidth(label) {
  if (label === "期权") return "80px";
  if (isMobile) return "120px";
  return showTypeVal.value === "打印" ? "300px" : "169px";
}
const filteredTableData = computed(() => {
  return props.symmetricData.filter((el) => {
    if (el._current || el._split) return true;
    if (props.onlyShowHold && !el["is行内有持仓"]) return false;
    if (el["is行内有持仓"]) return true;
    // if (el["正股代码"] !== stockCode.value) return false;
    if (el["is旧期权"]) return false;
    if (el["千行权价"] < 5000 && el["千行权价"] % 100 !== 0) return false;
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

const todayStr = computed(() => `(${dayjs().format("YYYY-MM-DD")})`);
const captureRef = ref(null);
async function download() {
  // 服务端直接返回
  if (process.server) return;

  // 动态引入（避免服务端打包报错）
  const html2canvas = (await import("html2canvas")).default;

  const el = captureRef.value;
  if (!el) return;

  try {
    const canvas = await html2canvas(el, {
      scale: 2, // 清晰度
      useCORS: true, // 跨域图片
      backgroundColor: "#ffffff",
      logging: false,
    });

    // 转成图片并下载
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `T型报价图${todayStr.value}.png`;
    link.click();
  } catch (e) {
    console.error("截图失败", e);
  }
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
