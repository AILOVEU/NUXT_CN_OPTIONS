<template>
  <div v-loading="tableData.loading || globalLoading.value" class="max-md:w-[335%]">
    <div>
      <Nav />

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
          <el-table-column #default="{ row }" align="center" width="100" label="C_价值" prop="C_价值"><Time
              :row="getRowTargetOption(row, 'C')" /> </el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="C_信息" prop="C_信息">
            <Info :row="getRowTargetOption(row, 'C')" />
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="C_持仓" prop="C_持仓">
            <Hold :row="getRowTargetOption(row, 'C')" />
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="125" label="C_价格" prop="C_价格">
            <Price :row="getRowTargetOption(row, 'C')" />
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="50" label="C_交易" prop="C_交易">
            <div class="flex flex-col gap-[1px] py-[2px]" v-if="getRowTargetOption(row, 'C')?.['期权名称']">
              <el-button size="small" type="danger" class="!h-[18px] !text-[10px] !px-0 !w-full" @click.stop="handleTrade('C', 'buy', row)">买</el-button>
              <el-button size="small" type="success" class="!h-[18px] !text-[10px] !px-0 !w-full" @click.stop="handleTrade('C', 'sell', row)">卖</el-button>
            </div>
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="80" label="期权" prop="期权">
            <Center :row="row" />
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="50" label="P_交易" prop="P_交易">
            <div class="flex flex-col gap-[1px] py-[2px]" v-if="getRowTargetOption(row, 'P')?.['期权名称']">
              <el-button size="small" type="danger" class="!h-[18px] !text-[10px] !px-0 !w-full" @click.stop="handleTrade('P', 'buy', row)">买</el-button>
              <el-button size="small" type="success" class="!h-[18px] !text-[10px] !px-0 !w-full" @click.stop="handleTrade('P', 'sell', row)">卖</el-button>
            </div>
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="125" label="P_价格" prop="P_价格">
            <Price :row="getRowTargetOption(row, 'P')" />
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="P_持仓" prop="P_持仓">
            <Hold :row="getRowTargetOption(row, 'P')" />
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="150" label="P_信息" prop="P_信息">
            <Info :row="getRowTargetOption(row, 'P')" />
          </el-table-column>
          <el-table-column #default="{ row }" align="center" width="100" label="P_价值" prop="P_价值"><Time
              :row="getRowTargetOption(row, 'P')" /> </el-table-column>
          <el-table-column #default="{ row }" align="center" width="100" label="P_合约" prop="P_合约">
            <Options :row="getRowTargetOption(row, 'P')" />
          </el-table-column>
        </el-table>
      </div>
      <!-- 右侧策略盈亏分析 -->
      <div class="w-[340px] flex-shrink-0 overflow-y-auto">
        <StrategyAnalyzer
          :positions="positionList"
          :spotPrice="currentSpotPrice"
          @removePosition="removePosition"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import Center from "./components/Center.vue";
import Price from "./components/Price.vue";
import Info from "./components/Info.vue";
import Options from "./components/Options.vue";
import Time from "./components/Time.vue";
import Hold from "./components/Hold.vue";
import StrategyAnalyzer from "./components/StrategyAnalyzer.vue";
import { queryRow } from "~/utils/queryRow.js";
import { useGlobal } from "~/stores/useGlobal.js";
import { deadline_list, OPTIONS_MAP } from "~/data";
import dayjs from "dayjs";

const { globalLoading } = useGlobal();
const tableRef = ref();
const stockCodeOptions = computed(() => {
  let ops = OPTIONS_MAP.map((el) => ({
    value: el.code,
    label: el.showName,
  }));
  return [...ops, { value: "all", label: "全" }];
});
const formData = reactive({
  到期日List: [...deadline_list],
  stockCode: stockCodeOptions.value[0].value
});
const tableData = reactive({
  data: [],
  comboList: [],
  tiledData: [],
  loading: false,
});
async function handleQuery() {
  tableData.loading = true;
  const [tData, comboList, tiledData] = await queryRow(formData.stockCode === "all" ? OPTIONS_MAP.map((el) => el.code) : [formData.stockCode]);
  tableData.data = (tData || []);
  // tableData.data = (tData || []);
  tableData.comboList = comboList;
  tableData.tiledData = tiledData;
  tableData.loading = false;
}
function getRowTargetOption(row, callType) {
  // row
  // C期权名称: "50ETF购3月3300"
  // P期权名称: "50ETF沽3月3300"
  // is旧期权: false
  // 到期日: "2026-03-25"
  // 千行权价: 3300
  // 正股代码: "510050"
  // 正股价格: 3.15
  // 行权价: 3.3
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
    if(!formData.到期日List.includes(el["到期日"])) return false;
    if (el["is保留行"]) return true;
    if (el["is旧期权"]) return false;
    if (el['_current'] || el['_split']) return true;
    return true;
    const targetRangeArr = OPTIONS_MAP.find((item) => item.code === el["正股代码"]).行权价Range;
    return el["千行权价"] >= targetRangeArr[0] && el["千行权价"] <= targetRangeArr[1];
  });
});

function getCellStyle({ column, row }) {
  if (row?.["_current"]) return { backgroundColor: "#f5f7fa" };
  if (row?.["_split"]) return { backgroundColor: "black", color: "black" };
  if (column?.["property"] === "期权") return { backgroundColor: "#CBDCEB", fontWeight: "600", border: "1px solid white" };
  // 红 | 绿
  // -------
  // 绿 | 红
  const 实值style = { backgroundColor: "rgb(255, 220, 220)" };
  const 虚值style = { backgroundColor: "rgb(190, 220, 190)" };
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

// 持仓列表（用于组合策略分析）
const positionList = reactive([]);

// 当前正股价格（取第一个持仓的 spotPrice，或默认值）
const currentSpotPrice = computed(() => {
  return positionList[0]?.spotPrice || 0;
});

function removePosition(idx) {
  positionList.splice(idx, 1);
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
  const label = `${type === "call" ? "C" : "P"} ${(strike * 1000).toFixed(0)}`;

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
