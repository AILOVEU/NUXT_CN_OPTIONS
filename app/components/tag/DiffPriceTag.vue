<template>
  <el-tag :type="type" size="small" :effect="effect">
    {{ 最新价 }}
  </el-tag>
</template>
<script setup>
import { 最大建议买入价, UNIT } from "~/data";
import { toFixed } from "~/utils";
const props = defineProps([
  "正股代码",
  "diffValue",
  "current期权Item",
  "spread期权Item",
]);
const 最新价 = computed(() => {
  return toFixed(
    props.current期权Item?.["卖一"] * UNIT -
      props.spread期权Item?.["买一"] * UNIT,
    0
  );
});
const type = computed(() => {
  if (最新价.value > props.diffValue * 5) return "info";
  if (
    最新价.value >= props.diffValue * 3 &&
    最新价.value <= props.diffValue * 5
  )
    return "success";
  if (
    最新价.value >= props.diffValue * 2 &&
    最新价.value <= props.diffValue * 3
  )
    return "success";
  return "primary";
});
const effect = computed(() => {
  if (props.current期权Item["溢价率"] > 10) return "plain";
  if (props.spread期权Item?.["买一"] < 0.02) return "plain"; // 限制义务仓最小价
  if (
    (props.current期权Item?.["卖一"] - props.spread期权Item?.["买一"]) /
      props.spread期权Item?.["买一"] >
    2
  )
    return "plain";
  if (最新价.value > 最大建议买入价) return "plain";
  if (最新价.value > props.diffValue * 5) return "plain";
  if (
    最新价.value >= props.diffValue * 3 &&
    最新价.value <= props.diffValue * 5
  )
    return "plain";
  if (
    最新价.value >= props.diffValue * 2 &&
    最新价.value <= props.diffValue * 3
  )
    return "dark";
  return "dark";
});
</script>
