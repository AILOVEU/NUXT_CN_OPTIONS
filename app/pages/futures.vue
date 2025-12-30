<template>
  <el-table :data="filteredTableData" style="width: 100%" size="small" border stripe height="100%" :highlight-current-row="false" :row-style="getRowStyle" ref="tableRef">
    <el-table-column label="序" width="40" align="center" fixed="left" #default="{ $index }">
      <div class="text-[10px]">{{ $index + 1 }}</div>
    </el-table-column>
    <el-table-column label="品种" width="100" align="center" fixed="left" #default="{ row }">
      <div class="text-[10px]">{{ row["品种"] }}</div>
    </el-table-column>
    <el-table-column label="品种" width="100" align="center" fixed="left" #default="{ row }">
      <div class="text-[10px]">{{ row["简称"] }}</div>
    </el-table-column>
    <el-table-column label="交易所" width="100" align="center" #default="{ row }">
      <div class="text-[10px]">{{ row["交易所"] }}</div>
    </el-table-column>
    <!-- <el-table-column
      v-for="month in ['202602', '202603', '202604', '202605', '202606', '202607', '202608', '202609', '202610', '202611', '202612']"
      :label="month"
      width="50"
      align="center"
      #default="{ row }"
    >
      <div class="text-[10px] w-full h-full" :style="{ backgroundColor: row['期权月份']?.includes(month) ? '#AED6CF' : '' }">&nbsp;</div>
    </el-table-column> -->
    <el-table-column label="隐波" prop="隐波" width="100" align="center" #default="{ row }" sortable>
      <IvTag :隐波="row['隐波'] || 99" />
    </el-table-column>
    <el-table-column label="期货价格" prop="期货价格" width="100" align="center" #default="{ row }" sortable>
      <div class="text-[10px]">{{ row["期货价格"] }}</div>
    </el-table-column>
    <el-table-column label="比例" prop="比例" width="100" align="center" #default="{ row }" sortable>
      <div class="text-[10px]">{{ row["比例"] }}</div>
    </el-table-column>

    <el-table-column label="平值一手价" prop="平值一手价" width="100" align="center" #default="{ row }" sortable>
      <div class="text-[10px]">{{ row["平值一手价"] }}</div>
    </el-table-column>
    <el-table-column label="涨停平值一手盈利价" prop="涨停平值一手盈利价" width="100" align="center" #default="{ row }" sortable>
      <div class="text-[10px]">{{ row["涨停平值一手盈利价"] }}</div>
    </el-table-column>
  </el-table>
</template>
<script setup>
import { computed } from "vue";
import { futuresTableData } from "~/data/futures";
import IvTag from "~/components/tag/IvTag";

const filteredTableData = computed(() => {
  return futuresTableData.map((row) => {
    let 平值一手价 = row["比例"] * row["平值价格"] || 0;
    let 涨停平值一手盈利价 = Math.floor(0.1 * row["期货价格"] * row["比例"] * 0.5) || 0;
    return {
      ...row,
      平值一手价,
      涨停平值一手盈利价,
    };
  });
});
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
