<template>
  <div
    class="flex items-center flex-row-reverse justify-center w-[120px] mx-auto"
    :style="{ flexDirection: props.isCall ? 'row' : 'row-reverse' }"
    v-if="!props.row?._split && !props.row?._current"
  >
    <div class="p-[12px]">{{ 买一 }}</div>
    <div class="w-[55px] flex flex-col items-center">
      <div class="w-full text-center border-b-[1px]">{{ 差价 }}</div>

      <div class="w-full text-center">
        <PriceTag :最新价="最新价" />
      </div>
    </div>
    <div class="p-[12px]">{{ 卖一 }}</div>
  </div>
</template>
<script setup>
import { UNIT } from "~/data";
import { toPrice } from "~/utils";
import PriceTag from "~/components/tag/PriceTag.vue";
const props = defineProps(["row", "isCall"]);
const callOrPut = computed(() => {
  return props.isCall ? "C" : "P";
});
const 最新价 = computed(() => {
  return toPrice(props.row[callOrPut.value + "最新价"]);
});
const 买一 = computed(() => {
  return toPrice(props.row[callOrPut.value + "买一"]);
});
const 卖一 = computed(() => {
  return toPrice(props.row[callOrPut.value + "卖一"]);
});
const 差价 = computed(() => {
  if (!买一.value || !卖一.value) return "";
  return 卖一.value - 买一.value;
});
</script>
