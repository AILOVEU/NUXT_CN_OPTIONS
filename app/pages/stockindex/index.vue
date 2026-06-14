<template>
  <div class="max-md:w-[355%]" v-loading="loading">
    <Nav @download="handleDownload" />
    <el-button @click="handleQuery">获取</el-button>
    <div class="flex flex-col gap-[5px] py-[15px] items-center">
      <div class="flex text-[2em]">
        <div>购代替正股: {{ formatNumberToWan(持仓Info.购代替正股) }}</div>
      </div>
      <div class="flex text-[2em]">
        <div>沽代替正股: {{ formatNumberToWan(持仓Info.沽代替正股) }}</div>
      </div>
      <div class="flex gap-[5px] text-[1.2em]">
        <div>{{ 持仓Info.当前正股 }}:</div>
        <div>购代替正股: {{ formatNumberToWan(持仓Info.当前购代替正股) }}</div>
        <div>沽代替正股:{{ formatNumberToWan(持仓Info.当前沽代替正股) }}</div>
      </div>
    </div>
    <div class="w-full pb-[12px]">
      <TabSelect :options="stockCodeOptions" v-model="stockCode" @click="handleStockCodeChange" />
    </div>
    <div class="w-full pb-[12px] flex gap-[10px] items-center"><div class='w-[80px]'>最大溢价:</div><el-input v-model="max溢价Val" /></div>

    <!-- 优化key + 修复单条下载作用域，不再依赖全局captureRef -->
    <Capture v-for="(item, idx) in tableList" :key="idx" :ref="(el) => el && (itemRefs[idx] = el)" title="股指T型" :style="{ 'border-left': '10px solid #576a8f', 'border-right': '10px solid #576a8f' }">
      <el-table :data="filterTableDataByStockCode(item)" size="small" border height="100%" :highlight-current-row="false" ref="tableRef">
        <el-table-column v-for="{ label, type } in tableData.columns" :key="type + label" :prop="type + label" align="center">
          <template #header>
            <div v-if="type" class="leading-[1.2]">
              <div class="leading-[1.2]">{{ type }}{{ label }}</div>
            </div>
            <!-- 改用当前项 ref，消除全局 captureRef 隐患 -->
            <div v-else class="leading-[1.2] flex items-center gap-[2px] justify-center cursor-pointer" @click="() => itemRefs[idx]?.download()">
              <div>{{ label }}</div>
              <el-button link>⬇</el-button>
            </div>
          </template>

          <template #default="{ row }" v-if="label === '期权'">
            <Center :row="row" />
          </template>
          <template #default="{ row }" v-if="label !== '期权'">
            <Info :row="row" :isCall="type === 'C'" :date="label" :tiledData="tiledData" mode="hold" :indexVal="[]" showTypeVal="精简" />
          </template>
        </el-table-column>
      </el-table>
    </Capture>
  </div>
</template>

<script setup>
import { formatNumberToWan, formatDecimal } from "~/utils/utils";
import { STOCK_INDEX_OPTIONS_MAP, stock_index_fields_dict } from "~/data";
import { get_http_data_stock_index } from "~/utils/stockIndexOptions";
import Center from "./components/Center";
import Info from "./components/Info";
import _ from "lodash";
import { ref, computed, reactive, nextTick } from "vue";

const max溢价Val = ref(10);
// 全局表格ref（保留原有）
const captureRef = ref();
const tableRef = ref();

const deadline_list = ["2606", "2607", "2608", "2609", "2612", "2703"];
const stockCodeOptions = computed(() => {
  const ops = STOCK_INDEX_OPTIONS_MAP.map((el) => ({
    value: el.code,
    label: el.code,
  }));
  return ops;
});

const stockCode = ref(stockCodeOptions.value[0].value);
const tableList = ref([stockCode.value]);
const reversed_deadline_list = _.reverse([...deadline_list]);

const tableData = reactive({
  columns: [
    ...reversed_deadline_list.map((el) => ({ type: "C", label: el })),
    {
      label: "期权",
      type: "",
    },
    ...deadline_list.map((el) => ({ type: "P", label: el })),
  ],
  data: [],
});

const tiledData = ref([]);
const loading = ref(false);
const itemRefs = ref([]);

// 查询数据
async function handleQuery() {
  loading.value = true;
  const allCodeList = STOCK_INDEX_OPTIONS_MAP.map((el) => el["code"]);
  let [data, _data] = await queryStockIndexGrid(allCodeList);
  tableData.data = data;
  tiledData.value = _data;
  loading.value = false;
}

// 根据代码过滤表格数据
function filterTableDataByStockCode(code) {
  return tableData.data.filter((el) => el["正股代码"] === code).filter((el) => Math.abs(el["行权价溢价"]) < max溢价Val.value);
}

// 持仓统计计算：优化重复遍历，只遍历一次原始列表
const 持仓Info = computed(() => {
  const 持仓List = tiledData.value.filter((el) => el["持仓"]);
  const currentCode = stockCode.value;

  let 购代替正股 = 0;
  let 沽代替正股 = 0;
  let 当前购代替正股 = 0;
  let 当前沽代替正股 = 0;

  for (const item of 持仓List) {
    const baseVal = item["正股价格"] * item["合约单位"] * item["Delta"];
    if (item["沽购"] === "购") {
      购代替正股 += baseVal;
      if (item["正股代码"] === currentCode) {
        当前购代替正股 += baseVal;
      }
    } else if (item["沽购"] === "沽") {
      沽代替正股 += baseVal;
      if (item["正股代码"] === currentCode) {
        当前沽代替正股 += baseVal;
      }
    }
  }

  return {
    购代替正股: formatDecimal(购代替正股, 0),
    沽代替正股: formatDecimal(沽代替正股, 0),
    当前购代替正股: formatDecimal(当前购代替正股, 0),
    当前沽代替正股: formatDecimal(当前沽代替正股, 0),
    当前正股: currentCode,
  };
});

// 切换代码
function handleStockCodeChange() {
  tableList.value = [stockCode.value];
  // handleQuery();
}

// 收集子组件ref
const setItemRef = (el, index) => {
  if (el) {
    itemRefs.value[index] = el;
  }
};

// 批量下载PDF：改用nextTick，重置ref，时序更稳定
async function handleDownload() {
  // 清空旧引用，防止脏数据
  itemRefs.value = [];
  // 赋值全量列表
  tableList.value = STOCK_INDEX_OPTIONS_MAP.map((el) => el.code);

  // 等待DOM&组件完全渲染完成
  await nextTick();

  // 导出base64并下载PDF
  const base64List = await Promise.all(itemRefs.value.map((c) => c.getDataURL()));
  await downloadPrintPdf(base64List);

  // 切回当前选中项
  tableList.value = [stockCode.value];
}

// 初始加载
handleQuery();
</script>
