<template>
  <div v-if="false">{{ props.row }}</div>
  <div v-else-if="props.row._split" style="background-color: #576a8f" class="h-[10px]">&nbsp;</div>
  <div v-else-if="props.row._current" style="background-color: #8bdfdd; height: 22px">&nbsp;</div>

  <div @click="handleShowBs" v-else-if="!props.row?._current && 一手价" class="p-[2px] cursor-pointer relative" :style="wrapperStyle" :class="{ 'print-text-large': isPrint }">
    <div v-if="持仓" class="absolute top-[0px] left-[0px] rounded-md" :style="{ border: 持仓 > 0 ? '1px solid red' : '1px solid green' }">
      <TagHold :value="持仓" />
    </div>
    <div v-if="持仓" class="absolute" :class="{ bottomLeft: !isPrint, topLeft: isPrint }">
      <TagHoldDiffPercent :value="盈亏" :收益率="收益率" />
    </div>
    <div class="absolute top-[0px] right-[0px] max-md:top-[20px]">
      <TagDiff :value="一手涨跌价" :涨跌率="涨跌率" />
    </div>

    <!-- <div v-if="!isPrint" class="absolute bottom-[1px] left-[0px]">
      <TagPriceInner :value="current期权Item['一手内在价'] || 0" />
    </div> -->
    <div v-if="!isPrint" class="absolute bottom-[0px] right-[0px] max-md:bottom-[20px]">
      <TagRealLevel :value="档位" :档位名称="档位名称" />
      <!-- <TagPriceTime :value="current期权Item['一手时间价']" /> -->
    </div>
    <div v-if="isPrint" class="flex flex-col justify-center mx-auto gap-[2px]" :style="{ height: '77px', marginTop: '15px', marginLeft: '-45px' }">
      <div class="flex gap-[2px] justify-center flex-wrap max-md:flex-col" :style="{ width: props.innerWidth }">
        <div class="whitespace-nowrap">
          <TagPrice :value="一手价" />
        </div>
        <div class="whitespace-nowrap">
          <TagDelta :value="current期权Item['Delta']" />
        </div>
        <div class="whitespace-nowrap">
          <TagPremium :value="current期权Item['溢价率']" />
        </div>
        <div class="flex gap-[2px] justify-center flex-wrap max-md:flex-col" :style="{ width: props.innerWidth }">
          <div class="whitespace-nowrap">
            <TagIv :value="current期权Item['隐波']" />
          </div>
          <div v-if="持仓" class="whitespace-nowrap">
            <TagCostPrice :value="一手成本价" />
          </div>
          <div v-if="持仓" class="whitespace-nowrap">
            <TagHoldPercent :value="仓位" :仓位占比="仓位率" :isPrint="true" :总投入="总投入" />
          </div>
        </div>
      </div>
    </div>
    <!-- 中间 -->
    <div v-else class="flex flex-col justify-center mx-auto max-md:mt-[-5px] gap-[2px]" :class="{ scale2: [1, 2, 3, 4].includes(props.indexVal.length) }" :style="{ height: isMobile ? '345px' : '165px' }">
      <div class="flex gap-[2px] justify-center flex-wrap max-md:flex-col" :style="{ width: props.innerWidth }">
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('一手价')">
          <TagPrice :value="一手价" />
        </div>
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('打和点')">
          <TagAimPrice :value="current期权Item['打和点']" />
        </div>
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('溢价率')">
          <TagPremium :value="current期权Item['溢价率']" />
        </div>
      </div>
      <div class="flex gap-[2px] justify-center flex-wrap max-md:flex-col" :style="{ width: props.innerWidth }">
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('杠杆')">
          <TagLeverage :value="current期权Item['杠杆']" />
        </div>
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('隐波')">
          <TagIv :value="current期权Item['隐波']" :正股="current期权Item['正股代码']" />
        </div>
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('Delta')">
          <TagDelta :value="current期权Item['Delta']" :正股="current期权Item['正股代码']" />
        </div>
      </div>
      <div class="flex gap-[2px] justify-center flex-wrap max-md:flex-col" :style="{ width: props.innerWidth }">
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('Vega')">
          <TagVega :value="current期权Item['Vega']" />
        </div>
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('Gamma')">
          <TagGamma :value="current期权Item['Gamma']" />
        </div>
        <div class="whitespace-nowrap ml-[4px]" v-if="!props.indexVal.length || props.indexVal.includes('单日损耗')">
          <TagTheta :value="current期权Item['单日损耗']" />
        </div>
      </div>

      <div class="flex gap-[2px] justify-center flex-wrap max-md:flex-col" :style="{ width: props.innerWidth }">
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('持仓量')">
          <TagVolumn :value="持仓量" />
        </div>
        <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('增仓量')">
          <TagVolumnAdd :value="日增量" />
        </div>
      </div>
      <div v-if="持仓">
        <div class="flex justify-center flex-wrap max-md:flex-col gap-[1px]" :style="{ width: props.innerWidth }">
          <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('一手成本价')">
            <TagCostPrice :value="一手成本价" />
          </div>
          <div class="whitespace-nowrap" v-if="!props.indexVal.length || props.indexVal.includes('仓位')">
            <TagHoldPercent :value="仓位" :仓位占比="仓位率" :总投入="总投入" />
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
import { useGlobal } from "~/stores/useGlobal.js";
const { globalLoading, isMobile } = useGlobal();

const bsModalData = reactive({
  visible: false,
  optionInfo: {},
});
const { money } = useMoneyStore();
const props = defineProps(["row", "isCall", "date", "mode", "tiledData", "indexVal", "showTypeVal", "innerWidth"]);
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
const isPrint = computed(() => props.showTypeVal === "打印");
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
const 日增量 = computed(() => {
  return current期权Item.value["日增"];
});
const 持仓量 = computed(() => {
  return current期权Item.value["持仓量"];
});
const 档位 = computed(() => {
  return current期权Item.value["档位"];
});
const 档位名称 = computed(() => {
  return current期权Item.value["档位名称"];
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

const 总投入 = computed(() => {
  return current期权Item.value["总投入"];
});

const 涨跌率 = computed(() => {
  return current期权Item.value["涨跌率"];
});

const 收益率 = computed(() => {
  return current期权Item.value["收益率"];
});
const 盈亏 = computed(() => {
  return (一手价.value - 一手成本价.value) * 持仓.value;
});

const 盈亏百分比 = computed(() => {
  return (一手价.value - 一手成本价.value) / 一手成本价.value;
});

const 仓位 = computed(() => {
  return 持仓.value * 一手价.value;
});

const 仓位率 = computed(() => {
  return current期权Item.value["仓位率"];
});

const greenColorHandler = getColorSplitHander("#F0FFF0", "#006400");
const redColorHandler = getColorSplitHander("#FFE4E1", "#FF0000");

const wrapperStyle = computed(() => {
  const grayStyle = {
    background: "white",
    filter: "grayscale(0.25)",
  };
  const 实值Style = {
    background: "#F6FFDC",
    // filter: "grayscale(0.75)",
  };
  let style = {
    height: isPrint.value ? "83px" : isMobile ? "340px" : "170px",
    border: 持仓.value > 0 ? "1px solid red" : 持仓.value < 0 ? "1px solid green" : "",
  };
  if (props.mode === "custom") {
    if (!current期权Item.value["_isChance"]) {
      style = { ...style, ...grayStyle };
    } else {
      style = { ...style, ...实值Style };
    }
  } else if (props.mode === "chance") {
    if (!current期权Item.value["_isChance"]) {
      style = { ...style, ...grayStyle };
    } else {
      style = { ...style, ...实值Style };
    }
  } else if (props.mode === "in-val") {
    if (current期权Item.value["一手内在价"] === 0 || current期权Item.value["一手内在价"] > 最大建议买入价 || current期权Item.value["一手时间价"] > 最大建议买入时间价) {
      style = { ...style, ...grayStyle };
    } else {
      style = { ...style, ...实值Style };
    }
  } else if (props.mode === "hold") {
    if (current期权Item.value["持仓"]) {
      style = { ...style, background: "#F6FFDC" };
    }
  }
  return style;
});
function handleShowBs() {
  return;
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
<style lang="less">
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
/* 👇 打印模式文字放大样式 */
.print-text-large,
.print-text-large * {
  font-size: 23px;
}
.bottomLeft {
  bottom: 0px;
  left: 0px;
}
.topLeft {
  top: 0px;
  left: 35px;
}
/* 添加到你的全局样式或组件样式中 */
.my-tag-wrapper {
  /* 关键：让相邻标签的圆角重叠，覆盖中间的三角形空白 */
  margin-right: -1px;
  margin-left: -1px;

  /* 可选：提高z-index，让hover状态的标签显示在最上层 */
  position: relative;
}

.my-tag-wrapper:hover {
  z-index: 1;
}
.scale2 {
  .my-tag-wrapper {
    font-size: 2.5em;
  }
  @media not all and (min-width: 768px) {
    .my-tag-wrapper {
      font-size: 1.5em;
    }
  }
}
</style>
