<template>
  <div v-if="props.row._split" style="background-color: black">
    &nbsp;
  </div>
  <div
    v-else-if="!props.row?._current && 最新价"
    class="p-[2px] w-[200px] h-[64px] flex flex-col justify-center relative px-[6px] mx-auto"
    :style="style"
  >
    <HoldTag :持仓="持仓" v-if="持仓" />
    <div class="whitespace-nowrap">
      <PriceTag :最新价="最新价" />
      <DiffTag :涨跌="涨跌" />
    </div>

    <div class="flex justify-between whitespace-nowrap">
      <div class="whitespace-nowrap">
        <IvTag :隐波="隐波" :正股="正股代码" />
      </div>
      <div class="whitespace-nowrap">
        <DeltaTag :Delta="Delta" :正股="正股代码" />
      </div>
    </div>
    <div v-if="持仓">
      <div class="flex justify-between whitespace-nowrap">
        <div class="whitespace-nowrap">
          <el-tag type="info" size="small" effect="plain">
            仓 {{ 仓位 }} ({{ 仓位占比.toFixed(2) }}%)
          </el-tag>
        </div>
        <div class="whitespace-nowrap">
          <el-tag
            :type="盈亏 > 0 ? 'danger' : 'success'"
            size="small"
            effect="plain"
          >
            {{ 盈亏 > 0 ? "盈" : "亏" }} {{ 盈亏 }}
          </el-tag>
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
import { useMoneyStore } from "~/stores/useMoneyStore";

import { UNIT } from "~/data";
import { getColorSplitHander, toPrice } from "~//utils";
import HoldTag from "../tag/HoldTag.vue";
const { money } = useMoneyStore();
const props = defineProps(["row", "isCall", "date"]);
const prefixKey = computed(() => {
  const type = props.isCall ? "C" : "P";
  const month = dayjs(props.date, "YYYYMMDD").format("M月");
  return type + month;
});
const 正股代码 = computed(() => {
  return props.row["正股代码"];
});
const 隐波 = computed(() => {
  return props.row[prefixKey.value + "隐波"];
});
const Delta = computed(() => {
  return props.row[prefixKey.value + "Delta"];
});
const 溢价 = computed(() => {
  return props.row[prefixKey.value + "溢价"];
});
const 持仓 = computed(() => {
  return props.row[prefixKey.value + "持仓"];
});
const 最新价 = computed(() => {
  return toPrice(props.row[prefixKey.value + "最新价"]);
});
const 昨收 = computed(() => {
  return toPrice(props.row[prefixKey.value + "昨收"]);
});
const 涨跌 = computed(() => {
  return 最新价.value - 昨收.value;
});
const 成本价 = computed(() => {
  return toPrice(props.row[prefixKey.value + "成本价"]);
});
const 盈亏 = computed(() => {
  return (最新价.value - 成本价.value) * 持仓.value;
});

const 仓位 = computed(() => {
  return 持仓.value * 最新价.value;
});

const 仓位占比 = computed(() => {
  return (100 * 仓位.value) / money.基础金额;
});

const greenColorHandler = getColorSplitHander("#F0FFF0", "#006400");
const redColorHandler = getColorSplitHander("#FFE4E1", "#FF0000");

const style = computed(() => {
  if (持仓.value > 0)
    return {
      border: "2px solid red",
      backgroundColor: redColorHandler(Math.abs(仓位占比.value * 2)),
    };
  if (持仓.value < 0) {
    return {
      border: "2px solid green",
      backgroundColor: greenColorHandler(Math.abs(仓位占比.value * 2)),
    };
  }

  return {};
});
</script>
