<template>
  <div class="absolute top-0 left-0 rounded-[50%] h-[16px] leading-[16px] text-[white] font-[600] px-[4px]" :style="{ color: props.涨跌 > 0 ? 'red' : 'green' }">
    {{ 涨跌 > 0 ? "涨" : "跌" }}:
    {{ 涨跌 > 0 ? "↑ " + 涨跌 : "↓ " + Math.abs(涨跌) }}
  </div>
</template>
<script setup>
const props = defineProps(["涨跌", "正股代码"]);
const 涨跌 = computed(() => {
  return props.涨跌;
});
</script>
