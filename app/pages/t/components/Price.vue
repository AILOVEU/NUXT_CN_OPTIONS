<template>
  <div v-if="!props.row?._split && !props.row?._current" class="flex items-center flex-row-reverse justify-center w-[120px] mx-auto" :style="{ flexDirection: isCall ? 'row' : 'row-reverse' }">
    <div class="p-[3px]">{{ 买一 }}</div>
    <div class="w-[55px] flex flex-col items-center">
      <div class="w-full text-center border-b-[1px]">差:{{ 差价 }}</div>

      <div class="w-full text-center">
        <TagPrice :value="一手价" />
      </div>
    </div>
    <div class="p-[3px]">{{ 卖一 }}</div>
  </div>
</template>
<script setup>
const props = defineProps(["row"]);
const 一手价 = computed(() => {
  return props.row["一手价"];
});
const 买一 = computed(() => {
  return props.row["一手买一价"];
});
const 卖一 = computed(() => {
  return props.row["一手卖一价"];
});
const isCall = computed(() => {
  return props.row["沽购"] === "购";
});
const 差价 = computed(() => {
  if (!买一.value || !卖一.value) return "";
  return 卖一.value - 买一.value;
});
</script>
