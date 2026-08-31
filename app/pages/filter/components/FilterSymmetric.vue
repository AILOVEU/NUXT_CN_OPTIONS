<template>
  <div v-loading="tableData.loading || globalLoading.value" :style="{ width: '100%' }">

    <div>
      <div class="flex items-center gap-[8px] px-[10px] pb-[6px]">
        <el-button size="small" @click="handleSingleRefresh"
          :disabled="!stockCode || stockCode === 'all'">单码无缓存刷新</el-button>
        <span class="text-[12px] text-gray-400">仅获取当前正股实时数据，不写入缓存</span>
      </div>
      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>

    <div class="h-[calc(100vh-100px)] max-md:h-[calc(220vh-200px)] flex justify-center">
      <SymmetricTable tableTitle="杠杆>20筛选" :symmetricData="filteredSymmetricData" :tiledData="filteredTiledData"
        :hide-filter-mode="true" />
    </div>
  </div>
</template>
<script setup>
import { OPTIONS_MAP } from "~/data";
import { filter是否保留行 } from "~/utils/options.js";
import { queryGrid } from "~/utils/queryGrid.js";
import { useGlobal } from "~/stores/useGlobal.js";
const { globalLoading } = useGlobal();

// formData ： 筛选条件
const props = defineProps(["checkIsChance", "refreshNonce"]);

const stockCodeOptions = computed(() => {
  let ops = OPTIONS_MAP.map((el) => ({
    value: el.code,
    label: el.showName,
  }));
  return [...ops, { value: "all", label: "全" }];
});
const stockCode = ref(OPTIONS_MAP[0].code);
const tableData = reactive({
  symmetricData: [],
  tiledData: [],
  comboList: [],
  loading: false,
});
async function handleQuery({ useCatch = true, saveData = true } = {}) {
  tableData.loading = true;
  const 正股代码List = saveData ? stockCode.value === "all" ? OPTIONS_MAP.map((el) => el.code) : [stockCode.value] : [stockCode.value];
  const [symmetricData, comboList, tiledData] = await queryGrid(正股代码List, { useCatch, saveData });
  tableData.tiledData = tiledData;
  tableData.symmetricData = symmetricData;
  tableData.comboList = comboList;
  tableData.loading = false;
}
handleQuery();
// 页面单码无缓存刷新：refreshNonce 变化时单次无缓存获取当前code数据且不写缓存，stockCode为空或'all'时无操作
function handleSingleRefresh() {
  if (!stockCode.value || stockCode.value === "all") return;
  handleQuery({ useCatch: false, saveData: false });
}
const filteredTiledData = computed(() => {
  return tableData.tiledData.map((el) => {
    if (!props.checkIsChance(el) && el["持仓"]) {
      return {
        ...el,
        _限制展示_有持仓: true,
      };
    }
    if (props.checkIsChance(el)) return el;
    return {
      ...el,
      _限制展示: true,
    };
  });
});
const filteredSymmetricData = computed(() => {
  const symmetricTableData = tableData.symmetricData.map((el) => {
    if (!el["行内期权名称List"]) return el;
    const 行内期权List = tableData.tiledData.filter((item) => el["行内期权名称List"].includes(item["期权名称"]));
    const is非限制展示 = 行内期权List.some((item) => props.checkIsChance(item));
    if (!is非限制展示) {
      return {
        ...el,
        _行限制展示: true,
      };
    }
    return el;
  });
  return filter是否保留行(symmetricTableData, tableData.tiledData, filteredTiledData.value);
});

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
