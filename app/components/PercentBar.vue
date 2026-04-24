<template>
  <div class="mx-auto w-full h-[50px] flex items-center">
    <div class="w-[500px] mr-[4px] text-center">{{ props.title }}</div>
    <div class="flex items-center rounded-[25px] w-full h-[50px]">
      <div
        v-for="item in computedList"
        class="h-full flex items-center px-[30px] whitespace-nowrap"
        :style="{
          width: item.percent + '%',
          background: item.background,
          borderRadius: item.borderRadius,
        }"
      >
        <div>
          {{ item.title }}：<span class="font-semibold text-[30px] mr-[10px]">{{ formatNumberToWan(item.value) }}</span
          >({{ item.percent }}%)
        </div>
      </div>
    </div>
    <div class="w-[500px]" />
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
    if (index === 0) {
      borderRadius = "15px 0 0 15px";
    } else if (index === list.length - 1) {
      borderRadius = "0 15px 15px 0";
    } else if (list.length === 1) {
      borderRadius = "15px 15px 15px 15px";
    }
    return {
      ...el,
      borderRadius,
      percent: formatDecimal(100 * (Math.abs(el.value) / sum), 1),
    };
  });
});
</script>
