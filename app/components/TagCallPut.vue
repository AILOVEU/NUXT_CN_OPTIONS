<template>
    <el-tag v-if="props.value === '沽'" type="success">
        <span>沽</span>
    </el-tag>
    <el-tag v-if="props.value === '购'" type="danger">
        <span>购</span>
    </el-tag>
  </template>
  <script setup>
  const props = defineProps(['value'])
  </script>
  