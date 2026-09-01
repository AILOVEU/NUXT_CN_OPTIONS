<template>
  <div class="flex flex-col h-full min-w-0 max-w-full">
    <div class="w-full pb-[12px] h-[30px]" v-if="!isMobile">
      <TabSelect :options="typeOptions" v-model="showTypeVal" />
    </div>
    <!-- 当前展示模式的说明文案 -->
    <div class="w-full pb-[8px] text-[12px] text-gray-500 leading-[16px]" v-if="!isMobile && showTypeDesc">
      {{ showTypeDesc }}
    </div>
    <div class="w-full pb-[12px] flex items-center gap-[12px] h-[30px]" v-if="showTypeVal === '筛选'">
      <span class="text-[14px] whitespace-nowrap">最大溢价</span>
      <el-input v-model="max溢价Val" class="w-[80px]" size="small" controls-position="right" />
      <span class="text-[14px] whitespace-nowrap">最大一手价</span>
      <el-input v-model="max一手价Val" class="w-[80px]" size="small" controls-position="right" />
    </div>
    <div class="w-full pb-[12px] flex items-center gap-[12px] h-[30px]" v-if="showTypeVal === '空白'">
      <span class="text-[14px] whitespace-nowrap">最大溢价</span>
      <el-input v-model="max溢价Val空白" class="w-[80px]" size="small" controls-position="right" />
    </div>
    <!-- <div class="w-full pb-[12px] h-[30px]">
      <TabSelectMult :options="columnOptions" v-model="columnVal" />
    </div> -->
    <div class="w-full pb-[12px] h-[30px]" v-if="showTypeVal === '完整'">
      <TabSelectMult :options="indexOptions" v-model="indexVal" />
    </div>
    <div class="h-[calc(100%-120px)] overflow-x-auto">
      <Capture title="期权T型" ref="captureRef"
        :style="{ 'border-left': '10px solid #576a8f', 'border-right': '10px solid #576a8f', width: 'fit-content' }">
        <div
          class="w-full flex justify-center items-center h-[28px] text-[24px] font-semibold text-[white] bg-[#576a8f]">
          {{ props.tableTitle || "" }}{{ dayStr }}</div>
        <el-table class="symmetic-table" :data="filteredTableData" size="small" border height="100%"
          :highlight-current-row="false" :row-style="getRowStyle" :cell-style="getCellStyle" ref="tableRef"
          :show-summary="!['筛选', '空白', '跨市'].includes(showTypeVal)" :summary-method="getSummary">
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
              <InfoMobile v-else-if="showTypeVal === '手机'" :row="row" :isCall="type === 'C'" :date="label"
                :tiledData="props.tiledData" :indexVal="indexVal" />
              <InfoFull v-else-if="showTypeVal === '完整'" :row="row" :isCall="type === 'C'" :date="label"
                :tiledData="props.tiledData" :indexVal="indexVal" />
              <InfoPrint v-else-if="showTypeVal === '打印'" :row="row" :isCall="type === 'C'" :date="label"
                :tiledData="props.tiledData" :indexVal="indexVal" />
              <InfoFilter v-else-if="showTypeVal === '筛选'" :row="row" :isCall="type === 'C'" :date="label"
                :tiledData="filteredTiledData" :indexVal="indexVal" />
              <InfoMinimal v-else-if="showTypeVal === '极简'" :row="row" :isCall="type === 'C'" :date="label"
                :tiledData="props.tiledData" :indexVal="indexVal" />
              <InfoBlank v-else-if="showTypeVal === '空白'" :row="row" :isCall="type === 'C'" :date="label"
                :tiledData="props.tiledData" :indexVal="indexVal" />
              <InfoSpread v-else-if="showTypeVal === '跨市'" :row="row" :isCall="type === 'C'" :date="label"
                :tiledData="props.tiledData" :indexVal="indexVal" />
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
import InfoSpread from "./components/InfoSpread.vue";
import Data from "./components/Data.vue";
import { storeToRefs } from "pinia";
import { useGlobal } from "~/stores/useGlobal.js";
// isMobile 需经 storeToRefs 解构，直接解构会拿到非响应式快照，导致端切换时视图不更新
const globalStore = useGlobal();
const { globalLoading } = globalStore;
const { isMobile } = storeToRefs(globalStore);
const props = defineProps(["symmetricData", "tiledData", "tableTitle", "showTypeVal", "hideFilterMode"]);
const dayStr = computed(() => `(${dayjs().format("YYYY-MM-DD HH:mm:ss")})`);
const tableRef = ref();
const reversed_deadline_list = [...deadline_list].reverse();
// 数组式 defineProps 无 type 声明，无值属性会被解析为空串（falsy），这里做兼容：只要传了且不是显式 false 即视为开启
const isHideFilterMode = computed(() => props.hideFilterMode != null && props.hideFilterMode !== false);
const typeOptions = computed(() => {
  // 移动端与 PC 保持一致，不再过滤模式；hideFilterMode 时隐藏「筛选」页签（调用方自带筛选表单，避免重复）
  const list = ["完整", "打印", "极简", "筛选", "空白", "手机", "跨市"].filter((el) => !(isHideFilterMode.value && el === "筛选"));
  return list.map((el) => ({ label: el, value: el }));
});
// 各展示模式的说明文案
const showTypeDescMap = {
  完整: "必显示持仓，PC端显示",
  打印: "必显示持仓，适配打印机",
  筛选: "无持仓限制，过滤",
  空白: "无持仓限制，筛选溢价，对称打印",
  跨市: "40%，60%，剩余0~3手",
  极简: "必显示持仓，打印一手价",
  手机: "移动端卡片展示，逐日期渲染",
};
// 移动端默认「手机」模式，PC 默认「完整」（下方 watch 会在端切换时再次校正）
const showTypeVal = ref(isMobile.value ? "手机" : "完整");
const showTypeDesc = computed(() => showTypeDescMap[showTypeVal.value] || "");
// 展示模式同步：移动端默认「手机」；外部传入时同步，hideFilterMode 下忽略已被隐藏的「筛选」
// isHideFilterMode 已依赖 props.hideFilterMode，无需重复列入监听源
watch(
  () => [props.showTypeVal, isHideFilterMode.value, isMobile.value],
  ([outerVal, hideFilter, mobile]) => {
    if (mobile) {
      showTypeVal.value = "手机";
    } else if (outerVal && !(hideFilter && outerVal === "筛选")) {
      showTypeVal.value = outerVal;
    }
  },
  {
    immediate: true,
  }
);
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
  if (isMobile.value || showTypeVal.value === "手机") return "100px";
  return ['打印', '跨市', '极简'].includes(showTypeVal.value) ? "340px" : "172px";
}
const max溢价Val = ref(7);
const max一手价Val = ref(500);
// 空白模式专用（与筛选模式独立，避免切换模式时数据互相影响）
const max溢价Val空白 = ref(100);
const filteredTableData = computed(() => {
  const isFilterMode = showTypeVal.value === "筛选";
  const isSpacesMode = showTypeVal.value === "空白";
  return props.symmetricData
    .filter((el) => {
      if (el._current || el._split) return true;
      if (el["is行内有持仓"] && !isFilterMode && !isSpacesMode) return true;
      // if (el["正股代码"] !== stockCode.value) return false;
      if (el["is旧期权"]) return false;
      // if (el["千行权价"] < 5000 && el["千行权价"] % 100 !== 0) return false;
      // 最大溢价：筛选模式下过滤数据行
      if (isFilterMode && Math.abs(el["行权价溢价"]) > max溢价Val.value) {
        return false;
      }
      // 最大溢价：空白模式下按独立阈值过滤数据行
      if (isSpacesMode && Math.abs(el["行权价溢价"]) > max溢价Val空白.value) {
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
  // 限制展示：整格置灰，避免卡片未铺满时上下露白（与 Info 组件灰底一致）
  if (column?.["property"] && (column.property.includes("C") || column.property.includes("P"))) {
    const type = column.property[0];
    const dateStr = column.property.slice(1);
    const month = dayjs(dateStr, "YYYY-MM-DD").format("M月");
    const 期权名称 = row[type + month + "期权名称"];
    const item = props.tiledData?.find((el) => el["期权名称"] === 期权名称);
    if ((item && (item["_限制展示"] || item["_限制展示_有持仓"]))) {
      const base = row["行权价"] > row["正股价格"]
        ? (column.property.includes("C") ? 虚值style : 实值style)
        : (column.property.includes("C") ? 实值style : 虚值style);
      return { ...base, backgroundColor: "rgb(235, 235, 235)" };
    }
  }
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
// 暴露内部全宽截图能力（内部Capture为max-content宽度，不受外层滚动容器裁剪影响）
defineExpose({
  download: () => captureRef.value?.download(),
  getDataURL: () => captureRef.value?.getDataURL(),
});
</script>
<style lang="less">
.el-table--small .cell {
  padding: 0 0px !important;
  // 撑满行高，使卡片（如 InfoMobile 的灰底）能铺满整格，避免出现白色间隙
  height: 100%;
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

// 关闭 el-table 行悬浮高亮（官方 CSS 变量）：
// EP 规则 .el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell { background-color: var(--el-table-row-hover-bg-color) }
// 该变量由 EP 定义在 .el-table 上，直接声明在 body 的 td 上可优先于继承值，不受层叠顺序影响。
// 仅作用于 body 单元格，避免影响合计行（EP 的 footer 也复用该变量做背景）。
.symmetic-table .el-table__body td.el-table__cell {
  --el-table-row-hover-bg-color: transparent;
}

// 新增：合计行全局放大字体
.symmetic-table {
  .el-table__footer-wrapper .cell {
    font-size: 24px; // 按需调整大小
    font-weight: 600; // 可选加粗
    height: 30px;
  }

  // margin: 0 auto;
  // overflow: auto;

  // width: fit-content;
}

// .el-table td.el-table__cell, .el-table th.el-table__cell.is-leaf{
//   border: 0;
// }
</style>
