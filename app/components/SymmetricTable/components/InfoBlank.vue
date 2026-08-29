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
    <!-- 左上 -->
    <div v-if="isShow持仓" class="absolute top-[0px] left-[0px]" :class="{ 'text-limit-show-mode': optionLimitShow }">
      <TagHold :showPlus="true" v-if="持仓变化" :value="持仓变化" /><span
        v-if="持仓变化">{{ "→" }}</span>
      <div class="inline-block rounded-md" :class="{ borderRed: 持仓 > 0, borderGreen: 持仓 < 0 }">
        <TagHold :value="isShow持仓 ? 持仓 || 0 : 持仓" />
      </div>
      <TagHoldDiffPercent v-if="持仓" :value="盈亏" :收益率="收益率" :class="{ 'text-limit-show-mode': optionLimitShow }" />
    </div>

    <!-- 限制展示：仅显示一手价 -->
    <div v-if="optionLimitShow" class="flex gap-[5px] text-limit-show-mode">
      <TagPrice :value="一手价" :isGray="true" />
      <TagHoldPercent v-if="持仓" :value="仓位" :仓位占比="0" :总投入="0" />

    </div>

    <!-- 空白模式中间区域 -->
    <div v-else class="flex gap-[5px]">
      <TagPrice :value="一手价" />
      <TagHoldPercent v-if="持仓" :value="仓位" :仓位占比="0" :总投入="0" />
    </div>
  </div>

  <!-- 弹窗 -->
  <BsModal v-model:visible="bsModalData.visible" :optionInfo="bsModalData.optionInfo" />
</template>

<script setup>
import dayjs from "dayjs";
import { useGlobal } from "~/stores/useGlobal.js";

// 全局、仓库
const { globalLoading } = useGlobal();

// props（空白模式，showTypeVal 已内置，不再作为入参）
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
const isShow持仓 = computed(() => !!持仓.value);
const 盈亏 = computed(() => (一手价.value - 一手成本价.value) * (持仓.value || 0));
const 仓位 = computed(() => (持仓.value || 0) * (一手价.value || 0));

// 行情数值
const 一手价 = computed(() => optionItem.value["一手价"]);
const 一手成本价 = computed(() => optionItem.value["一手成本价"]);
const 收益率 = computed(() => optionItem.value["收益率"]);

// 外层容器样式（空白模式，mode 仍作为背景策略入参）
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
        // 空白模式下持仓变化行不保留底色，直接还原基础样式
        finalStyle = { ...baseStyle };
      }
      break;
  }
  // 限制展示：有持仓时边框置灰
  if (持仓.value && optionLimitShow.value) {
    finalStyle = { ...finalStyle, border: "3px solid #aaaaaa", filter: "grayscale(0.25)" };
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

.print-text-large {
  .text-limit-show-mode * {
    color: gray !important;
    border: 0 !important;

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

.text-limit-show-mode * {
  color: gray !important;
  border: 0 !important;
  filter: grayscale(1);
}
</style>
