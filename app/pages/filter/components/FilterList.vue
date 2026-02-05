<template>
  <div v-loading="tableData.loading" class="h-[calc(100vh-168px)] max-md:h-[calc(200vh-300px)] mb-[100px] flex justify-center">
    <div class="mx-auto overflow-x-auto">
      <el-table :data="filteredTableData" size="small" border stripe height="100%" :highlight-current-row="false" ref="tableRef">
        <el-table-column label="序" width="40" align="center" fixed="left" #default="{ $index }">
          <div class="text-[10px]">{{ $index + 1 }}</div>
        </el-table-column>
        <el-table-column label="期权名称" prop="期权名称" width="150" sortable align="left" fixed="left" />

        <el-table-column #default="{ row }" label="一手价" prop="一手价" width="70" sortable align="right" />
        <el-table-column #default="{ row }" label="一手涨跌价" prop="一手涨跌价" width="100" sortable align="right" />

        <el-table-column label="基本信息" align="center">
          <el-table-column #default="{ row }" label="正股" prop="正股" width="130" sortable align="right" />
          <el-table-column #default="{ row }" label="沽购" prop="沽购" width="60" sortable align="right">
            <TagCallPut :value="row['沽购']" />
          </el-table-column>
          <el-table-column label="到期天数" prop="到期天数" width="80" sortable align="right" />
        </el-table-column>

        <el-table-column label="溢价信息" align="center">
          <el-table-column #default="{ row }" label="打和点" prop="打和点" width="70" sortable align="right">
            {{ row["打和点"].toFixed(4) }}
          </el-table-column>

          <el-table-column label="正股价格" prop="正股价格" width="80" sortable align="right" />
          <el-table-column label="行权价" prop="千行权价" width="80" sortable align="right" />
          <el-table-column #default="{ row }" label="溢价率" prop="溢价率" width="75" sortable align="right"> <TagPremium :value="row['溢价率']" /> </el-table-column>
          <el-table-column #default="{ row }" label="杠杆" prop="杠杆" width="75" sortable align="right"><TagLeverage :value="row['杠杆']" /> </el-table-column>
        </el-table-column>

        <el-table-column label="希腊字母" align="center">
          <el-table-column #default="{ row }" label="隐波" prop="隐波" width="75" sortable align="right">
            <TagIv :value="row['隐波']" />
          </el-table-column>
          <el-table-column #default="{ row }" label="Delta" prop="Delta" width="85" sortable align="right">
            <TagDelta :value="row['Delta']" />
          </el-table-column>

          <el-table-column #default="{ row }" label="Gamma" prop="Gamma" width="90" sortable align="right">
            <TagGamma :value="row['Gamma']" />
          </el-table-column>

          <el-table-column #default="{ row }" label="Gamma" prop="Gamma" width="90" sortable align="right">
            <TagVega :value="row['Vega']" />
          </el-table-column>
        </el-table-column>

        <el-table-column label="持仓信息" align="center">
          <el-table-column #default="{ row }" label="持仓" prop="持仓" width="60" sortable align="right">
            {{ row["持仓"] || "" }}
          </el-table-column>
          <el-table-column #default="{ row }" label="组合" prop="组合" width="60" sortable align="left">
            {{ row["组合"] ? "是" : "" }}
          </el-table-column>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup>
import _ from "lodash";
import { deadline_list, OPTIONS_MAP, 建议买入价, 最大建议买入时间价 } from "~/data";

const props = defineProps(["checkIsChance"]);
const tableData = reactive({
  tiledData: [],
  loading: false,
});
async function handleQuery() {
  tableData.loading = true;
  const [tiledData] = await get_http_data(OPTIONS_MAP.map((el) => el.code));
  tableData.tiledData = tiledData;
  tableData.loading = false;
}
handleQuery();

const filteredTableData = computed(() => {
  let filtered = tableData.tiledData.filter((el) => props.checkIsChance(el));
  // 越大越好：Gamma、Delta（Gamma不会骗人）
  // 越小越好：一手价、隐波（价格是隐波的反应）
  filtered = _.sortBy(filtered, (row) => Math.abs(row["一手价"] / (row["Gamme"] * row["Delta"])));
  return filtered;
});
</script>
<style lang="less"></style>
