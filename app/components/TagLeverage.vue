<template>
  <el-tag type="info" size="small" effect="plain">
    <span>杠</span>
    <div class="inline-block">{{ props.value.toFixed(1) }}</div>
  </el-tag>
</template>
<script setup>
const props = defineProps(["value", "正股代码"]);
</script>
