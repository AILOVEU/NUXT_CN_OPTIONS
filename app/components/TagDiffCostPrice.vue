<template>
  <el-tag :type="type" size="small" :effect="effect"> 成本:{{ 一手成本价 }} </el-tag>
</template>
<script setup>
import { 建议买入价 } from "~/data";
const props = defineProps(["diffValue", "current期权Item", "spread期权Item"]);
const 一手成本价 = computed(() => {
  return props.current期权Item?.["一手成本价"] - props.spread期权Item?.["一手成本价"];
});
const type = computed(() => {
  if (一手成本价.value > props.diffValue * 5) return "info";
  if (一手成本价.value >= props.diffValue * 3 && 一手成本价.value <= props.diffValue * 5) return "success";
  if (一手成本价.value >= props.diffValue * 2 && 一手成本价.value <= props.diffValue * 3) return "success";
  return "primary";
});
const effect = computed(() => {
  if (一手成本价.value > 建议买入价) return "plain";
  if (一手成本价.value > props.diffValue * 5) return "plain";
  if (一手成本价.value >= props.diffValue * 3 && 一手成本价.value <= props.diffValue * 5) return "plain";
  if (一手成本价.value >= props.diffValue * 2 && 一手成本价.value <= props.diffValue * 3) return "dark";
  return "dark";
});
</script>
