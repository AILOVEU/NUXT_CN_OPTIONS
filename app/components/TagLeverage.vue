<template>
  <el-tag type="info" size="small" effect="plain">
    <span class="text-[9px]">杠</span>
    <div class="inline-block ml-[1px]">{{ props.value.toFixed(1) }}</div>
  </el-tag>
</template>
<script setup>
const props = defineProps(["value", "正股代码"]);
</script>
