<template>
  <div v-loading="tableData.loading" class="flex justify-center">
    <div class="mx-auto overflow-x-auto">
      <el-table :data="filteredTableData" size="small" border stripe height="100%" :highlight-current-row="false" ref="tableRef">
        <el-table-column label="序" width="40" align="center" fixed="left" #default="{ $index }">
          <div class="text-[10px]">{{ $index + 1 }}</div>
        </el-table-column>
        <el-table-column label="期权名称" prop="期权名称" width="150" sortable align="left" fixed="left" />
        <el-table-column #default="{ row }" label="一手价" prop="一手价" width="70" sortable align="right" />
        <el-table-column label="一手价格构成" align="center">
          <el-table-column label="时间" #default="{ row }" align="right" :minWidth="props.isCombo ? 140 : 80" prop="一手时间价" sortable>
            <CombinTableCell :value="row['一手时间价']" :showDiff="false" />
          </el-table-column>
          <el-table-column label="实值" #default="{ row }" align="right" :minWidth="props.isCombo ? 140 : 80" prop="一手内在价" sortable>
            <CombinTableCell :value="row['一手内在价']" :showDiff="false" />
          </el-table-column>
        </el-table-column>
        <el-table-column label="日盈亏" align="center" v-if="props.showHold">
          <el-table-column label="日总涨跌" align="right" prop="今日总涨跌" minWidth="110" sortable />
          <el-table-column label="日单手涨跌" align="right" prop="今日单手涨跌" minWidth="120" sortable />
        </el-table-column>
        <el-table-column label="总盈亏" align="center" v-if="props.showHold">
          <el-table-column label="一手价" :minWidth="props.isCombo ? 120 : 95" #default="{ row }" prop="一手价" align="right" sortable>
            <CombinTableCell :value="row['一手价']" :showDiff="true" />
          </el-table-column>
          <el-table-column label="成本价" :minWidth="props.isCombo ? 120 : 95" #default="{ row }" align="right" prop="一手成本价" sortable>
            <CombinTableCell :value="row['一手成本价']" :showDiff="true" />
          </el-table-column>
          <el-table-column label="一手盈亏" prop="一手盈亏" align="right" :minWidth="110" sortable />
          <el-table-column label="总盈亏" prop="总盈亏" align="right" :minWidth="95" sortable />
          <el-table-column label="收益率" :minWidth="95" #default="{ row }" align="right" prop="收益率" sortable v-if="!props.isCombo">
            <div :style="{ color: row['收益率'] > 0 ? 'red' : 'green' }">{{ row["收益率"] }}%</div>
          </el-table-column>
        </el-table-column>
        <el-table-column label="信息" align="center">
          <el-table-column label="正股" #default="{ row }" prop="正股代码" align="right" minWidth="95" sortable>
            {{ OPTIONS_MAP.find((el) => el.code === row["正股代码"])?.showName }}
          </el-table-column>
          <el-table-column label="沽购" #default="{ row }" prop="沽购" align="right" minWidth="80" sortable>
            <TagCallPut :value="row['沽购']" />
          </el-table-column>
          <el-table-column label="天数" prop="到期天数" align="right" minWidth="80" sortable />
        </el-table-column>

        <el-table-column label="持" #default="{ row }" prop="持仓" align="right" minWidth="70" sortable>
          {{ row["持仓"] || "" }}
        </el-table-column>

        <!-- <el-table-column label="基本信息" align="center">
          <el-table-column #default="{ row }" label="正股" prop="正股" width="130" sortable align="right" />
          <el-table-column #default="{ row }" label="沽购" prop="沽购" width="60" sortable align="right">
            <TagCallPut :value="row['沽购']" />
          </el-table-column>
          <el-table-column label="到期天数" prop="到期天数" width="80" sortable align="right" />
        </el-table-column> -->

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

          <el-table-column #default="{ row }" label="Vega" prop="Vega" width="90" sortable align="right">
            <TagVega :value="row['Vega']" />
          </el-table-column>
        </el-table-column>
        <el-table-column #default="{ row }" label="是否组合" prop="组合" width="60" sortable align="left">
          {{ row["组合"] ? "是" : "" }}
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script setup>
import _ from "lodash";
import { deadline_list, OPTIONS_MAP, 建议买入价, 最大建议买入时间价 } from "~/data";

const props = defineProps(["checkIsChance", "data", "isCombo", "showHold"]);
const tableData = reactive({
  tiledData: [],
  loading: false,
});
async function handleQuery() {
  if (props.data?.length) {
    tableData.tiledData = props.data;
    return;
  }
  tableData.loading = true;
  const [tiledData] = await get_http_data(OPTIONS_MAP.map((el) => el.code));
  tableData.tiledData = tiledData;
  tableData.loading = false;
}
handleQuery();

const filteredTableData = computed(() => {
  let filtered = (props.data?.length ? props.data : tableData.tiledData).filter((el) => props.checkIsChance(el));
  // 越大越好：Gamma、Delta（Gamma不会骗人）
  // 越小越好：一手价、隐波（价格是隐波的反应）
  filtered = _.sortBy(filtered, ["到期日", "沽购", "正股代码"]);
  return filtered;
});
</script>
<style lang="less"></style>
