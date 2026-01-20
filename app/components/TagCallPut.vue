<template>
    <el-tag v-if="props.value === '沽'" type="success">
        沽
    </el-tag>
    <el-tag v-if="props.value === '购'" type="danger">
        购
    </el-tag>
  </template>
  <script setup>
  const props = defineProps(['value'])
  </script>
  