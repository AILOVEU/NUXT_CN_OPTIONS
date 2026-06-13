<template>
  <div v-loading="tableData.loading || globalLoading.value" :style="{ width: isMobile && mode === 'hold' ? '255%' : '100%' }">
    <div>
      <Nav v-if="mode === 'hold'" @download="handleDownload" />
      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>

    <div class="h-[calc(100vh-80px)] max-md:h-[calc(220vh-85px)] flex justify-center">
      <div class="mx-auto">
        <Capture v-for="(item, idx) in tableList" :key="idx" :ref="(el) => el && (itemRefs[idx] = el)" title="股指T型">
          <SymmetricTable :showTypeVal="showTypeVal" :symmetricData="filterTableDataByStockCode(item)" :tiledData="tableData.tiledData" :mode="mode" :formData="props.formData" />
        </Capture>
      </div>
    </div>
  </div>
</template>
<script setup>
import { OPTIONS_MAP, deadline_list } from "~/data";
import dayjs from "dayjs";
import { queryGrid } from "~/utils/queryGrid.js";
import { useGlobal } from "~/stores/useGlobal.js";
const showTypeVal = ref();
const { globalLoading, isMobile } = useGlobal();

// formData ： 筛选条件
const props = defineProps(["mode", "formData"]);

const mode = computed(() => {
  return props.mode || "hold";
});

const stockCode = ref("all");
const reversed_deadline_list = [...deadline_list].reverse();
const tableData = reactive({
  symmetricData: [],
  tiledData: [],
  comboList: [],
  loading: false,
  filteredOptionsList: [],
});
const stockCodeOptions = computed(() => {
  let ops = tableData.filteredOptionsList.map((el) => ({
    value: el.code,
    label: el.showName,
  }));
  return [...ops, { value: "all", label: "全" }];
});
async function handleQuery() {
  tableData.loading = true;
  const [symmetricData, comboList, tiledData, filteredOptionsList] = await queryGrid(OPTIONS_MAP.map((el) => el.code));
  tableData.symmetricData = symmetricData || [];
  tableData.tiledData = tiledData;
  tableData.comboList = comboList;
  tableData.filteredOptionsList = filteredOptionsList;
  tableData.loading = false;
}
handleQuery();
function handleStockCodeChange() {
  tableList.value = [stockCode.value];
  // setTimeout(() => {
  //   handleQuery();
  // });
}
// 根据代码过滤表格数据
function filterTableDataByStockCode(code) {
  if (stockCode.value === "all") return tableData.symmetricData;
  return tableData.symmetricData.filter((el) => el["正股代码"] === code);
}

const itemRefs = ref([]);
const tableList = ref([stockCode.value]);
// 批量下载PDF：改用nextTick，重置ref，时序更稳定
async function handleDownload() {
  showTypeVal.value = "打印";
  // 清空旧引用，防止脏数据
  itemRefs.value = [];
  // 赋值全量列表
  tableList.value = OPTIONS_MAP.map((el) => el.code);
  stockCode.value = "";
  // 等待DOM&组件完全渲染完成
  await nextTick();

  // 导出base64并下载PDF
  const base64List = await Promise.all(itemRefs.value.map((c) => c.getDataURL()));
  await downloadPrintPdf(base64List);

  // 切回当前选中项
  tableList.value = [stockCode.value];
  showTypeVal.value = "";
  stockCode.value = "all";
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
