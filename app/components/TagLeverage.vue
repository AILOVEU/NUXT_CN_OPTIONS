<template>
  <el-tag type="info" size="small" effect="plain">
    <div class="inline-block" style="font-size: 10px !important">杠</div>
    <div class="inline-block ml-[1px]">{{ props.value.toFixed(1) }}</div>
  </el-tag>
</template>
<script setup>
const props = defineProps(["value", "正股代码"]);
</script>
