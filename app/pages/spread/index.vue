<template>
  <div v-loading="tableData.loading || globalLoading.value" class="max-md:w-[355%]">
    <div>
      <Nav />
      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
      </div>
    </div>

    <div>
      <el-form :model="formData" label-width="auto" label-suffix=":">
        <el-form-item label="到期日">
          <el-select v-model="formData.到期日List" multiple>
            <el-option v-for="date in deadline_list" :key="date" :label="date" :value="date" />
          </el-select>
        </el-form-item>
        <el-form-item label="价差">
          <el-select v-model="formData.价差List" multiple>
            <el-option v-for="diff in diff_list" :key="diff" :label="diff" :value="diff" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <div class="flex justify-center">
      <div class="mx-auto h-[calc(100vh-200px)] max-md:h-[calc(355vh-200px)] max-md:w-[255vw]">
        <el-table :data="filteredTableData" style="width: 100%" size="small" border height="100%" :highlight-current-row="false" :row-style="getRowStyle" :cell-style="getCellStyle" ref="tableRef">
          <el-table-column v-for="{ label, type, width, diff } in columns" :key="type + label + diff" :prop="type + label + diff" align="center" :width="getColumnWidth(label)">
            <template #header>
              <div v-if="type" :style="getHeaderStyle(diff, dayjs(label, 'YYYY-MM-DD').diff(dayjs(), 'days') + 1)">
                <div>{{ type }}{{ dayjs(label, "YYYY-MM-DD").format("M月") }}</div>
                <div>({{ dayjs(label, "YYYY-MM-DD").diff(dayjs(), "days") + 1 }})</div>
                <div>{{ diff }}</div>
              </div>
              <div v-else>
                {{ label }}
              </div>
            </template>
            <template #default="{ row }" v-if="label === '期权'">
              <Center :row="row" />
            </template>
            <template #default="{ row }" v-if="label !== '期权'">
              <Info :row="row" :isCall="type === 'C'" :date="label" :tiledData="tableData.tiledData" :combo_list="tableData.combo_list" :diffValue="diff" :mode="mode" />
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
import _ from "lodash";
import Center from "./components/Center.vue";
import Info from "./components/Info.vue";
import { querySpread } from "~/utils/querySpread.js";
import { getColorSplitHander } from "~/utils/color";
import { useGlobal } from "~/stores/useGlobal.js";

const { globalLoading, isMobile } = useGlobal();
const diff_list = [100, 200, 250, 300, 400, 500];
const formData = reactive({
  到期日List: [...deadline_list],
  价差List: [100],
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
const columns = computed(() => {
  const 价差List = _.sortBy([...formData.价差List]);
  const 到期日List = _.sortBy([...formData.到期日List]);
  return [
    ..._.flattenDeep(
      [...价差List].reverse().map((diff) =>
        [...到期日List].reverse().map((el) => ({
          type: "C",
          label: el,
          diff: diff,
        }))
      )
    ),
    {
      label: "期权",
      type: "",
      diff: "",
    },
    ..._.flattenDeep(
      价差List.map((diff) =>
        到期日List.map((el) => ({
          type: "P",
          label: el,
          diff: diff,
        }))
      )
    ),
  ];
});

function getColumnWidth(label) {
  if (isMobile) {
    return label === "期权" ? "80px" : "120px";
  }
  return label === "期权" ? "80px" : "130px";
}

const tableData = reactive({
  data: [],
  tiledData: [],
  loading: false,
});
async function handleQuery() {
  tableData.loading = true;
  const [holdData, combo_list, tiledData] = await querySpread(stockCode.value === "all" ? OPTIONS_MAP.map((el) => el.code) : [stockCode.value]);
  tableData.data = holdData || [];
  tableData.tiledData = tiledData;
  tableData.combo_list = combo_list;
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
    // if (el["正股代码"] !== stockCode.value) return false;
    if (el._current || el._split) return true;
    if (el["is旧期权"]) return false;
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
function getHeaderStyle(diff, day) {
  let bgColor;
  let percent = (day / (9 * 30)) * 100;
  if (diff === 100) {
    bgColor = getColorSplitHander("#ffffff", "#228B22")(percent);
  }
  if (diff === 200) {
    bgColor = getColorSplitHander("#ffffff", "#8B6914")(percent);
  }
  if (diff === 250) {
    bgColor = getColorSplitHander("#ffffff", "#0000CD")(percent);
  }
  return {
    backgroundColor: bgColor,
    color: "black",
    padding: "5px 0",
  };
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
