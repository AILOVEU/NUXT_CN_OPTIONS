<template>
  <div
    class="flex items-center flex-row-reverse justify-center"
    :style="{ flexDirection: props.isCall ? 'row' : 'row-reverse' }"
  >
    <div class="p-[12px]">{{ 买一 }}</div>
    <div class="w-[60px] flex flex-col items-center">
      <div class="w-full text-center">{{ 差价 }}</div>

      <div class="w-full text-center">
        <el-tag type="primary">{{ 最新价 }}</el-tag>
      </div>
    </div>
    <div class="p-[12px]">{{ 卖一 }}</div>
  </div>
</template>
<script setup>
import { UNIT } from "~/data";
const props = defineProps(["row", "isCall"]);
const callOrPut = computed(() => {
  return props.isCall ? "C" : "P";
});
const 最新价 = computed(() => {
  return Math.floor(props.row[callOrPut.value + "最新价"] * UNIT);
});
const 买一 = computed(() => {
  return Math.floor(props.row[callOrPut.value + "买一"] * UNIT);
});
const 卖一 = computed(() => {
  return Math.floor(props.row[callOrPut.value + "卖一"] * UNIT);
});
const 差价 = computed(() => {
  if (!买一.value || !卖一.value) return "";
  return 卖一.value - 买一.value;
});
</script>
