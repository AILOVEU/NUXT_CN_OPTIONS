<template>
  <div class="w-full h-[50px] flex items-center">
    <div class="basis-[180px] flex-shrink-0 mr-[4px] text-center">{{ props.title }}</div>
    <div class="flex items-center rounded-[25px] w-full h-[50px] min-w-[700px]">
      <div
        v-for="item in computedList"
        class="h-full flex items-center px-[15px] whitespace-nowrap"
        :style="{
          width: item.percent + '%',
          background: item.background,
          borderRadius: item.borderRadius,
          justifyContent: item.justifyContent,
        }"
      >
        <div>
          {{ item.title }}：<span class="font-semibold text-[30px] mr-[10px]">{{ formatNumberToWan(item.value) }}</span
          >({{ item.percent }}%)
        </div>
      </div>
    </div>
    <div class="basis-[150px] flex-shrink-0">&nbsp;</div>
  </div>
</template>
<script setup>
import { formatDecimal, formatNumberToWan } from "~/utils/utils";
const props = defineProps(["title", "list"]);

const computedList = computed(() => {
  let list = props.list.filter((el) => !!el.value);
  let sum = 0;
  list.forEach((el) => {
    sum += Math.abs(el.value || 0);
  });
  return list.map((el, index) => {
    let borderRadius = "0 0 0 0";
    let justifyContent = "flex-start";
    if (index === 0) {
      borderRadius = "15px 0 0 15px";
    } else if (index === list.length - 1) {
      borderRadius = "0 15px 15px 0";
      justifyContent = "flex-end";
    } else if (list.length === 1) {
      borderRadius = "15px 15px 15px 15px";
    }
    return {
      ...el,
      justifyContent,
      borderRadius,
      percent: formatDecimal(100 * (Math.abs(el.value) / sum), 0),
    };
  });
});
</script>
