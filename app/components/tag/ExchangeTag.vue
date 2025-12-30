<template>
    <el-tag type="info" size="small" effect="plain">
      <div :style="{ color: 涨跌 > 0 ? 'red' : 'green' }">
       
      </div>
    </el-tag>
  </template>
  <script setup>
  const props = defineProps(["涨跌"]);

  </script>
  