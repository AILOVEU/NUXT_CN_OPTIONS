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
  <div v-else-if="!props.row?._current && 一手价"
    class="p-[4px] relative flex flex-col gap-[3px]" :style="wrapperStyle">
    <!-- 限制展示：整块置灰（重复普通展示内容） -->
    <div v-if="optionLimitShow" class="w-full h-full text-limit-show-mode">
      <!-- 顶部：持仓（左） + 涨跌（右） -->
      <div class="flex justify-between items-start">
        <div v-if="isShow持仓" class="flex items-center gap-[2px]">
          <TagHold :showPlus="true" v-if="持仓变化" :value="持仓变化" /><span v-if="持仓变化">{{ "→" }}</span>
          <div class="inline-block rounded-md" :class="{ borderRed: 持仓 > 0, borderGreen: 持仓 < 0 }">
            <TagHold :value="持仓 || 0" />
          </div>
        </div>
        <div>
          <TagDiff :value="一手涨跌价" :涨跌率="涨跌率" />
        </div>
      </div>
      <!-- 中间：价格 + 实值标签 -->
      <div class="flex gap-[5px] items-center flex-wrap">
        <TagPrice :value="一手价" />
        <TagAimPrice v-if="showField('打和点')" :value="打和点Val" />
        <TagRealLevel :value="档位" :档位名称="档位名称" />
      </div>
      <!-- 底部：希腊字母等核心指标 -->
      <div class="flex gap-[4px] items-center flex-wrap text-[12px]">
        <TagDelta :value="deltaVal" :正股="正股代码Val" />
        <TagIv :value="隐波Val" :正股="正股代码Val" />
        <TagPremium :value="溢价率Val" />
        <TagLeverage :value="杠杆Val" />
      </div>
      <!-- 持仓专属行 -->
      <div v-if="持仓" class="flex gap-[4px] items-center flex-wrap text-[12px]">
        <TagCostPrice :value="一手成本价" />
        <TagHoldPercent :value="仓位" :仓位占比="仓位率" :总投入="总投入" />
        <TagHoldDiffPercent :value="盈亏" :收益率="收益率" />
      </div>
    </div>

    <!-- 普通展示 -->
    <template v-else>
      <!-- 顶部：持仓（左） + 涨跌（右） -->
      <div class="flex justify-between items-start">
        <div v-if="isShow持仓" class="flex items-center gap-[2px]">
          <TagHold :showPlus="true" v-if="持仓变化" :value="持仓变化" /><span v-if="持仓变化">{{ "→" }}</span>
          <div class="inline-block rounded-md" :class="{ borderRed: 持仓 > 0, borderGreen: 持仓 < 0 }">
            <TagHold :value="持仓 || 0" />
          </div>
        </div>
        <div>
          <TagDiff :value="一手涨跌价" :涨跌率="涨跌率" />
        </div>
      </div>
      <!-- 中间：价格 + 实值标签 -->
      <div class="flex gap-[5px] items-center flex-wrap">
        <TagPrice :value="一手价" />
        <TagAimPrice v-if="showField('打和点')" :value="打和点Val" />
        <TagRealLevel :value="档位" :档位名称="档位名称" />
      </div>
      <!-- 底部：希腊字母等核心指标 -->
      <div class="flex gap-[4px] items-center flex-wrap text-[12px]">
        <TagDelta :value="deltaVal" :正股="正股代码Val" />
        <TagIv :value="隐波Val" :正股="正股代码Val" />
        <TagPremium :value="溢价率Val" />
        <TagLeverage :value="杠杆Val" />
      </div>
      <!-- 持仓专属行 -->
      <div v-if="持仓" class="flex gap-[4px] items-center flex-wrap text-[12px]">
        <TagCostPrice :value="一手成本价" />
        <TagHoldPercent :value="仓位" :仓位占比="仓位率" :总投入="总投入" />
        <TagHoldDiffPercent :value="盈亏" :收益率="收益率" />
      </div>
    </template>
  </div>
  <!-- 无一手价：整格置灰（参考 InfoBlank） -->
  <div v-else-if="!props.row?._current" :style="无一手价样式"></div>
</template>

<script setup>
import dayjs from "dayjs";
import { useMoneyStore } from "~/stores/useMoneyStore";
import { useGlobal } from "~/stores/useGlobal.js";

// 全局、仓库
const { globalLoading, isMobile } = useGlobal();
const { money } = useMoneyStore();

// props（移动端完整展示）
const props = defineProps(["row", "isCall", "date", "tiledData", "indexVal"]);

// 基础计算属性
const 期权名称 = computed(() => {
  const type = props.isCall ? "C" : "P";
  const month = dayjs(props.date, "YYYY-MM-DD").format("M月");
  return props.row[type + month + "期权名称"];
});
const current期权Item = computed(() => props.tiledData?.find((el) => el["期权名称"] === 期权名称.value) || {});

// 期权单项快捷取值
const optionItem = computed(() => current期权Item.value);
const optionLimitShow = computed(() => !!optionItem.value["_限制展示"] || !!optionItem.value["_限制展示_有持仓"]);
const indexValMatchScale = computed(() => [1, 2, 3, 4].includes(props.indexVal.length));

// 标的基础字段
const 正股代码Val = computed(() => optionItem.value["正股代码"]);
const deltaVal = computed(() => optionItem.value["Delta"]);
const 溢价率Val = computed(() => optionItem.value["溢价率"]);
const 隐波Val = computed(() => optionItem.value["隐波"]);
const 打和点Val = computed(() => optionItem.value["打和点"]);
const 杠杆Val = computed(() => optionItem.value["杠杆"]);

// 持仓相关
const 持仓 = computed(() => optionItem.value["持仓"]);
const 持仓变化 = computed(() => optionItem.value["持仓变化"]);
const isShow持仓 = computed(() => !!持仓.value || !!持仓变化.value);
const 盈亏 = computed(() => (一手价.value - 一手成本价.value) * (持仓.value || 0));
const 仓位 = computed(() => (持仓.value || 0) * (一手价.value || 0));

// 行情数值
const 档位 = computed(() => optionItem.value["档位"]);
const 档位名称 = computed(() => optionItem.value["档位名称"]);
const 一手价 = computed(() => optionItem.value["一手价"]);
const 一手成本价 = computed(() => optionItem.value["一手成本价"]);
const 一手涨跌价 = computed(() => optionItem.value["一手涨跌价"]);
const 涨跌率 = computed(() => optionItem.value["涨跌率"]);
const 收益率 = computed(() => optionItem.value["收益率"]);
const 总投入 = computed(() => optionItem.value["总投入"]);
const 仓位率 = computed(() => optionItem.value["仓位率"]);

// 字段显示公共方法
const showField = (fieldName) => {
  const list = props.indexVal;
  return !list?.length || list.includes(fieldName);
};

// 外层容器样式（移动端）
const wrapperStyle = computed(() => {
  const baseStyle = {
    border: 持仓.value > 0 ? "2px solid red" : 持仓.value < 0 ? "2px solid green" : "",
    // 撑满单元格，避免限制展示时灰底未铺满、上下露白
    height: "100%",
  };
  let finalStyle = { ...baseStyle };

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

// 无一手价：整格置灰（参考 InfoBlank，高度撑满单元格）
const 无一手价样式 = computed(() => ({
  height: "100%",
  background: "rgb(235, 235, 235)",
}));

</script>

<style lang="less" scoped>
.borderRed {
  border: 1px solid red;
}

.borderGreen {
  border: 1px solid green;
}

.text-limit-show-mode * {
  color: gray !important;
  border-color: #aaaaaa !important;
  filter: grayscale(1);
}
</style>
