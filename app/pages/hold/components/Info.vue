<template>
  <div v-if="props.row._split" style="background-color: black">&nbsp;</div>
  <div v-else-if="props.row._current" style="background-color: #e5effe">&nbsp;</div>

  <div v-else-if="!props.row?._current && 一手价" class="p-[2px] h-[150px] max-md:h-[225px] flex flex-col justify-center relative px-[4px] mx-auto" :style="style">
    <div v-if="持仓" class="absolute top-[2px] left-[2px] flex flex-row max-md:flex-col-reverse items-start gap-[3px]">
      <div class="rounded-[50%] h-[16px] leading-[16px] text-[white] font-semibold px-[4px]" :style="{ backgroundColor: 持仓 > 0 ? 'red' : 'green' }">{{ 持仓 }}</div>
      <div class="whitespace-nowrap font-[600] leading-[16px]" :style="{ color: 盈亏 > 0 ? 'red' : 'green' }">{{ 盈亏 > 0 ? "盈" : "亏" }}:{{ 盈亏 }}</div>
    </div>
    <div class="absolute top-[2px] right-[2px] rounded-[5px] h-[16px] leading-[16px] bg-[white] font-[600] px-[4px]" :style="{ color: 一手涨跌价 > 0 ? 'red' : 'green' }">{{ 一手涨跌价 > 0 ? "涨" : "跌" }}:{{ 一手涨跌价 > 0 ? "↑" + 一手涨跌价 : "↓" + Math.abs(一手涨跌价) }}</div>
    <div class="absolute bottom-[2px] left-[2px] rounded-[5px] h-[16px] leading-[16px] bg-[white] font-[600] px-[4px]">内:{{ 一手内在价 }}</div>
    <div class="absolute bottom-[2px] right-[2px] rounded-[5px] h-[16px] leading-[16px] bg-[white] font-[600] px-[4px]">时:{{ 一手时间价 }}</div>
    <div class="flex gap-[2px] justify-center whitespace-nowrap max-md:flex-col pt-[2px]">
      <div class="whitespace-nowrap">
        <PriceTag :一手价="一手价" />
      </div>
      <div class="whitespace-nowrap">
        <PremiumTag :溢价率="溢价" />
      </div>
    </div>
    <div class="flex gap-[2px] justify-center whitespace-nowrap max-md:flex-col pt-[2px]">
      <div class="whitespace-nowrap">
        <el-tag type="info" size="small" effect="plain"> 打和 {{ 打和点 }} </el-tag>
      </div>
      <div class="whitespace-nowrap">
        <LeverageTag :杠杆="杠杆" />
      </div>
    </div>
    <div class="flex gap-[2px] justify-center whitespace-nowrap max-md:flex-col">
      <div class="whitespace-nowrap">
        <GammaTag :Gamma="Gamma" />
      </div>
    </div>

    <div class="flex gap-[2px] justify-center whitespace-nowrap max-md:flex-col">
      <div class="whitespace-nowrap">
        <IvTag :隐波="隐波" :正股="正股代码" />
      </div>
      <div class="whitespace-nowrap">
        <DeltaTag :Delta="Delta" :正股="正股代码" />
      </div>
    </div>
    <div v-if="持仓">
      <div class="flex justify-center whitespace-nowrap max-md:flex-col">
        <div class="whitespace-nowrap">
          <CostPriceTag :一手成本价="一手成本价" />
        </div>
        <div class="whitespace-nowrap">
          <el-tag type="info" size="small" effect="plain">仓{{ 仓位 }}({{ formatDecimal(仓位占比, 2) }}%)</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import dayjs from "dayjs";
import DeltaTag from "~/components/tag/DeltaTag.vue";
import IvTag from "~/components/tag/IvTag.vue";
import PriceTag from "~/components/tag/PriceTag.vue";
import DiffTag from "~/components/tag/DiffTag.vue";
import RoundDiffTag from "~/components/tag/RoundDiffTag.vue";
import GammaTag from "~/components/tag/GammaTag.vue";
import LeverageTag from "~/components/tag/LeverageTag.vue";
import PremiumTag from "~/components/tag/PremiumTag.vue";
import CostPriceTag from "~/components/tag/CostPriceTag.vue";
import { useMoneyStore } from "~/stores/useMoneyStore";
import { getColorSplitHander } from "~/utils/color";
import HoldTag from "~/components/tag/HoldTag.vue";
// import { useMediaQuery } from "@vueuse/core";
import { formatDecimal } from "~/utils/utils";

// const isMobile = useMediaQuery("(max-width: 768px)");
const { money } = useMoneyStore();
const props = defineProps(["row", "isCall", "date", "mode", "formData"]);
const prefixKey = computed(() => {
  const type = props.isCall ? "C" : "P";
  const month = dayjs(props.date, "YYYYMMDD").format("M月");
  return type + month;
});
const 正股代码 = computed(() => {
  return props.row["正股代码"];
});
const 到期日 = computed(() => {
  return props.row[prefixKey.value + "到期日"];
});
const 隐波 = computed(() => {
  return props.row[prefixKey.value + "隐波"];
});
const Gamma = computed(() => {
  return props.row[prefixKey.value + "Gamma"];
});
const Delta = computed(() => {
  return props.row[prefixKey.value + "Delta"];
});
const 溢价 = computed(() => {
  return props.row[prefixKey.value + "溢价率"];
});
const 杠杆 = computed(() => {
  return props.row[prefixKey.value + "杠杆"];
});
const 持仓 = computed(() => {
  return props.row[prefixKey.value + "持仓"];
});
const 一手价 = computed(() => {
  return props.row[prefixKey.value + "一手价"];
});
const 一手时间价 = computed(() => {
  return props.row[prefixKey.value + "一手时间价"];
});
const 一手内在价 = computed(() => {
  return props.row[prefixKey.value + "一手内在价"];
});
const 打和点 = computed(() => {
  return props.row[prefixKey.value + "打和点"];
});
const 一手涨跌价 = computed(() => {
  return props.row[prefixKey.value + "一手涨跌价"];
});
const 一手成本价 = computed(() => {
  return props.row[prefixKey.value + "一手成本价"];
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
  // const width = isMobile.value ? "120px" : "154px";
  if (props.mode === "hold") {
    if (持仓.value > 0)
      return {
        // width,
        border: "4px solid red",
        // backgroundColor: redColorHandler(Math.abs(仓位占比.value * 2)),
      };
    if (持仓.value < 0) {
      return {
        // width,
        border: "4px solid green",
        // backgroundColor: greenColorHandler(Math.abs(仓位占比.value * 2)),
      };
    }
  } else if (props.mode === "chance") {
    let isChance = true;
    const formData = props.formData;

    if (formData.过滤持有) {
      if (formData.过滤持有 === "权利" && 持仓.value <= 0) {
        isChance = false;
      }
      if (formData.过滤持有 === "义务" && 持仓.value >= 0) {
        isChance = false;
      }
      if (formData.过滤持有 === "持有" && !持仓.value) {
        isChance = false;
      }
    }
    if (溢价.value < formData.溢价Range[0] || 溢价.value > formData.溢价Range[1]) {
      isChance = false;
    }
    if (一手价.value < formData.一手价Range[0] || 一手价.value > formData.一手价Range[1]) {
      isChance = false;
    }
    if (Math.abs(Delta.value) < formData.DeltaRange[0] || Math.abs(Delta.value) > formData.DeltaRange[1]) {
      isChance = false;
    }
    if (Math.abs(Gamma.value) < formData.GammaRange[0] || Math.abs(Gamma.value) > formData.GammaRange[1]) {
      isChance = false;
    }
    if (!formData.到期日List.includes(到期日.value)) {
      isChance = false;
    }
    if (isChance) {
      return {
        // width,
        // border: "2px solid green",
        backgroundColor: "#b5e6f1",
      };
    }
  }
  return {};
  // return { width };
});
</script>
