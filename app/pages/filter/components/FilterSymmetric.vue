<template>
  <div v-loading="tableData.loading || globalLoading.value" :style="{ width: '100%' }">
    <div>
      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>

    <div class="h-[calc(100vh-80px)] max-md:h-[calc(220vh-85px)] flex justify-center">
      <div class="mx-auto overflow-x-auto">
        <SymmetricTable :symmetricData="tableData.symmetricData" :tiledData="tableData.tiledData" mode="chance" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { OPTIONS_MAP, deadline_list } from "~/data";
import dayjs from "dayjs";
import { queryGrid } from "~/utils/queryGrid.js";
import { useGlobal } from "~/stores/useGlobal.js";
const { globalLoading, isMobile } = useGlobal();

// formData ： 筛选条件
const props = defineProps(["checkIsChance"]);

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
  symmetricData: [],
  tiledData: [],
  comboList: [],
  loading: false,
});
async function handleQuery() {
  tableData.loading = true;
  const [symmetricData, comboList, tiledData] = await queryGrid(stockCode.value === "all" ? OPTIONS_MAP.map((el) => el.code) : [stockCode.value]);
  tableData.symmetricData = symmetricData || [];
  tableData.tiledData = tiledData.map((el) => ({
    ...el,
    _isChance: props.checkIsChance(el),
  }));
  tableData.comboList = comboList;
  tableData.loading = false;
}
handleQuery();
function handleStockCodeChange() {
  setTimeout(() => {
    handleQuery();
  });
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
