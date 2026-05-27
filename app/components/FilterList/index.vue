<template>
  <div v-loading="tableData.loading" class="flex justify-center">
    <div class="mx-auto overflow-x-auto border-[5px] border-[#576a8f]">
      <Capture title="期权列表" ref="captureRef">
        <el-table :data="filteredTableData" size="small" border stripe height="100%" :highlight-current-row="false" ref="tableRef" show-summary :summary-method="getSummary">
          <el-table-column label="序" width="40" align="center" fixed="left">
            <template #header>
              <div class="leading-[1.2] flex items-center gap-[2px] justify-center cursor-pointer" @click="() => captureRef.download()">
                <div>序</div>
                <el-button link>⬇</el-button>
              </div>
            </template>
            <template #default="{ row, $index }">
              <span class="text-[10px] leading-[1.2]">{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="期权名称" prop="期权名称" width="140" sortable align="left" fixed="left" />
          <el-table-column label="评分" prop="评分" width="80" sortable align="left" fixed="left" />
          <el-table-column #default="{ row }" label="一手价" prop="一手价" width="60" sortable align="right">
            <TagPrice :value="row['一手价']" />
          </el-table-column>
          <el-table-column label="一手价格构成" align="center">
            <el-table-column label="时间" #default="{ row }" align="right" :width="props.isCombo ? 140 : 50" prop="一手时间价" sortable>
              <CombinTableCell :value="row['一手时间价']" :showDiff="false" />
            </el-table-column>
            <el-table-column label="实值" #default="{ row }" align="right" :width="props.isCombo ? 140 : 50" prop="一手内在价" sortable>
              <CombinTableCell :value="row['一手内在价']" :showDiff="false" />
            </el-table-column>
          </el-table-column>
          <el-table-column #default="{ row }" label="档位" align="right" prop="档位" width="67" sortable>
            <TagRealLevel :value="row['档位']" :档位名称="row['档位名称']" />
          </el-table-column>
          <el-table-column label="今盈亏" align="center">
            <el-table-column label="今总涨跌" v-if="props.showHold" align="right" prop="今日总涨跌" width="67" sortable />
            <el-table-column label="今每手涨跌" #default="{ row }" align="right" prop="一手涨跌价" width="90" sortable>
              <TagDiff :value="row['一手涨跌价']" :涨跌率="row['涨跌率']" />
            </el-table-column>
            <el-table-column label="单日总损耗" #default="{ row }" align="right" prop="单日总损耗" width="75" sortable>
              <TagAllTheta :value="row['单日总损耗']" v-if="!isNaN(row['单日总损耗'])" />
              <div v-else></div>
            </el-table-column>
          </el-table-column>
          <el-table-column label="总盈亏" align="center" v-if="props.showHold">
            <el-table-column label="一手价" :width="props.isCombo ? 120 : 60" #default="{ row }" prop="一手价" align="right" sortable>
              <CombinTableCell :value="row['一手价']" :showDiff="true" />
            </el-table-column>
            <el-table-column label="成本价" :width="props.isCombo ? 120 : 60" #default="{ row }" align="right" prop="一手成本价" sortable>
              <CombinTableCell :value="row['一手成本价']" :showDiff="true" />
            </el-table-column>
            <el-table-column label="一手盈亏" prop="一手盈亏" align="right" :width="65" sortable />
            <el-table-column label="总盈亏" prop="总盈亏" align="right" :width="60" sortable />
            <el-table-column label="仓位" :width="120" #default="{ row }" align="right" prop="仓位" sortable v-if="!props.isCombo">
              <TagHoldPercent :value="row['仓位']" :仓位占比="row['仓位率']" />
            </el-table-column>
            <el-table-column label="收益率" :width="60" #default="{ row }" align="right" prop="收益率" sortable v-if="!props.isCombo">
              <span :style="{ color: row['收益率'] > 0 ? 'red' : 'green' }">{{ row["收益率"] }}%</span>
            </el-table-column>
          </el-table-column>
          <el-table-column label="信息" align="center">
            <el-table-column label="正股" #default="{ row }" prop="正股代码" align="right" width="70" sortable>
              {{ OPTIONS_MAP.find((el) => el.code === row["正股代码"])?.showName }}
            </el-table-column>
            <el-table-column label="沽购" #default="{ row }" prop="沽购" align="right" width="45" sortable>
              <TagCallPut :value="row['沽购']" />
            </el-table-column>
            <el-table-column label="天数" prop="到期天数" align="right" width="45" sortable />
          </el-table-column>

          <el-table-column label="持" #default="{ row }" prop="持仓" align="right" width="30" sortable>
            <TagHold :value="row['持仓'] || ''" />
          </el-table-column>
          <!-- <el-table-column label="基本信息" align="center">
          <el-table-column #default="{ row }" label="正股" prop="正股" width="130" sortable align="right" />
          <el-table-column #default="{ row }" label="沽购" prop="沽购" width="60" sortable align="right">
            <TagCallPut :value="row['沽购']" />
          </el-table-column>
          <el-table-column label="到期天数" prop="到期天数" width="80" sortable align="right" />
        </el-table-column> -->

          <el-table-column label="溢价信息" align="center">
            <el-table-column #default="{ row }" label="打和点" prop="打和点" width="55" sortable align="right">
              {{ row["打和点"].toFixed(4) }}
            </el-table-column>

            <el-table-column label="正股价" prop="正股价格" width="55" sortable align="right" />
            <el-table-column label="行权价" prop="千行权价" width="55" sortable align="right" />
            <el-table-column #default="{ row }" label="溢价率" prop="溢价率" width="65" sortable align="right"> <TagPremium :value="row['溢价率']" /> </el-table-column>
            <el-table-column #default="{ row }" label="杠杆" prop="杠杆" width="60" sortable align="right"><TagLeverage :value="row['杠杆']" /> </el-table-column>
          </el-table-column>

          <el-table-column label="希腊字母" align="center">
            <el-table-column #default="{ row }" label="隐波" prop="隐波" width="60" sortable align="right">
              <TagIv :value="row['隐波']" />
            </el-table-column>
            <el-table-column #default="{ row }" label="Delta" prop="Delta" width="70" sortable align="right">
              <TagDelta :value="row['Delta']" />
            </el-table-column>

            <el-table-column #default="{ row }" label="Gamma" prop="Gamma" width="65" sortable align="right">
              <TagGamma :value="row['Gamma']" />
            </el-table-column>

            <el-table-column #default="{ row }" label="Vega" prop="Vega" width="60" sortable align="right">
              <TagVega :value="row['Vega']" />
            </el-table-column>
          </el-table-column>
          <el-table-column #default="{ row }" label="组合?" prop="组合" width="45" sortable align="left">
            {{ row["组合"] ? "是" : "" }}
          </el-table-column>
        </el-table>
      </Capture>
    </div>
  </div>
</template>
<script setup>
import _ from "lodash";
import { deadline_list, OPTIONS_MAP } from "~/data";
import dayjs from "dayjs";

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
  if (props.showHold) {
    filtered = _.orderBy(filtered, ["仓位", "到期日", "沽购", "正股代码"], ["desc", "asc", "asc", "asc"]);
  } else {
    filtered = _.orderBy(filtered, ["杠杆"], ["asc"]);
  }
  return filtered;
});
// ==========================================

// 通用合计方法（永远不用改）
const getSummary = ({ columns, data }) => {
  const summaryProps = ["今日总涨跌", "单日总损耗", "总盈亏", "仓位", "持仓"].filter((el) => props.showHold && el === "单日总损耗" );
  return columns.map((col, index) => {
    // 第一列显示“合计”
    if (index === 0) return "合计";

    // 当前列在合计列表里 → 求和
    if (summaryProps.includes(col.property)) {
      return data.reduce((sum, row) => sum + (row[col.property] || 0), 0);
    }

    // 不在列表 → 空
    return "";
  });
};

const captureRef = ref(null);
</script>
<style scoped>
/* 给你的 table 加个自定义 class，避免污染全局样式，比如 .my-table */
:deep(.el-table th .cell) {
  white-space: nowrap; /* 文字强制不换行 */
  /* display: flex;
  align-items: center;
  justify-content: flex-start; */
}

/* 把排序图标改成绝对定位，不占用正常流宽度 */
:deep(.el-table th .cell .el-table__sort) {
  /* position: absolute;
  right: 8px; /* 距离右侧的距离，根据需要调整
  top: 50%;
  transform: translateY(-50%); */
}

/* 给文字加右边距，避免被图标挡住 */
:deep(.el-table th .cell .el-table__cell-label) {
  /* padding-right: 30px; //给排序图标留出空间 */
}

:deep(.el-table__header-wrapper) {
  /* 表头整体的边框 */
  .el-table__header {
    .el-table__cell {
      /* 加粗所有边框，你可以根据需要调整粗细和颜色 */
      /* border-width: 1px !important; */
      border-color: #333 !important;
      font-size: 10px;
      white-space: nowrap;
      /* border-style: solid; */
    }
    /* 表头底部边框单独加粗，让表头和内容区分更明显 */
    .el-table__row:last-child .el-table__cell {
      /* border-bottom-width: 1px !important; */
    }
  }
}
:deep(.el-table__header .el-table__cell .cell) {
  /* 关键：取消文字截断和省略号 */
  text-overflow: clip !important;
}
</style>
