<template>
  <div v-loading="tableData.loading || globalLoading.value" class="max-md:w-[255%]">
    <div>
      <Nav @download="handleDownload" />
      <div class="w-full pb-[12px]">
        <div class="flex items-center gap-[8px] px-[10px] pb-[6px]">
          <el-button size="small" @click="handleSingleRefresh"
            :disabled="!stockCode || stockCode === 'all'">单码无缓存刷新</el-button>
          <span class="text-[12px] text-gray-400">仅获取当前正股实时数据，不写入缓存</span>
        </div>
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>

    <div class="h-[calc(100vh-80px)] overflow-y-auto max-md:h-[calc(220vh-85px)] flex justify-center">
      <div class="mx-auto min-w-0">
        <SymmetricTable v-for="(item, idx) in tableList" :key="idx" :ref="(el) => el && (itemRefs[idx] = el)"
          :showTypeVal="showTypeVal" :symmetricData="filterTableDataByStockCode(item)"
          :tiledData="tableData.tiledData" :formData="props.formData" />
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
const props = defineProps(["formData"]);

const stockCode = ref(OPTIONS_MAP[0].code);
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
// 单码无缓存刷新：仅获取当前正股实时数据（saveData=false 不写缓存），不更新filteredOptionsList以保留tab切换
async function handleSingleRefresh() {
  if (!stockCode.value || stockCode.value === "all") return;
  tableData.loading = true;
  const [symmetricData, comboList, tiledData] = await queryGrid([stockCode.value], { useCatch: false, saveData: false });
  tableData.symmetricData = symmetricData || [];
  tableData.tiledData = tiledData;
  tableData.comboList = comboList;
  tableData.loading = false;
}
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
