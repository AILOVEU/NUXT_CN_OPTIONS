<template>
  <div v-if="false">{{ props.row }}</div>
  <div v-else-if="props.row._split" style="background-color: #576a8f" class="h-[10px]">&nbsp;</div>
  <div v-else-if="props.row._current" style="background-color: #dff1f1; height: 22px">&nbsp;</div>

  <div @click="handleShowBs" v-else-if="!props.row?._current && 一手价" class="p-[2px] cursor-pointer relative border-[black]" :style="wrapperStyle" :class="{ 'print-text-large': isPrint }">
    <div v-if="持仓" class="absolute top-[0px] left-[0px]">
      <div class="inline-block rounded-md" :style="{ border: 持仓 > 0 ? '1px solid red' : '1px solid green' }"><TagHold :value="持仓" /></div>
      <div class="inline-block text-[12px]">{{ 盈亏 }}</div>
    </div>
    <div class="absolute top-[0px] right-[0px] max-md:top-[20px]" v-if="!current期权Item['_限制展示']">
      <TagDiff :value="一手涨跌价" :涨跌率="涨跌率" />
    </div>
    <div class="flex flex-col gap-[2px] flex-wrap justify-end stockindex_scale2" v-if="!current期权Item['_限制展示']">
      <TagPrice :value="一手价" />
      <div class="flex gap-[5px] flex-nowrap justify-center">
        <TagDelta :value="current期权Item['Delta']" />
        <TagIv :value="current期权Item['隐波']" />
      </div>
    </div>
    <div class="flex flex-col gap-[5px] flex-wrap justify-center stockindex_scale2 px-[15px]" v-else>
      <TagPrice :value="一手价" :isGray="true" />
    </div>
  </div>
  <BsModal v-model:visible="bsModalData.visible" :optionInfo="bsModalData.optionInfo" />
</template>

<script setup>
import dayjs from "dayjs";
import { useGlobal } from "~/stores/useGlobal.js";

// 全局、仓库
const { globalLoading } = useGlobal();

// props（筛选模式，参考 stockindex/components/Info.vue 实现；本组件仅 PC 显示）
const props = defineProps(["row", "isCall", "date", "mode", "tiledData", "indexVal"]);

// 弹窗响应式
const bsModalData = reactive({
  visible: false,
  optionInfo: {},
});

// 筛选模式固定常量
const isPrint = false;

// 期权名称（与 SymmetricTable 数据 key 格式保持一致：M月）
const 期权名称 = computed(() => {
  const type = props.isCall ? "C" : "P";
  const month = dayjs(props.date, "YYYY-MM-DD").format("M月");
  return props.row[type + month + "期权名称"];
});
const current期权Item = computed(() => {
  return props.tiledData?.find((el) => el["期权名称"] === 期权名称.value) || {};
});

// 持仓相关
const 持仓 = computed(() => current期权Item.value["持仓"]);
const 持仓变化 = computed(() => current期权Item.value["持仓变化"]);

// 行情数值
const 一手价 = computed(() => current期权Item.value["一手价"]);
const 一手成本价 = computed(() => current期权Item.value["一手成本价"]);
const 一手涨跌价 = computed(() => current期权Item.value["一手涨跌价"]);
const 涨跌率 = computed(() => current期权Item.value["涨跌率"]);

// 盈亏（参考实现：仅持仓时计算）
const 盈亏 = computed(() => (一手价.value - 一手成本价.value) * 持仓.value);

// 外层容器样式（参考实现：mode 作为背景策略；无 in-val 分支）
const wrapperStyle = computed(() => {
  const grayStyle = {
    background: "white",
    filter: "grayscale(0.25)",
  };
  const 实值Style = {
    background: "#F6FFDC",
  };
  let style = {
    padding: isPrint.value ? "32px 0 5px 0" : "22px 0",
    height: "70px",
    border: 持仓.value > 0 ? "3px solid red" : 持仓.value < 0 ? "3px solid green" : "",
  };
  if (props.mode === "custom" || props.mode === "chance") {
    if (!current期权Item.value["_isChance"]) {
      style = { ...style, ...grayStyle };
    } else {
      style = { ...style, ...实值Style };
    }
  } else if (props.mode === "hold") {
    if (current期权Item.value["持仓"]) {
      // 持仓行：保持基础样式
    } else if (current期权Item.value["持仓变化"]) {
      style = { ...style, background: "rgba(0, 0, 0, 0.4)", filter: "grayscale(0.25)" };
    }
  }
  return style;
});

// 点击弹窗
function handleShowBs() {
  bsModalData.optionInfo = current期权Item.value;
  bsModalData.visible = true;
}
</script>

<style lang="less">
/* 👇 打印模式文字放大样式 */
.print-text-large,
.print-text-large * {
  font-size: 23px;
}

.my-tag-wrapper {
  margin-right: -1px;
  margin-left: -1px;
  position: relative;
}

.my-tag-wrapper:hover {
  z-index: 1;
}

.stockindex_scale2 {
  .my-tag-wrapper {
    font-size: 1.3em;
  }

  @media not all and (min-width: 768px) {
    .my-tag-wrapper {
      font-size: 1.3em;
    }
  }
}
</style>
