<template>
  <el-tag
    type="info"
    size="small"
    effect='plain'
  >
  杠杆 {{ props.杠杆.toFixed(1) }}
  </el-tag>
</template>
<script setup>
const props = defineProps(["杠杆", "正股代码"]);
</script>
