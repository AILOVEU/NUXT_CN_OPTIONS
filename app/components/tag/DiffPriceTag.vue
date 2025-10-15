<template>
  <el-tag :type="type" size="small" :effect="effect">
    {{ props.最新价 }}
  </el-tag>
</template>
<script setup>
import { stock_show_name_map } from "~/data";
const props = defineProps(["最新价", "正股代码", "diffValue"]);
const type = computed(() => {
  const 最新价 = props.最新价;
  if (最新价 > props.diffValue * 5) return "info";
  if (最新价 >= props.diffValue * 3 && 最新价 <= props.diffValue * 5)
    return "success";
  if (最新价 >= props.diffValue * 2 && 最新价 <= props.diffValue * 3)
    return "success";
  return "primary";
});
const effect = computed(() => {
  const 最新价 = props.最新价;
  if (最新价 > props.diffValue * 5) return "plain";
  if (最新价 >= props.diffValue * 3 && 最新价 <= props.diffValue * 5) return "plain";
  if (最新价 >= props.diffValue * 2 && 最新价 <= props.diffValue * 3) return "dark";
  return "dark";
});
</script>
