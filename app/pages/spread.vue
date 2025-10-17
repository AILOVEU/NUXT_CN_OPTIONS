<template>
  <div v-loading="tableData.loading">
    <!-- 顶部 -->
    <el-affix :offset="0">
      <div class="flex justify-between text-[12px] mb-[12px]">
        <el-button @click="handleQuery" class="flex-1" type="primary">
          刷新
        </el-button>
        <Nav />
      </div>
    </el-affix>

    <div class="w-full pb-[12px]">
      <TabSelect
        :options="stockCodeOptions"
        v-model="stockCode"
        @click="handleStockCodeChange"
      />
    </div>
  </div>

  <div>
    <el-form
      :model="formData"
      label-width="auto"
      style="max-width: 600px"
      label-suffix=":"
    >
      <el-form-item label="到期日">
        <el-select v-model="formData.到期日List" multiple>
          <el-option
            v-for="date in deadline_list"
            :key="date"
            :label="date"
            :value="date"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="价差">
        <el-select v-model="formData.价差List" multiple>
          <el-option
            v-for="diff in diff_list"
            :key="diff"
            :label="diff"
            :value="diff"
          />
        </el-select>
      </el-form-item>
    </el-form>
  </div>

  <div class="w-full h-[calc(100vh-100px)]">
    <el-table
      :data="filteredTableData"
      style="width: 100%"
      size="small"
      border
      height="100%"
      :highlight-current-row="false"
      :row-style="getRowStyle"
      :cell-style="getCellStyle"
      ref="tableRef"
    >
      <el-table-column
        v-for="{ label, type, width, diff } in columns"
        :key="type + label + diff"
        :prop="type + label + diff"
        align="center"
        width="150px"
      >
        <template #header>
          <div
            v-if="type"
            :style="
              getHeaderStyle(
                diff,
                dayjs(label, 'YYYYMMDD').diff(dayjs(), 'days') + 1
              )
            "
          >
            <div>{{ type }}{{ dayjs(label, "YYYYMMDD").format("M月") }}</div>
            <div>
              ({{ dayjs(label, "YYYYMMDD").diff(dayjs(), "days") + 1 }})
            </div>
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
          <Info
            :row="row"
            :isCall="type === 'C'"
            :date="label"
            :tiledData="tableData.tiledData"
            :combo_list="tableData.combo_list"
            :diffValue="diff"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script setup>
import {
  stock_show_name_map,
  stock_sort_map,
  行权价_range_map,
  deadline_list,
} from "~/data";
import dayjs from "dayjs";
import _ from "lodash";
import Center from "~/components/spread/Center.vue";
import Info from "~/components/spread/Info.vue";
import { querySpread } from "~/utils/querySpread.js";
import { ElMessage } from "element-plus";
import { useCopy, getColorSplitHander } from "~/utils";
import { useHttpStore } from "~/stores/useHttpStore.js";
const { httpStore, setHttpStore } = useHttpStore();
function copy() {
  useCopy(JSON.stringify(持仓JSON.value));
}
const diff_list = [100, 200, 250, 300, 400, 500];
const formData = reactive({
  到期日List: [...deadline_list].filter((el, index) => index),
  价差List: [100, 200, 250],
});

const tableRef = ref();
const stockCodeOptions = computed(() => {
  let list = Object.keys(stock_show_name_map);
  list.sort(function (a, b) {
    return stock_sort_map[a] - stock_sort_map[b];
  });
  return list.map((code) => ({
    value: code,
    label: stock_show_name_map[code],
  }));
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
const tableData = reactive({
  data: [],
  tiledData: [],
  loading: false,
});
const 持仓JSON = ref([]);
useFetch("/api/queryHoldJson").then((res) => {
  持仓JSON.value = res.data.value || [];
});
async function handleQuery() {
  // if (httpStore.value) {
  //   ElMessage("网络请求，使用缓存代替");
  //   const [holdData, tiledData] = httpStore.value;
  //   tableData.data = holdData || [];
  //   tableData.tiledData = tiledData;
  //   return;
  // }
  tableData.loading = true;
  const [holdData, combo_list, tiledData] = await querySpread(持仓JSON.value, [
    stockCode.value,
  ]);
  tableData.data = holdData || [];
  tableData.tiledData = tiledData;
  console.log(
    "tiledData",
    Array.from(new Set(tiledData.map((el) => el["行权价"])))
  );
  tableData.combo_list = combo_list;
  // setHttpStore([holdData, tiledData]);
  tableData.loading = false;
}
function handleStockCodeChange() {
  tableRef.value.setScrollTop(0);
  setTimeout(() => {
    handleQuery();
  });
}
const 行权价RangeDict = reactive({ ...行权价_range_map });
const filteredTableData = computed(() => {
  return tableData.data.filter((el) => {
    if (el["正股代码"] !== stockCode.value) return false;
    if (el["期权"]?.includes("A")) return false;
    if (el._current || el._split) return true;
    return (
      el["行权价"] * 1000 >= 行权价RangeDict[stockCode.value][0] &&
      el["行权价"] * 1000 <= 行权价RangeDict[stockCode.value][1]
    );
  });
});

function getCellStyle({ column, row }) {
  if (column?.["property"] === "期权")
    return { backgroundColor: "rgba(150,150,150,0.1)", fontWeight: "600" };
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
