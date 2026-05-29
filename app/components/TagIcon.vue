<!-- 标识 -->
<template>
  <span v-if="label" class="whitespace-nowrap inline-block pt-[1px] pb-[4px] rounded-md font-black text-[14px]">
    <span class="whitespace-nowrap inline-block">{{ label }}</span>
  </span>
</template>
<script setup>
const props = defineProps(["value", "is彩票", "is禁止加仓"]);
const 重点关注期权List = [];
const 零成本期权List = ["300ETF购6月5250", "创业板ETF沽6月3500"];

const label = computed(() => {
  let str = "";
  if (props.is彩票) str += "🎯";
  if (props.is禁止加仓) str += "🚫";
  if (重点关注期权List.includes(props.value)) str += "⭐️";
  if (零成本期权List.includes(props.value)) str += "0️⃣";
  return str;
});
const cfg = [];
</script>
