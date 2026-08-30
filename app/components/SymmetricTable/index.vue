<template>
  <div class="flex flex-col h-full">
    <div class="w-full pb-[12px] h-[30px]" v-if="!isMobile">
      <TabSelect :options="typeOptions" v-model="showTypeVal" />
    </div>
    <div class="w-full pb-[12px] flex items-center gap-[12px] h-[30px]" v-if="showTypeVal === '筛选'">
      <span class="text-[14px] whitespace-nowrap">最大溢价</span>
      <el-input v-model="max溢价Val" class="w-[80px]" size="small" controls-position="right" />
      <span class="text-[14px] whitespace-nowrap">最大一手价</span>
      <el-input v-model="max一手价Val" class="w-[80px]" size="small" controls-position="right" />
    </div>
    <!-- <div class="w-full pb-[12px] h-[30px]">
      <TabSelectMult :options="columnOptions" v-model="columnVal" />
    </div> -->
    <div class="w-full pb-[12px] h-[30px]" v-if="showTypeVal === '完整'">
      <TabSelectMult :options="indexOptions" v-model="indexVal" />
    </div>
    <div class="h-[calc(100%-120px)]">
      <Capture title="期权T型" ref="captureRef"
        :style="{ 'border-left': '10px solid #576a8f', 'border-right': '10px solid #576a8f', width: 'fit-content' }">
        <div
          class="w-full flex justify-center items-center h-[28px] text-[24px] font-semibold text-[white] bg-[#576a8f]">
          {{ props.tableTitle || "" }}{{ dayStr }}</div>
        <el-table class="symmetic-table" :data="filteredTableData" size="small" border height="100%"
          :highlight-current-row="false" :row-style="getRowStyle" :cell-style="getCellStyle" ref="tableRef"
          :show-summary="showTypeVal !== '筛选' && showTypeVal !== '空白'" :summary-method="getSummary">
          <el-table-column v-for="{ label, type } in showColumns" :key="type + label" :prop="type + label"
            align="center" :width="getWrapperColumnWidth(label)">
            <template #header>
              <div v-if="label.includes('市场')" class="leading-[1.2] flex items-center gap-[2px] justify-center">
                <div>{{ label }}</div>
              </div>
              <div v-else-if="type" class="leading-[1.2]">
                <div class="leading-[1.2]">{{ type }}{{ dayjs(label, "YYYY-MM-DD").format("M月DD") }}</div>
                <div class="leading-[1.2] text-rose-950">({{ dayjs(label, "YYYY-MM-DD").diff(dayjs(), "days") + 1 }})
                </div>
              </div>
              <div v-else class="leading-[1.2] flex items-center gap-[2px] justify-center cursor-pointer"
                @click="() => captureRef.download()">
                <div>{{ label }}</div>
                <el-button link>⬇</el-button>
              </div>
            </template>
            <template #default="{ row }">
              <Center v-if="label === '期权'" :row="row" :showTypeVal="showTypeVal" />
              <Data v-else-if="label.includes('市场')" :row="row" :isCall="type === 'C'" :minMaxData="minMaxData"
                :showTypeVal="showTypeVal" />
              <!-- <template> -->
              <InfoMobile v-else-if="isMobile" :row="row" :isCall="type === 'C'" :date="label"
                :tiledData="props.tiledData" :mode="props.mode" :indexVal="indexVal" />
              <InfoFull v-else-if="showTypeVal === '完整'" :row="row" :isCall="type === 'C'" :date="label"
                :tiledData="props.tiledData" :mode="props.mode" :indexVal="indexVal" />
              <InfoPrint v-else-if="showTypeVal === '打印'" :row="row" :isCall="type === 'C'" :date="label"
                :tiledData="props.tiledData" :mode="props.mode" :indexVal="indexVal" />
              <InfoFilter v-else-if="showTypeVal === '筛选'" :row="row" :isCall="type === 'C'" :date="label"
                :tiledData="filteredTiledData" :mode="props.mode" :indexVal="indexVal" />
              <InfoMinimal v-else-if="showTypeVal === '极简'" :row="row" :isCall="type === 'C'" :date="label"
                :tiledData="props.tiledData" :mode="props.mode" :indexVal="indexVal" />
              <InfoBlank v-else-if="showTypeVal === '空白'" :row="row" :isCall="type === 'C'" :date="label"
                :tiledData="props.tiledData" :mode="props.mode" :indexVal="indexVal" />
              <!-- </template> -->
            </template>
          </el-table-column>
        </el-table>
      </Capture>
    </div>
  </div>
</template>
<script setup>
import { OPTIONS_MAP, deadline_list } from "~/data";
import dayjs from "dayjs";
import Center from "./components/Center.vue";
import InfoFull from "./components/InfoFull.vue";
import InfoPrint from "./components/InfoPrint.vue";
import InfoMinimal from "./components/InfoMinimal.vue";
import InfoBlank from "./components/InfoBlank.vue";
import InfoMobile from "./components/InfoMobile.vue";
import InfoFilter from "./components/InfoFilter.vue";
import Data from "./components/Data.vue";
import { useGlobal } from "~/stores/useGlobal.js";
const { globalLoading, isMobile } = useGlobal();
const props = defineProps(["mode", "symmetricData", "tiledData", "tableTitle", "showTypeVal"]);
const dayStr = computed(() => `(${dayjs().format("YYYY-MM-DD HH:mm:ss")})`);
const tableRef = ref();
const reversed_deadline_list = [...deadline_list].reverse();
const typeOptions = computed(() =>
  isMobile
    ? [{ label: "完整", value: "完整" }]
    : ["完整", "筛选", "打印", "极简", "空白"].map((el) => ({ label: el, value: el }))
);
const showTypeVal = ref("完整");
watch(
  () => props.showTypeVal,
  () => {
    if (props.showTypeVal) {
      showTypeVal.value = isMobile ? "完整" : props.showTypeVal;
    }
  },
  {
    immediate: true,
  }
);
watch(isMobile, () => {
  if (isMobile) showTypeVal.value = "完整";
});
const indexOptions = ["一手价", "打和点", "溢价率", "杠杆", "隐波", "Delta", "Vega", "Gamma", "单日损耗", "一手成本价", "仓位", "持仓量", "增仓量"].map((el) => ({ label: el, value: el }));
const indexVal = ref([]);
const columnVal = ref([]);
const tableData = reactive({
  columns: [
    ...reversed_deadline_list.map((el) => ({ type: "C", label: el })),
    {
      label: "C市场",
      type: "C",
    },
    {
      label: "期权",
      type: "",
    },
    {
      label: "P市场",
      type: "P",
    },
    ...deadline_list.map((el) => ({ type: "P", label: el })),
  ],
});
const columnOptions = computed(() => {
  return tableData.columns.map((el) => el.label).map((el) => ({ label: el, value: el }));
});
const showColumns = computed(() => {
  let columns = tableData.columns;
  if (columnVal.value.length) {
    columns = columns.filter((el) => columnVal.value.includes(el.label));
  }
  // C市场 / P市场 列只在“完整”模式下显示
  if (showTypeVal.value !== "完整") {
    columns = columns.filter((el) => !el.label.includes("市场"));
  }
  return columns;
});
function getWrapperColumnWidth(label) {
  if (label.includes("市场")) return "90px";

  if (label === "期权") return "80px";
  if (isMobile) return "100px";
  return showTypeVal.value === "打印" || showTypeVal.value === "极简" ? "340px" : "172px";
}
const max溢价Val = ref(5);
const max一手价Val = ref(500);
const filteredTableData = computed(() => {
  const isFilterMode = showTypeVal.value === "筛选";
  return props.symmetricData
    .filter((el) => {
      if (el._current || el._split) return true;
      if (el["is行内有持仓"] && !isFilterMode) return true;
      // if (el["正股代码"] !== stockCode.value) return false;
      if (el["is旧期权"]) return false;
      // if (el["千行权价"] < 5000 && el["千行权价"] % 100 !== 0) return false;
      // 最大溢价：筛选模式下过滤数据行
      if (isFilterMode && Math.abs(el["行权价溢价"]) > max溢价Val.value) {
        return false;
      }
      return true;
      const targetRangeArr = OPTIONS_MAP.find((item) => item.code === el["正股代码"]).行权价Range;
      return el["千行权价"] >= targetRangeArr[0] && el["千行权价"] <= targetRangeArr[1];
    });
});
// 参考 stockindex 的 filteredTiledData：一手价 或 行权价溢价 超限时标记 _限制展示（保留行、变灰受限）
const filteredTiledData = computed(() => {
  return props.tiledData.map((el) => {
    if (el["一手价"] >= max一手价Val.value || Math.abs(el["行权价溢价"]) > max溢价Val.value) {
      return {
        ...el,
        _限制展示: true,
      };
    }
    return el;
  });
});

/**
 * 计算C市场、P市场下 日增额、日增量、持仓额、持仓量 的最大最小值
 * @param {Array} filteredTableData 数据源数组，每项包含 'C市场数据字段'、'P市场数据字段'
 * @returns {Object} 各指标最大最小值
 */
function calcMarketMinMax(filteredTableData) {
  // 需要统计的指标key
  const targetKeys = ['日增额', '日增量', '持仓额', '持仓量'];
  // 市场字段
  const marketFields = ['C市场数据', 'P市场数据'];

  // 初始化收集所有数值
  const valueMap = {};
  targetKeys.forEach(key => {
    valueMap[key] = [];
  });

  // 遍历每一行数据
  filteredTableData.forEach(row => {
    marketFields.forEach(marketKey => {
      const marketData = row[marketKey];
      if (!marketData) return;
      targetKeys.forEach(field => {
        const val = Number(marketData[field]);
        // 过滤有效数字
        if (!isNaN(val)) {
          valueMap[field].push(val);
        }
      });
    });
  });

  // 组装最大最小值结果
  const result = {};
  targetKeys.forEach(field => {
    const list = valueMap[field];
    if (list.length === 0) {
      result[field] = { max: null, min: null };
    } else {
      result[field] = {
        max: Math.max(...list),
        min: Math.min(...list)
      };
    }
  });

  return result;
}

const minMaxData = computed(() => {
  return calcMarketMinMax(filteredTableData.value)
})

function getCellStyle({ column, row }) {
  if (row["_split"] || row["_current"]) return {};
  if (column?.["property"] === "期权") return { backgroundColor: "#CBDCEB", fontWeight: "600", border: "1px solid white" };
  // 红 | 绿
  // -------
  // 绿 | 红
  const 实值style = { border: "1px solid rgb(255, 240, 240)", background: "white" };
  const 虚值style = { border: "1px solid rgb(225, 240, 225)", background: "white" };
  if (row["行权价"] > row["正股价格"]) {
    return column?.["property"]?.includes("C") ? 虚值style : 实值style;
  } else {
    return column?.["property"]?.includes("C") ? 实值style : 虚值style;
  }
  return { backgroundColor: "white" };
}
function getRowStyle({ row }) {
  return {};
}
watch(
  () => props.symmetricData,
  () => {
    tableRef.value?.setScrollTop(0);
  },
  {
    immediate: true,
    deep: true,
  }
);

// 通用合计方法（永远不用改）
const getSummary = ({ columns, data }) => {
  const summaryProps = [];
  return columns.map((col, index) => {
    // 第一列显示“合计”
    // if (index === 0) return "合计";
    // console.log("col", col, data);
    const type = col.property?.includes("C") ? "C" : "P";
    const 到期时间 = col.property.replace("C", "").replace("P", "");
    const month = dayjs(到期时间, "YYYY-MM-DD").format("M月");
    const propName = type + month + "期权名称";
    // props.tiledData
    const curColOptionNameList = [];
    data.forEach((el) => {
      el[propName] && curColOptionNameList.push(el[propName]);
    });
    const curColOptionList = props.tiledData?.filter((el) => curColOptionNameList.includes(el["期权名称"]));
    let sum = 0;
    curColOptionList
      .filter((el) => el["持仓"])
      .forEach((el) => {
        sum += el["仓位"];
      });
    return sum || "";
    //     const 期权名称 = computed(() => {
    //   const type = props.isCall ? "C" : "P";
    //   const month = dayjs(props.date, "YYYY-MM-DD").format("M月");
    //   return props.row[type + month + "期权名称"];
    // });
    // 当前列在合计列表里 → 求和
    // if (summaryProps.includes(col.property)) {
    //   return data.reduce((sum, row) => sum + (row[col.property] || 0), 0);
    // }

    // 不在列表 → 空
    return "";
  });
};

const captureRef = ref(null);
</script>
<style lang="less">
.el-table--small .cell {
  padding: 0 0px !important;
}

.el-table--small .el-table__cell {
  padding: 0px 0 !important;
}

.el-radio-group {
  justify-content: center;
  width: 100%;
}

.el-radio-button {
  flex: 1;
}

// 新增：合计行全局放大字体
.symmetic-table {
  .el-table__footer-wrapper .cell {
    font-size: 24px; // 按需调整大小
    font-weight: 600; // 可选加粗
    height: 30px;
  }
}

// .el-table td.el-table__cell, .el-table th.el-table__cell.is-leaf{
//   border: 0;
// }
</style>
