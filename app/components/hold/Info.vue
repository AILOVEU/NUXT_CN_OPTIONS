<template>
  <div
    v-if="!props.row?._current && 最新价"
    class="p-[2px] h-[84px] flex flex-col justify-center"
    :style="style"
  >
    <div class="flex justify-between whitespace-nowrap">
      <div class="whitespace-nowrap">
        <el-tag type="info" size="small">隐</el-tag>{{ 隐波 }}
      </div>
      <div class="whitespace-nowrap">
        <el-tag type="info" size="small">δ</el-tag>{{ Delta.toFixed(3) }}
      </div>
    </div>

    <div class="whitespace-nowrap">
      <el-tag type="info" size="small">价</el-tag>{{ 最新价 }}
    </div>
    <div v-if="持仓">
      <div class="flex justify-between whitespace-nowrap">
        <div class="whitespace-nowrap">
          <el-tag type="info" size="small">持</el-tag>{{ 持仓 }}
        </div>
        <div class="whitespace-nowrap">
          <el-tag type="info" size="small">盈</el-tag>
          <span :style="{ color: 盈亏 > 0 ? 'red' : 'green' }">{{ 盈亏 }}</span>
        </div>
      </div>
      <div class="flex justify-between whitespace-nowrap">
        <div class="whitespace-nowrap">
          <el-tag type="info" size="small">仓</el-tag>{{ 仓位 }} ({{
            仓位占比.toFixed(2)
          }}%)
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import dayjs from "dayjs";
import { UNIT, 基础金额 } from "~/data";
import { getColorSplitHander } from "~~/server/api/utils";
const props = defineProps(["row", "isCall", "date"]);
const prefixKey = computed(() => {
  const type = props.isCall ? "C" : "P";
  const month = dayjs(props.date, "YYYYMMDD").format("M月");
  return type + month;
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
  return Math.floor(props.row[prefixKey.value + "最新价"] * UNIT);
});
const 成本价 = computed(() => {
  return Math.floor(props.row[prefixKey.value + "成本价"] * UNIT);
});
const 盈亏 = computed(() => {
  return (最新价.value - 成本价.value) * 持仓.value;
});

const 仓位 = computed(() => {
  return 持仓.value * 最新价.value;
});

const 仓位占比 = computed(() => {
  return (100 * 仓位.value) / 基础金额 ;
});

const greenColorHandler = getColorSplitHander("#F0FFF0", "#006400");
const redColorHandler = getColorSplitHander("#FFE4E1", "#FF0000");

const style = computed(() => {
  if (持仓.value > 0)
    return {
      backgroundColor: redColorHandler(Math.abs(仓位占比.value * 2)),
    };
  if (持仓.value < 0) {
    return {
      backgroundColor: greenColorHandler(Math.abs(仓位占比.value * 2)),
    };
  }

  return {};
});
</script>
