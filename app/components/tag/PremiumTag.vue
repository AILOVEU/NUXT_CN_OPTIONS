<template>
  <el-tag
    type="info"
    size="small"
  >
    溢 {{ props.溢价率 }}%
  </el-tag>
</template>
<script setup>
import { stock_show_name_map } from "~/data";
const props = defineProps(["溢价率", "正股代码"]);
</script>
