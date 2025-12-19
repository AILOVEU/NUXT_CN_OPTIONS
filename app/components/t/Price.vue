<template>
  <div
    class="flex items-center flex-row-reverse justify-center w-[120px] mx-auto"
    :style="{ flexDirection: props.isCall ? 'row' : 'row-reverse' }"
    v-if="!props.row?._split && !props.row?._current"
  >
    <div class="p-[3px]">{{ 买一 }}</div>
    <div class="w-[55px] flex flex-col items-center">
      <div class="w-full text-center border-b-[1px]">差:{{ 差价 }}</div>

      <div class="w-full text-center">
        <PriceTag :一手价="一手价" />
      </div>
    </div>
    <div class="p-[3px]">{{ 卖一 }}</div>
  </div>
</template>
<script setup>
import PriceTag from "~/components/tag/PriceTag.vue";
const props = defineProps(["row", "isCall"]);
const callOrPut = computed(() => {
  return props.isCall ? "C" : "P";
});
const 一手价 = computed(() => {
  return props.row[callOrPut.value + "一手价"];
});
const 买一 = computed(() => {
  return props.row[callOrPut.value + "一手买一价"];
});
const 卖一 = computed(() => {
  return props.row[callOrPut.value + "一手卖一价"];
});
const 差价 = computed(() => {
  if (!买一.value || !卖一.value) return "";
  return 卖一.value - 买一.value;
});
</script>
