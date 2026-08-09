<template>
  <div v-loading="tableData.loading || globalLoading.value" class="max-md:w-[335%]">
    <div>
      <div class="w-full pb-[12px]">
        <TabSelect :options="stockCodeOptions" v-model="formData.stockCode" @click="handleStockCodeChange" />
      </div>
      <div class="w-full pb-[12px]">
        <TabSelectMult :options="deadline_list.map((el) => ({ label: el, value: el }))" v-model="formData.到期日List" />
      </div>
    </div>
    <div class="h-[calc(100vh-200px)] max-md:h-[calc(335vh-120px)] flex gap-2">
      <div class="flex-1 overflow-x-auto">
        <el-table :data="filteredTableData" style="width: 100%" size="small" border height="100%"
          :highlight-current-row="false" :row-style="getRowStyle" :cell-style="getCellStyle" ref="tableRef"
          @row-click="handleRowClick">
          <el-table-column #default="{ row }" align="center" width="100" label="C_合约" prop="C_合约">
            <Options :row="getRowTargetOption(row, 'C')" />
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="100" label="C_信息" prop="C_信息">
            <Info :row="getRowTargetOption(row, 'C')" />
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="C_持仓" prop="C_持仓">
            <Hold :row="getRowTargetOption(row, 'C')" />
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="70" label="C_交易" prop="C_交易">
            <template v-if="getRowTargetOption(row, 'C')?.['期权名称']">
              <div class="relative pb-[15px]">
                <div class="flex gap-[1px]">
                  <el-button size="small" :type="positionMap[getRowTargetOption(row, 'C')['期权名称']] > 0 ? 'danger' : ''"
                    :plain="(positionMap[getRowTargetOption(row, 'C')['期权名称']] || 0) <= 0"
                    class="!h-[18px] !text-[10px] !px-0 !w-full" @click.stop="handleTrade('C', 'buy', row)">
                    {{ positionMap[getRowTargetOption(row, 'C')['期权名称']] > 0 ? '买' + positionMap[getRowTargetOption(row,
                      'C')['期权名称']] : '买' }}
                  </el-button>
                  <el-button size="small" :type="positionMap[getRowTargetOption(row, 'C')['期权名称']] < 0 ? 'success' : ''"
                    :plain="(positionMap[getRowTargetOption(row, 'C')['期权名称']] || 0) >= 0"
                    class="!h-[18px] !text-[10px] !px-0 !w-full" @click.stop="handleTrade('C', 'sell', row)">
                    {{ positionMap[getRowTargetOption(row, 'C')['期权名称']] < 0 ? '卖' +
                      Math.abs(positionMap[getRowTargetOption(row, 'C')['期权名称']]) : '卖' }}
                  </el-button>
                </div>
                <el-button v-if="positionMap[getRowTargetOption(row, 'C')['期权名称']]"
                  size="small" type="info" plain
                  class="absolute left-0 right-0 bottom-0 !h-[14px] !text-[9px] !px-0 w-full"
                  @click.stop="handleRemoveFromTable('C', row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="80" label="期权" prop="期权">
            <Center :row="row" />
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="70" label="P_交易" prop="P_交易">
            <template v-if="getRowTargetOption(row, 'P')?.['期权名称']">
              <div class="relative pb-[15px]">
                <div class="flex gap-[1px]">
                  <el-button size="small" :type="positionMap[getRowTargetOption(row, 'P')['期权名称']] < 0 ? 'success' : ''"
                    :plain="(positionMap[getRowTargetOption(row, 'P')['期权名称']] || 0) >= 0"
                    class="!h-[18px] !text-[10px] !px-0 !w-full" @click.stop="handleTrade('P', 'sell', row)">
                    {{ positionMap[getRowTargetOption(row, 'P')['期权名称']] < 0 ? '卖' +
                      Math.abs(positionMap[getRowTargetOption(row, 'P')['期权名称']]) : '卖' }}
                  </el-button>
                  <el-button size="small"
                    :type="positionMap[getRowTargetOption(row, 'P')['期权名称']] > 0 ? 'danger' : ''"
                    :plain="(positionMap[getRowTargetOption(row, 'P')['期权名称']] || 0) <= 0"
                    class="!h-[18px] !text-[10px] !px-0 !w-full" @click.stop="handleTrade('P', 'buy', row)">
                    {{ positionMap[getRowTargetOption(row, 'P')['期权名称']] > 0 ? '买' +
                      positionMap[getRowTargetOption(row, 'P')['期权名称']] : '买' }}
                  </el-button>
                </div>
                <el-button v-if="positionMap[getRowTargetOption(row, 'P')['期权名称']]"
                  size="small" type="info" plain
                  class="absolute left-0 right-0 bottom-0 !h-[14px] !text-[9px] !px-0 w-full"
                  @click.stop="handleRemoveFromTable('P', row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="P_持仓" prop="P_持仓">
            <Hold :row="getRowTargetOption(row, 'P')" />
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="100" label="P_信息" prop="P_信息">
            <Info :row="getRowTargetOption(row, 'P')" />
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="100" label="P_合约" prop="P_合约">
            <Options :row="getRowTargetOption(row, 'P')" />
          </el-table-column>
        </el-table>
      </div>
      <!-- 右侧策略盈亏分析 -->
      <div class="w-[400px] flex-shrink-0 overflow-y-auto">
        <StrategyAnalyzer :positions="positionList" :spotPrice="currentSpotPrice" :multiplier="100"
          @removePosition="removePosition" @clearAll="clearAllPositions" />
      </div>
    </div>
  </div>
</template>
<script setup>
import Center from "./components/Center.vue";
import Info from "./components/Info.vue";
import Options from "./components/Options.vue";
import Hold from "../t/components/Hold.vue";
import StrategyAnalyzer from "../t/components/StrategyAnalyzer.vue";
import { queryStockIndexRow } from "~/utils/queryStockIndexRow.js";
import { useGlobal } from "~/stores/useGlobal.js";
import { STOCK_INDEX_OPTIONS_MAP, STOCK_INDEX_DAY_MAP } from "~/data";
import dayjs from "dayjs";

const { globalLoading } = useGlobal();
const tableRef = ref();

const deadline_list = Object.values(STOCK_INDEX_DAY_MAP);
const stockCodeOptions = computed(() => {
  let ops = STOCK_INDEX_OPTIONS_MAP.map((el) => ({
    value: el.code,
    label: el.code,
  }));
  return [...ops, { value: "all", label: "全" }];
});
const formData = reactive({
  到期日List: [...deadline_list],
  stockCode: stockCodeOptions.value[0].value
});
const tableData = reactive({
  data: [],
  tiledData: [],
  loading: false,
});
async function handleQuery() {
  tableData.loading = true;
  const [tData, tiledData] = await queryStockIndexRow(
    formData.stockCode === "all" ? STOCK_INDEX_OPTIONS_MAP.map((el) => el.code) : [formData.stockCode],
    true
  );
  tableData.data = (tData || []);
  tableData.tiledData = tiledData;
  tableData.loading = false;
}
function getRowTargetOption(row, callType) {
  // row
  // C期权名称: "沪深300购8月4900"
  // P期权名称: "沪深300沽8月4900"
  // 到期日: "2026-08-21"
  // 正股代码: "沪深300"
  // 正股价格: 4000
  // 行权价: 4900
  if (!row["C期权名称"]) return row;
  if (callType === "C") return tableData.tiledData.find((el) => el["期权名称"] === row["C期权名称"]) || {};
  if (callType === "P") return tableData.tiledData.find((el) => el["期权名称"] === row["P期权名称"]) || {};
  return row;
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
    if (!formData.到期日List.includes(el["到期日"])) return false;
    if (el["is保留行"]) return true;
    if (el['_current'] || el['_split']) return true;
    return true;
  });
});

function getCellStyle({ column, row }) {
  if (row?.["_current"]) return { backgroundColor: "#f5f7fa" };
  if (row?.["_split"]) return { backgroundColor: "black", color: "black" };
  if (column?.["property"] === "期权") return { backgroundColor: "#CBDCEB", fontWeight: "600", border: "1px solid white" };
  return { backgroundColor: "white" };
}
function getRowStyle({ row }) {
  return {};
}

// 持仓列表（用于组合策略分析）
const positionList = reactive([]);

// 当前正股价格（取第一个持仓的 spotPrice，或默认值）
const currentSpotPrice = computed(() => {
  return positionList[0]?.spotPrice || 0;
});

// 持仓映射：optionName → position 值，方便按钮快速查找选中状态
const positionMap = computed(() => {
  const map = {};
  for (const p of positionList) {
    map[p.optionName] = p.position;
  }
  return map;
});

function removePosition(idx) {
  positionList.splice(idx, 1);
}

function clearAllPositions() {
  positionList.splice(0, positionList.length);
}

function handleRemoveFromTable(side, row) {
  const opt = getRowTargetOption(row, side);
  const optionName = opt?.["期权名称"] || "";
  if (!optionName) return;
  const idx = positionList.findIndex(p => p.optionName === optionName);
  if (idx >= 0) positionList.splice(idx, 1);
}

function handleRowClick(row) {
  // 保留，不做操作（点击行不再自动选中）
}

function handleTrade(side, action, row) {
  const opt = getRowTargetOption(row, side);
  const optionName = opt?.["期权名称"] || "";
  if (!optionName) return;

  const type = side === "C" ? "call" : "put";
  const strike = row["行权价"] || 0;
  const spotPrice = row["正股价格"] || 0;
  const entryPrice = opt["最新价"] || 0;
  const iv = (opt["隐波"] || 0) / 100;
  const dte = Math.max(0, dayjs(row["到期日"]).diff(dayjs(), "day"));
  // ETF行权价3.3 → 显示3300；股指行权价4900 → 直接显示4900
  const label = `${type === "call" ? "C" : "P"} ${strike < 100 ? (strike * 1000).toFixed(0) : strike}`;

  // 检查是否已有同一合约的持仓
  const existingIdx = positionList.findIndex(p => p.optionName === optionName);
  if (existingIdx >= 0) {
    // 更新已有持仓
    const delta = action === "buy" ? 1 : -1;
    positionList[existingIdx].position += delta;
    positionList[existingIdx].currentPrice = entryPrice;
    // 如果持仓归零则移除
    if (positionList[existingIdx].position === 0) {
      positionList.splice(existingIdx, 1);
    }
  } else {
    // 新增持仓
    positionList.push({
      optionName,
      type,
      strike,
      position: action === "buy" ? 1 : -1,
      entryPrice,
      currentPrice: entryPrice,
      iv,
      dte,
      spotPrice,
      label,
    });
  }
}
</script>
<style lang="less">
.el-table--small .cell {
  padding: 0 2px;
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
</style>
