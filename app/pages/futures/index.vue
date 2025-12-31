<template>
  <div class="max-md:w-[250%]" v-loading="tableData.loading">
    <Nav />
    <el-button @click="handleGetFutures">获取所有期货数据</el-button>
    <el-table :data="tableData.data" style="width: 100%" size="small" border>
      <el-table-column label="序" width="40" align="center" fixed="left" #default="{ $index }">
        <div class="text-[10px]">{{ $index + 1 }}</div>
      </el-table-column>
      <el-table-column :key="name" v-for="name in ['市场', '期货名称', '持仓量', '成交额', '成交量', '最新价', '涨跌额', '涨跌幅']" :label="name" :prop="name" width="120" align="center" #default="{ row }" sortable>
        <div class="text-[10px]">{{ row[name] }}</div>
      </el-table-column>
      <el-table-column :key="month" v-for="month in ['602', '603', '604', '605', '606', '607', '608', '609', '610', '611', '612']" :label="'2' + month" width="50" align="center" #default="{ row }">
        <div class="text-[10px] w-full h-full" :style="{ backgroundColor: row['月份List']?.some((el) => el.includes(month)) ? '#AED6CF' : '' }">&nbsp;</div>
      </el-table-column>
    </el-table>

    <el-table v-if="false" :data="filteredTableData" style="width: 100%" size="small" border stripe height="100%" :highlight-current-row="false" :row-style="getRowStyle" ref="tableRef">
      <el-table-column label="序" width="40" align="center" fixed="left" #default="{ $index }">
        <div class="text-[10px]">{{ $index + 1 }}</div>
      </el-table-column>
      <el-table-column label="品种" width="80" align="center" fixed="left" #default="{ row }">
        <div class="text-[10px]">{{ row["品种"] }}</div>
      </el-table-column>
      <el-table-column label="品种" width="100" align="center" #default="{ row }">
        <div class="text-[10px]">{{ row["简称"] }}</div>
      </el-table-column>
      <el-table-column label="交易所" width="100" align="center" #default="{ row }">
        <div class="text-[10px]">{{ row["交易所"] }}</div>
      </el-table-column>
      <el-table-column label="隐波" prop="隐波" width="100" align="center" #default="{ row }" sortable>
        <TagIv :隐波="row['隐波'] || 99" />
      </el-table-column>
      <el-table-column label="期货价格" prop="期货价格" width="100" align="center" #default="{ row }" sortable>
        <div class="text-[10px]">{{ row["期货价格"] }}</div>
      </el-table-column>
      <el-table-column label="比例" prop="比例" width="100" align="center" #default="{ row }" sortable>
        <div class="text-[10px]">{{ row["比例"] }}</div>
      </el-table-column>
      <el-table-column label="平值价格" prop="平值价格" width="100" align="center" #default="{ row }" sortable>
        <div class="text-[10px]">{{ row["平值价格"] }}</div>
      </el-table-column>
      <el-table-column label="平值价格百分比" prop="平值价格百分比" width="100" align="center" #default="{ row }" sortable>
        <div class="text-[10px]">{{ row["平值价格百分比"] }}%</div>
      </el-table-column>
      <el-table-column label="平值一手价" prop="平值一手价" width="100" align="center" #default="{ row }" sortable>
        <div class="text-[10px]">{{ row["平值一手价"] }}</div>
      </el-table-column>
      <el-table-column label="涨停平值一手盈利价" prop="涨停平值一手盈利价" width="100" align="center" #default="{ row }" sortable>
        <div class="text-[10px]">{{ row["涨停平值一手盈利价"] }}</div>
      </el-table-column>
    </el-table>
  </div>
</template>
<script setup>
import { computed, reactive } from "vue";
import { futuresTableData } from "~/data/futures";
import { get_all_http_data } from "~/utils/futures";
import _ from "lodash";
const filteredTableData = computed(() => {
  return futuresTableData.map((row) => {
    let 平值一手价 = row["比例"] * row["平值价格"];
    let 涨停平值一手盈利价 = Math.floor(0.1 * row["期货价格"] * row["比例"] * 0.5);
    let 平值价格百分比 = Math.floor((10000 * row["平值价格"]) / row["期货价格"]) / 100;
    return {
      ...row,
      平值一手价,
      涨停平值一手盈利价,
      平值价格百分比,
    };
  });
});
const tableData = reactive({
  columns: [],
  data: [],
  loading: false,
});
async function handleGetFutures() {
  tableData.loading = true;
  get_all_http_data()
    .then((res) => {
      tableData.data = res;
      tableData.columns = Object.keys(res[0]);
    })
    .finally(() => {
      tableData.loading = false;
    });
}
function getRowStyle({ row }) {
  return row.isPass
    ? {
        // color: "gray",
        backgroundColor: "#727D73",
      }
    : {};
}
</script>
<style>
.el-table--small .el-table__cell {
  padding: 0!impoartant;
}
</style>
