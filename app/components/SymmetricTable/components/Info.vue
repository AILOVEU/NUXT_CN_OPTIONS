<template>
  <div v-if="false">{{ props.row }}</div>
  <div v-else-if="props.row._split" style="background-color: black" class="h-[25px]">&nbsp;</div>
  <div v-else-if="props.row._current" style="background-color: #e5effe">&nbsp;</div>

  <div @click="handleShowBs" v-else-if="!props.row?._current && 一手价" class="p-[2px] h-[150px] cursor-pointer max-md:h-[260px] relative px-[4px]" :style="style">
    <div v-if="持仓" class="absolute top-[2px] left-[2px] flex flex-row max-md:flex-col-reverse items-start gap-[3px]">
      <div class="rounded-[50%] h-[16px] leading-[16px] text-[white] font-semibold px-[4px]" :style="{ backgroundColor: 持仓 > 0 ? 'red' : 'green' }">{{ 持仓 }}</div>
      <div class="whitespace-nowrap font-[600] leading-[16px]" :style="{ color: 盈亏 > 0 ? 'red' : 'green' }">{{ 盈亏 > 0 ? "盈" : "亏" }}:{{ 盈亏 }}</div>
    </div>
    <div class="absolute top-[2px] right-[2px] rounded-[5px] h-[16px] leading-[16px] bg-[white] font-[600] px-[4px]" :style="{ color: 一手涨跌价 > 0 ? 'red' : 'green' }">{{ 一手涨跌价 > 0 ? "涨" : "跌" }}:{{ 一手涨跌价 > 0 ? "↑" + 一手涨跌价 : "↓" + Math.abs(一手涨跌价) }}</div>
    <div class="absolute bottom-[1px] left-[2px] rounded-[5px] h-[16px] leading-[16px] bg-[white] font-[600] px-[4px]">内:{{ current期权Item["一手内在价"] }}</div>
    <div
      class="absolute bottom-[2px] right-[2px] rounded-[5px] h-[16px] leading-[16px] bg-[white] font-[600] px-[4px] text-[14px]"
      :style="{
        color: current期权Item['一手时间价'] > 最大建议买入时间价 ? '#f66602' : 'black',
      }"
    >
      时:{{ current期权Item["一手时间价"] }}
    </div>
    <div class="flex flex-col justify-center mx-auto h-[140px] max-md:h-[260px] max-md:mt-[-5px]" :style="{ transform: [1, 2, 3].includes(props.indexVal.length) ? `scale(1.5)` : '' }">
      <div class="flex gap-[2px] justify-center whitespace-nowrap max-md:flex-col pt-[2px]">
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('一手价')">
          <TagPrice :value="一手价" />
        </div>
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('溢价率')">
          <TagPremium :value="current期权Item['溢价率']" />
        </div>
      </div>
      <div class="flex gap-[2px] justify-center whitespace-nowrap max-md:flex-col pt-[2px]">
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('打和点')">
          <el-tag type="info" size="small" effect="plain"> 打和 {{ current期权Item["打和点"] }} </el-tag>
        </div>
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('杠杆')">
          <TagLeverage :value="current期权Item['杠杆']" />
        </div>
      </div>
      <div class="flex gap-[2px] justify-center whitespace-nowrap max-md:flex-col">
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('隐波')">
          <TagIv :value="current期权Item['隐波']" :正股="current期权Item['正股代码']" />
        </div>
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('Vega')">
          <TagVega :value="current期权Item['Vega']" />
        </div>
      </div>

      <div class="flex gap-[2px] justify-center whitespace-nowrap max-md:flex-col">
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('Delta')">
          <TagDelta :value="current期权Item['Delta']" :正股="current期权Item['正股代码']" />
        </div>
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('Gamma')">
          <TagGamma :value="current期权Item['Gamma']" />
        </div>
      </div>
      <div v-if="持仓">
        <div class="flex justify-center whitespace-nowrap max-md:flex-col gap-[1px]">
          <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('一手成本价')">
            <TagCostPrice :一手成本价="一手成本价" />
          </div>
          <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('仓位')">
            <el-tag type="info" size="small" effect="plain"
              >仓{{ 仓位 }}
              <!-- ({{ formatDecimal(仓位占比, 1) }}%) -->
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
  <BsModal v-model:visible="bsModalData.visible" :optionInfo="bsModalData.optionInfo" />
</template>
<script setup>
import dayjs from "dayjs";
import { useMoneyStore } from "~/stores/useMoneyStore";
import { getColorSplitHander } from "~/utils/color";
import { formatDecimal } from "~/utils/utils";
import { 最大建议买入时间价, 最大建议买入价 } from "~/data";
const bsModalData = reactive({
  visible: false,
  optionInfo: {},
});
const { money } = useMoneyStore();
const props = defineProps(["row", "isCall", "date", "mode", "tiledData", "indexVal"]);
// props.row 示例
// {
//   C1月期权名称: "50ETF购1月3200",
//   P1月期权名称: "50ETF沽1月3200",
//   C2月期权名称: "50ETF购2月3200",
//   P2月期权名称: "50ETF沽2月3200",
//   C3月期权名称: "50ETF购3月3200",
//   P3月期权名称: "50ETF沽3月3200",
//   C6月期权名称: "50ETF购6月3200",
//   P6月期权名称: "50ETF沽6月3200",
//   正股代码: "510050",
//   行权价: 3.2,
//   正股价格: 3.153,
//   千行权价: 3200,
//   is旧期权: false,
// };
const 期权名称 = computed(() => {
  const type = props.isCall ? "C" : "P";
  const month = dayjs(props.date, "YYYY-MM-DD").format("M月");
  return props.row[type + month + "期权名称"];
});
const current期权Item = computed(() => {
  return props.tiledData?.find((el) => el["期权名称"] === 期权名称.value) || {};
});
const 持仓 = computed(() => {
  return current期权Item.value["持仓"];
});
const 一手价 = computed(() => {
  return current期权Item.value["一手价"];
});
const 一手成本价 = computed(() => {
  return current期权Item.value["一手成本价"];
});
const 一手涨跌价 = computed(() => {
  return current期权Item.value["一手涨跌价"];
});

const 盈亏 = computed(() => {
  return (一手价.value - 一手成本价.value) * 持仓.value;
});

const 仓位 = computed(() => {
  return 持仓.value * 一手价.value;
});

const 仓位占比 = computed(() => {
  return (100 * 仓位.value) / money.基础金额;
});

const greenColorHandler = getColorSplitHander("#F0FFF0", "#006400");
const redColorHandler = getColorSplitHander("#FFE4E1", "#FF0000");

const style = computed(() => {
  const grayStyle = {
    background: "#ACBAC4",
    filter: "grayscale(0.75)",
  };
  let style = {
    border: 持仓.value > 0 ? "4px solid red" : 持仓.value < 0 ? "4px solid green" : "",
  };
  if (props.mode === "chance") {
    if (!current期权Item.value["_isChance"]) {
      style = { ...style, ...grayStyle };
    }
  } else if (props.mode === "in-val") {
    if (current期权Item.value["一手内在价"] === 0 || current期权Item.value["一手内在价"] > 最大建议买入价 || current期权Item.value["一手时间价"] > 最大建议买入时间价) {
      style = { ...style, ...grayStyle };
    }
  } else if (props.mode === "hold") {
    if (current期权Item.value["is非法持仓"]) {
      style = { ...style, background: "#FFE2AF" };
    }
  }
  return style;
});
function handleShowBs() {
  // bsModalData.optionInfo = {
  //   正股价格: current期权Item.value["正股价格"],
  //   行权价: current期权Item.value["行权价"],
  //   到期天数: current期权Item.value["到期天数"],
  //   隐波: current期权Item.value["隐波"],
  //   沽购: current期权Item.value["沽购"],
  //   最新价:  current期权Item.value["最新价"],

  //   S: props.row["正股价格"],
  //   K: props.row["行权价"],
  //   r: 0.02,
  //   T: current期权Item.value["到期天数"] / 365,
  //   sigma: (current期权Item.value["隐波"] || 0.01) / 100,
  //   optionType: props.isCall ? "call" : "put",
  //   price: current期权Item.value["最新价"],
  // };
  bsModalData.optionInfo = current期权Item.value;
  bsModalData.visible = true;
}
const vGlass = {
  /**
   * 元素挂载到DOM时执行（替代Vue2的bind）
   * @param el 指令绑定的DOM元素
   * @param binding 指令绑定信息（value为指令值）
   */
  mounted(el, binding) {
    // 根据指令值添加/移除毛玻璃样式
    handleGlassStyle(el, binding.value);
  },
  /**
   * 指令值更新时执行
   */
  updated(el, binding) {
    // 避免重复操作：只有值真正变化时才更新样式
    if (binding.oldValue !== binding.value) {
      handleGlassStyle(el, binding.value);
    }
  },
};
// 封装毛玻璃样式控制逻辑
const handleGlassStyle = (el, isEnable) => {
  if (isEnable) {
    el.classList.add("glass-effect");
  } else {
    el.classList.remove("glass-effect");
  }
};
</script>
<style>
.glass-effect {
  filter: grayscale(0.75);
  /* 模糊核心属性：对元素后方内容模糊 */
  backdrop-filter: blur(40px);
  /* 兼容Chrome/Safari等webkit内核浏览器 */
  -webkit-backdrop-filter: blur(40px);
  /* 半透明背景：毛玻璃效果的关键（不能省略） */
  background-color: #acbac4;
  /* 可选：边框增强质感 */
  border: 1px solid #acbac4;
  /* 可选：阴影提升层次感 */
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
}
</style>
