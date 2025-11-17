<template>
    <el-tag v-if="props.沽购 === '沽'" type="success">
        沽
    </el-tag>
    <el-tag v-if="props.沽购 === '购'" type="danger">
        购
    </el-tag>
  </template>
  <script setup>
  const props = defineProps(['沽购'])
  </script>
  