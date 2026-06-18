<template>
  <!-- 空行占位 -->
  <div v-if="false">{{ props.row }}</div>
  <!-- 分割线行 -->
  <div v-else-if="props.row._split" style="background-color: #576a8f" class="h-[10px]">&nbsp;</div>
  <!-- 当前高亮行 -->
  <div v-else-if="props.row._current" style="background-color: #dff1f1; height: 22px">&nbsp;</div>
  <!-- 期权卡片主体 -->
  <div @click="handleShowBs" v-else-if="!props.row?._current && 一手价" class="p-[2px] cursor-pointer relative flex items-center" :style="wrapperStyle" :class="{ 'print-text-large': isPrint }">
    <!-- 左上 -->
    <div v-if="isShow持仓" class="absolute top-[0px] left-[0px]">
      <TagHold :showPlus="true" v-if="持仓变化 && props.showTypeVal !== '空白'" :value="持仓变化" /><span v-if="持仓变化 && props.showTypeVal !== '空白'">{{ "=>" }}</span>
      <div class="inline-block rounded-md" :style="{ border: 持仓 > 0 ? '1px solid red' : '1px solid green' }"><TagHold :value="isShow持仓 ? 持仓 || 0 : 持仓" /></div>
      <TagHoldDiffPercent v-if="isPrint && 持仓" :value="盈亏" :收益率="收益率" />
    </div>

    <!-- 左下盈亏标签（非打印） -->
    <div v-if="isShow持仓 && !isPrint" class="absolute left-0 bottom-0">
      <TagHoldDiffPercent :value="盈亏" :收益率="收益率" />
    </div>

    <!-- 右上涨跌标签 -->
    <div v-if="showTypeNotBlank" class="absolute top-[0px] right-[0px] max-md:top-[20px]">
      <TagDiff :value="一手涨跌价" :涨跌率="涨跌率" />
    </div>

    <!-- 右档位标签（非打印） -->
    <div v-if="!isPrint" class="absolute bottom-[0px] right-[0px] max-md:bottom-[20px]">
      <TagRealLevel :value="档位" :档位名称="档位名称" />
    </div>

    <!-- 限制展示：仅显示一手价 -->
    <div v-if="optionLimitShow">
      <TagPrice :value="一手价" />
    </div>

    <!-- 空白模式中间区域 -->
    <div v-else-if="props.showTypeVal === '空白'" class="flex gap-[5px]">
      <TagPrice :value="一手价" />
      <TagHoldPercent v-if="持仓" :value="仓位" :仓位占比="0" :总投入="0" />
    </div>

    <!-- 打印模式中间区域 -->
    <div v-else-if="isPrint" class="flex flex-col justify-center mx-auto gap-[2px]">
      <div class="flex gap-[2px] justify-center flex-nowrap max-md:flex-col">
        <div class="whitespace-nowrap"><TagPrice :value="一手价" /></div>
        <div class="whitespace-nowrap"><TagDelta :value="deltaVal" /></div>
        <div class="whitespace-nowrap"><TagPremium :value="溢价率Val" /></div>
        <div class="whitespace-nowrap"><TagIv :value="隐波Val" /></div>
      </div>
      <div v-if="持仓" class="flex gap-[2px] justify-center flex-nowrap max-md:flex-col">
        <div class="whitespace-nowrap"><TagCostPrice :value="一手成本价" /></div>
        <div class="whitespace-nowrap"><TagHoldPercent :value="仓位" :仓位占比="仓位率" :isPrint="true" :总投入="总投入" /></div>
      </div>
    </div>

    <!-- 普通展示中间区域 -->
    <div v-else class="flex flex-col justify-center mx-auto max-md:mt-[-5px] gap-[2px]" :class="{ scale2: indexValMatchScale }">
      <!-- 第一行：价格、打和点、溢价率 -->
      <div class="flex gap-[2px] justify-center flex-wrap max-md:flex-col">
        <div class="whitespace-nowrap" v-if="showField('一手价')"><TagPrice :value="一手价" /></div>
        <div class="whitespace-nowrap" v-if="showField('打和点')"><TagAimPrice :value="打和点Val" /></div>
        <div class="whitespace-nowrap" v-if="showField('溢价率')"><TagPremium :value="溢价率Val" /></div>
      </div>
      <!-- 第二行：杠杆、隐波、Delta -->
      <div class="flex gap-[2px] justify-center flex-wrap max-md:flex-col">
        <div class="whitespace-nowrap" v-if="showField('杠杆')"><TagLeverage :value="杠杆Val" /></div>
        <div class="whitespace-nowrap" v-if="showField('隐波')"><TagIv :value="隐波Val" :正股="正股代码Val" /></div>
        <div class="whitespace-nowrap" v-if="showField('Delta')"><TagDelta :value="deltaVal" :正股="正股代码Val" /></div>
      </div>
      <!-- 第三行：Vega、Gamma、单日损耗 -->
      <div class="flex gap-[2px] justify-center flex-wrap max-md:flex-col">
        <div class="whitespace-nowrap" v-if="showField('Vega')"><TagVega :value="vegaVal" /></div>
        <div class="whitespace-nowrap" v-if="showField('Gamma')"><TagGamma :value="gammaVal" /></div>
        <div class="whitespace-nowrap ml-[4px]" v-if="showField('单日损耗')"><TagTheta :value="单日损耗Val" /></div>
      </div>
      <!-- 第四行：持仓量、增仓量 -->
      <div class="flex gap-[2px] justify-center flex-wrap max-md:flex-col">
        <div class="whitespace-nowrap" v-if="showField('持仓量')"><TagVolumn :value="持仓量" /></div>
        <div class="whitespace-nowrap" v-if="showField('增仓量')"><TagVolumnAdd :value="日增量" /></div>
      </div>
      <!-- 持仓专属行：成本价、仓位 -->
      <div v-if="持仓">
        <div class="flex justify-center flex-wrap max-md:flex-col gap-[1px]">
          <div class="whitespace-nowrap" v-if="showField('一手成本价')"><TagCostPrice :value="一手成本价" /></div>
          <div class="whitespace-nowrap" v-if="showField('仓位')"><TagHoldPercent :value="仓位" :仓位占比="仓位率" :总投入="总投入" /></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 弹窗 -->
  <BsModal v-model:visible="bsModalData.visible" :optionInfo="bsModalData.optionInfo" />
</template>

<script setup>
import dayjs from "dayjs";
import { useMoneyStore } from "~/stores/useMoneyStore";
import { getColorSplitHander } from "~/utils/color";
import { formatDecimal } from "~/utils/utils";
import { 最大建议买入时间价, 最大建议买入价 } from "~/data";
import { useGlobal } from "~/stores/useGlobal.js";

// 全局、仓库
const { globalLoading, isMobile } = useGlobal();
const { money } = useMoneyStore();

// props
const props = defineProps(["row", "isCall", "date", "mode", "tiledData", "indexVal", "showTypeVal"]);

// 弹窗响应式
const bsModalData = reactive({
  visible: false,
  optionInfo: {},
});

// 基础计算属性
const isPrint = computed(() => ["打印", "空白"].includes(props.showTypeVal));
const showTypeNotBlank = computed(() => props.showTypeVal !== "空白");
const 期权名称 = computed(() => {
  const type = props.isCall ? "C" : "P";
  const month = dayjs(props.date, "YYYY-MM-DD").format("M月");
  return props.row[type + month + "期权名称"];
});
const current期权Item = computed(() => props.tiledData?.find((el) => el["期权名称"] === 期权名称.value) || {});

// 期权单项快捷取值（减少重复访问current期权Item.value）
const optionItem = computed(() => current期权Item.value);
const optionLimitShow = computed(() => !!optionItem.value["_限制展示"]);
const indexValMatchScale = computed(() => [1, 2, 3, 4].includes(props.indexVal.length));

// 标的基础字段
const 正股代码Val = computed(() => optionItem.value["正股代码"]);
const deltaVal = computed(() => optionItem.value["Delta"]);
const 溢价率Val = computed(() => optionItem.value["溢价率"]);
const 隐波Val = computed(() => optionItem.value["隐波"]);
const 打和点Val = computed(() => optionItem.value["打和点"]);
const 杠杆Val = computed(() => optionItem.value["杠杆"]);
const vegaVal = computed(() => optionItem.value["Vega"]);
const gammaVal = computed(() => optionItem.value["Gamma"]);
const 单日损耗Val = computed(() => optionItem.value["单日损耗"]);

// 持仓相关
const 持仓 = computed(() => optionItem.value["持仓"]);
const 持仓变化 = computed(() => optionItem.value["持仓变化"]);
const isShow持仓 = computed(() => {
  if (props.showTypeVal === "空白" && !持仓.value) return false;
  return !!持仓.value || !!持仓变化.value;
});
const 盈亏 = computed(() => (一手价.value - 一手成本价.value) * (持仓.value || 0));
const 盈亏百分比 = computed(() => (持仓.value ? (一手价.value - 一手成本价.value) / 一手成本价.value : 0));
const 仓位 = computed(() => (持仓.value || 0) * (一手价.value || 0));

// 行情数值
const 日增量 = computed(() => optionItem.value["日增"]);
const 持仓量 = computed(() => optionItem.value["持仓量"]);
const 档位 = computed(() => optionItem.value["档位"]);
const 档位名称 = computed(() => optionItem.value["档位名称"]);
const 一手价 = computed(() => optionItem.value["一手价"]);
const 一手成本价 = computed(() => optionItem.value["一手成本价"]);
const 一手涨跌价 = computed(() => optionItem.value["一手涨跌价"]);
const 涨跌率 = computed(() => optionItem.value["涨跌率"]);
const 收益率 = computed(() => optionItem.value["收益率"]);
const 总投入 = computed(() => optionItem.value["总投入"]);
const 仓位率 = computed(() => optionItem.value["仓位率"]);

// 标记类
const is彩票 = computed(() => optionItem.value["is彩票"]);
const is禁止加仓 = computed(() => optionItem.value["is禁止加仓"]);

// 颜色工具
const greenColorHandler = getColorSplitHander("#F0FFF0", "#006400");
const redColorHandler = getColorSplitHander("#FFE4E1", "#FF0000");

// 字段显示公共方法（模板复用，无需新增外部方法）
const showField = (fieldName) => {
  const list = props.indexVal;
  return !list?.length || list.includes(fieldName);
};

// 外层容器样式（重构分支，减少重复对象解构）
const wrapperStyle = computed(() => {
  const baseStyle = {
    padding: isPrint.value ? "35px 0 5px 0" : "25px 0",
    height: isPrint.value ? "83px" : isMobile ? "340px" : "165px",
    border: 持仓.value > 0 ? "1px solid red" : 持仓.value < 0 ? "1px solid green" : "",
  };
  const grayStyle = { background: "white", filter: "grayscale(0.25)" };
  const 实值Style = { background: "#F6FFDC" };
  const holdBgStyle = { background: "rgba(246, 255, 220, 0.35)" };
  const holdChangeStyle = { background: "rgba(0, 0, 0, 0.4)", filter: "grayscale(0.25)" };

  const item = optionItem.value;
  let finalStyle = { ...baseStyle };

  switch (props.mode) {
    case "custom":
    case "chance":
      finalStyle = { ...finalStyle, ...(item["_isChance"] ? 实值Style : grayStyle) };
      break;
    case "in-val":
      const innerPrice = item["一手内在价"] || 0;
      const timePrice = item["一手时间价"] || 0;
      if (innerPrice === 0 || innerPrice > 最大建议买入价 || timePrice > 最大建议买入时间价) {
        finalStyle = { ...finalStyle, ...grayStyle };
      } else {
        finalStyle = { ...finalStyle, ...实值Style };
      }
      break;
    case "hold":
      if (item["持仓"]) {
        finalStyle = { ...finalStyle, ...holdBgStyle };
      } else if (item["持仓变化"]) {
        finalStyle = { ...finalStyle, ...holdChangeStyle };
        if (props.showTypeVal === "空白") finalStyle = { ...baseStyle };
      }
      break;
  }
  return finalStyle;
});

// 点击弹窗
function handleShowBs() {
  bsModalData.optionInfo = optionItem.value;
  bsModalData.visible = true;
}

// 毛玻璃指令（保留原有逻辑不动）
const vGlass = {
  mounted(el, binding) {
    handleGlassStyle(el, binding.value);
  },
  updated(el, binding) {
    if (binding.oldValue !== binding.value) {
      handleGlassStyle(el, binding.value);
    }
  },
};
const handleGlassStyle = (el, isEnable) => {
  el.classList.toggle("glass-effect", !!isEnable);
};
</script>

<style lang="less">
.glass-effect {
  filter: grayscale(0.75);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  background-color: #acbac4;
  border: 1px solid #acbac4;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
}

.print-text-large,
.print-text-large * {
  font-size: 23px;
}

.my-tag-wrapper {
  margin-inline: -1px;
  position: relative;
  &:hover {
    z-index: 1;
  }
}

.scale2 {
  .my-tag-wrapper {
    font-size: 2.5em;
    @media not all and (min-width: 768px) {
      font-size: 1.5em;
    }
  }
}
</style>
