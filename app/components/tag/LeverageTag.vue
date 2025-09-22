<template>
  <el-tag
    type="info"
    size="small"
  >
    杠 {{ props.杠杆?.toFixed(1) }}
  </el-tag>
</template>
<script setup>
import { stock_show_name_map } from "~/data";
const props = defineProps(["杠杆", "正股代码"]);
</script>
