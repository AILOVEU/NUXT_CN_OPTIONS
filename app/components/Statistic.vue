<template>
  <div class="min-w-[200px]">
    <div class="w-full text-center">{{ title }}</div>
    <div class="w-full text-center mt-[12px]">{{ value }}</div>
  </div>
</template>
<script setup>
const props = defineProps(["title", "value"]);
</script>
