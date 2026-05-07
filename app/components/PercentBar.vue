<template>
  <div class="w-full h-[50px] flex items-center">
    <div class="basis-[180px] flex-shrink-0 mr-[4px] text-center">{{ props.title }}</div>
    <!-- 外层容器：相对定位 + overflow-hidden 保证圆角 -->
    <div class="relative flex items-center rounded-[25px] w-full h-[50px] min-w-[700px] overflow-hidden">
      <!-- 进度条背景层：绝对定位，只负责颜色和宽度 -->
      <div
        v-for="(item, index) in computedList"
        :key="index"
        class="absolute top-0 bottom-0"
        :style="{
          left: item.left + '%',
          width: item.percent + '%',
          background: item.background,
          zIndex: 1,
        }"
      />

      <!-- 文字层：绝对定位，宽度100%，不被进度条宽度限制 -->
      <div class="absolute inset-0 flex items-center z-10 pointer-events-none">
        <div
          v-for="(item, index) in computedList"
          :key="`text-${index}`"
          class="h-full flex items-center px-[15px] whitespace-nowrap"
          :style="{
            width: item.percent + '%',
            justifyContent: item.justifyContent,
          }"
        >
          <div class="pointer-events-auto">
            {{ item.title }}：
            <span class="font-semibold text-[30px] mr-[10px]">
              {{ formatNumberToWan(item.value) }}
            </span>
            ({{ item.percent }}%)
          </div>
        </div>
      </div>
    </div>
    <div class="basis-[150px] flex-shrink-0">&nbsp;</div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { formatDecimal, formatNumberToWan } from "~/utils/utils";

const props = defineProps(["title", "list"]);

const computedList = computed(() => {
  let list = props.list.filter((el) => !!el.value);
  let sum = 0;
  list.forEach((el) => {
    sum += Math.abs(el.value || 0);
  });

  // 计算每个条目的左侧偏移量（用于定位背景）
  let left = 0;
  return list.map((el, index) => {
    const percent = formatDecimal(100 * (Math.abs(el.value) / sum), 0);
    let justifyContent = "flex-start";

    if (index === list.length - 1) {
      justifyContent = "flex-end";
    }

    const item = {
      ...el,
      justifyContent,
      percent,
      left: left, // 左侧定位
    };

    left += percent;
    return item;
  });
});
</script>
