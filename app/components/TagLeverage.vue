<template>
  <el-tag
    type="info"
    size="small"
    effect='plain'
  >
  杠杆 {{ props.value.toFixed(1) }}
  </el-tag>
</template>
<script setup>
const props = defineProps(["value", "正股代码"]);
</script>
