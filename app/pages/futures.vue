<template>
  <el-table :data="futuresTableData" style="width: 100%" size="small" border stripe height="100%" :highlight-current-row="false" ref="tableRef">
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
    <el-table-column
      v-for="month in ['202602', '202603', '202604', '202605', '202606', '202607', '202608', '202609', '202610', '202611', '202612']"
      :label="month"
      width="50"
      align="center"
      #default="{ row }"
    >
      <div class="text-[10px]">{{ row["期权月份"]?.includes(month) ? "✔" : "" }}</div>
    </el-table-column>
  </el-table>
</template>
<script setup>
import { futuresTableData } from "~/data/futures";
</script>
