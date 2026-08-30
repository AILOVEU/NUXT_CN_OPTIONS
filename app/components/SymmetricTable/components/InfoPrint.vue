<template>
  <!-- 空行占位 -->
  <div v-if="false">{{ props.row }}</div>
  <!-- 分割线行 -->
  <div v-else-if="props.row._split" style="background-color: #576a8f" class="h-[10px]">&nbsp;</div>
  <!-- 当前高亮行 -->
  <div v-else-if="props.row._current" :style="props.isCall
    ? 'background: linear-gradient(rgb(255, 240, 240), rgb(225, 240, 225)); height: 22px'
    : 'background: linear-gradient(rgb(225, 240, 225), rgb(255, 240, 240)); height: 22px'">
    &nbsp;
  </div>
  <!-- 期权卡片主体 -->
  <div @click="handleShowBs" v-else-if="!props.row?._current && 一手价"
    class="p-[2px] cursor-pointer relative flex items-center print-text-large" :style="wrapperStyle">
    <!-- 限制展示：整块置灰（重复普通展示内容） -->
    <div v-if="optionLimitShow" class="w-full h-full text-limit-show-mode">
      <!-- 左上 -->
      <div v-if="isShow持仓" class="absolute top-[0px] left-[0px]">
        <div class="inline-block rounded-md" :class="{ borderRed: 持仓 > 0, borderGreen: 持仓 < 0 }">
          <TagHold :value="isShow持仓 ? 持仓 || 0 : 持仓" />
        </div>
        <TagHoldDiffPercent v-if="持仓" :value="盈亏" :收益率="收益率" />
      </div>
      <!-- 右上涨跌标签 -->
      <div class="absolute top-[0px] right-[0px] max-md:top-[20px]">
        <TagDiff :value="一手涨跌价" :涨跌率="涨跌率" />
      </div>
      <!-- 打印模式中间区域 -->
      <div class="flex flex-col justify-center mx-auto gap-[2px]">
        <div class="flex gap-[2px] justify-center flex-nowrap max-md:flex-col">
          <div class="whitespace-nowrap">
            <TagPrice :value="一手价" />
          </div>
          <div class="whitespace-nowrap">
            <TagDelta :value="deltaVal" />
          </div>
          <div class="whitespace-nowrap">
            <TagPremium :value="溢价率Val" />
          </div>
          <div class="whitespace-nowrap">
            <TagIv :value="隐波Val" />
          </div>
        </div>
        <div v-if="持仓" class="flex gap-[2px] justify-center flex-nowrap max-md:flex-col">
          <div class="whitespace-nowrap">
            <TagCostPrice :value="一手成本价" />
          </div>
          <div class="whitespace-nowrap">
            <TagHoldPercent :value="仓位" :仓位占比="仓位率" :isPrint="true" :总投入="总投入" />
          </div>
        </div>
      </div>
    </div>

    <!-- 普通展示 -->
    <template v-else>
      <!-- 左上 -->
      <div v-if="isShow持仓" class="absolute top-[0px] left-[0px]">
        <div class="inline-block rounded-md" :class="{ borderRed: 持仓 > 0, borderGreen: 持仓 < 0 }">
          <TagHold :value="isShow持仓 ? 持仓 || 0 : 持仓" />
        </div>
        <TagHoldDiffPercent v-if="持仓" :value="盈亏" :收益率="收益率" />
      </div>
      <!-- 右上涨跌标签 -->
      <div class="absolute top-[0px] right-[0px] max-md:top-[20px]">
        <TagDiff :value="一手涨跌价" :涨跌率="涨跌率" />
      </div>
      <!-- 打印模式中间区域 -->
      <div class="flex flex-col justify-center mx-auto gap-[2px]">
        <div class="flex gap-[2px] justify-center flex-nowrap max-md:flex-col">
          <div class="whitespace-nowrap">
            <TagPrice :value="一手价" />
          </div>
          <div class="whitespace-nowrap">
            <TagDelta :value="deltaVal" />
          </div>
          <div class="whitespace-nowrap">
            <TagPremium :value="溢价率Val" />
          </div>
          <div class="whitespace-nowrap">
            <TagIv :value="隐波Val" />
          </div>
        </div>
        <div v-if="持仓" class="flex gap-[2px] justify-center flex-nowrap max-md:flex-col">
          <div class="whitespace-nowrap">
            <TagCostPrice :value="一手成本价" />
          </div>
          <div class="whitespace-nowrap">
            <TagHoldPercent :value="仓位" :仓位占比="仓位率" :isPrint="true" :总投入="总投入" />
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- 弹窗 -->
  <BsModal v-model:visible="bsModalData.visible" :optionInfo="bsModalData.optionInfo" />
</template>

<script setup>
import dayjs from "dayjs";
import { useGlobal } from "~/stores/useGlobal.js";

// 全局、仓库
const { globalLoading } = useGlobal();

// props（打印模式）
const props = defineProps(["row", "isCall", "date", "mode", "tiledData", "indexVal"]);

// 弹窗响应式
const bsModalData = reactive({
  visible: false,
  optionInfo: {},
});

// 基础计算属性
const 期权名称 = computed(() => {
  const type = props.isCall ? "C" : "P";
  const month = dayjs(props.date, "YYYY-MM-DD").format("M月");
  return props.row[type + month + "期权名称"];
});
const current期权Item = computed(() => props.tiledData?.find((el) => el["期权名称"] === 期权名称.value) || {});

// 期权单项快捷取值（减少重复访问current期权Item.value）
const optionItem = computed(() => current期权Item.value);
const optionLimitShow = computed(() => !!optionItem.value["_限制展示"] || !!optionItem.value["_限制展示_有持仓"]);

// 持仓相关
const 持仓 = computed(() => optionItem.value["持仓"]);
const 持仓变化 = computed(() => optionItem.value["持仓变化"]);
const isShow持仓 = computed(() => !!持仓.value || !!持仓变化.value);
const 盈亏 = computed(() => (一手价.value - 一手成本价.value) * (持仓.value || 0));
const 仓位 = computed(() => (持仓.value || 0) * (一手价.value || 0));

// 行情数值
const 一手价 = computed(() => optionItem.value["一手价"]);
const 一手成本价 = computed(() => optionItem.value["一手成本价"]);
const 一手涨跌价 = computed(() => optionItem.value["一手涨跌价"]);
const 涨跌率 = computed(() => optionItem.value["涨跌率"]);
const 收益率 = computed(() => optionItem.value["收益率"]);
const 总投入 = computed(() => optionItem.value["总投入"]);
const 仓位率 = computed(() => optionItem.value["仓位率"]);

// 标的基础字段（打印行使用）
const deltaVal = computed(() => optionItem.value["Delta"]);
const 溢价率Val = computed(() => optionItem.value["溢价率"]);
const 隐波Val = computed(() => optionItem.value["隐波"]);

// 字段显示公共方法（模板复用，无需新增外部方法）
const showField = (fieldName) => {
  const list = props.indexVal;
  return !list?.length || list.includes(fieldName);
};

// 外层容器样式（打印模式，mode 仍作为背景策略入参）
const wrapperStyle = computed(() => {
  const baseStyle = {
    padding: "35px 0 5px 0",
    height: "83px",
    border: 持仓.value > 0 ? "3px solid red" : 持仓.value < 0 ? "3px solid green" : "",
  };
  const grayStyle = { background: "white", filter: "grayscale(0.25)" };
  const 实值Style = { background: "#F6FFDC" };
  const holdBgStyle = { background: "rgba(246, 255, 220, 0.35)" };
  const holdChangeStyle = { background: "rgba(0, 0, 0, 0.4)", filter: "grayscale(0.25)" };

  const item = optionItem.value;
  let finalStyle = { ...baseStyle };

  switch (props.mode) {
    case "spaces":
    case "chance":
      finalStyle = { ...finalStyle, ...(item["_isChance"] ? 实值Style : grayStyle) };
      break;
    case "hold":
      if (item["持仓"]) {
        finalStyle = { ...finalStyle, ...holdBgStyle };
      } else if (item["持仓变化"]) {
        finalStyle = { ...finalStyle, ...holdChangeStyle };
      }
      break;
  }
  // 限制展示：有持仓时边框置灰
  if (持仓.value && optionLimitShow.value) {
    finalStyle = { ...finalStyle, border: "3px solid #aaaaaa", filter: "grayscale(0.25)" };
  }
  // 限制展示：浅灰背景
  if (optionLimitShow.value) {
    finalStyle = { ...finalStyle, background: "rgb(235, 235, 235)" };
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

<style lang="less" scoped>
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

.print-text-large {
  .text-limit-show-mode * {
    color: gray !important;
    border-color: #aaaaaa !important;

    filter: grayscale(1);
    font-size: 0.85em !important;
  }
}

.borderRed {
  border: 1px solid red;
}

.borderGreen {
  border: 1px solid green;
}
</style>
