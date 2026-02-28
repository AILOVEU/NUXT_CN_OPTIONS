<template>
  <div class="min-w-[180px] text-[16px] py-[5px]" :style="style">
    <div class="w-full text-center" :style="titleStyle">{{ title }}</div>
    <div class="w-full text-center mt-[12px]" :style="contentStyle">{{ value }}</div>
  </div>
</template>
<script setup>
const props = defineProps(["title", "value", "style", "titleStyle", "contentStyle"]);
const style = computed(() => props.style || {});
const titleStyle = computed(() => props.titleStyle || {});
const contentStyle = computed(() => props.contentStyle || {});
</script>
