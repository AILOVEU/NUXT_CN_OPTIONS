<template>
  <!-- <el-tag :type="type" size="small" :effect="effect">
    <span>本:{{ 一手成本价 }}</span>
  </el-tag> -->

  <MyTag label="本" :value="一手成本价" :cfg="cfg">
    <div class="inline-block">{{ 一手成本价 }}</div>
  </MyTag>
</template>
<script setup>
import { 建议买入价 } from "~/data";
const props = defineProps(["diffValue", "current期权Item", "spread期权Item"]);
const 一手成本价 = computed(() => {
  return props.current期权Item?.["一手成本价"] - props.spread期权Item?.["一手成本价"];
});
// const type = computed(() => {
//   if (一手成本价.value > props.diffValue * 5) return "info";
//   if (一手成本价.value >= props.diffValue * 3 && 一手成本价.value <= props.diffValue * 5) return "success";
//   if (一手成本价.value >= props.diffValue * 2 && 一手成本价.value <= props.diffValue * 3) return "success";
//   return "primary";
// });
// const effect = computed(() => {
//   if (一手成本价.value > 建议买入价) return "plain";
//   if (一手成本价.value > props.diffValue * 5) return "plain";
//   if (一手成本价.value >= props.diffValue * 3 && 一手成本价.value <= props.diffValue * 5) return "plain";
//   if (一手成本价.value >= props.diffValue * 2 && 一手成本价.value <= props.diffValue * 3) return "dark";
//   return "dark";
// });

const cfg = computed(() => {
  if (一手成本价.value > 建议买入价) return [[-999999, 999999, "gray"]];
  return [
    [0, props.diffValue * 2, "bg-blue"],
    [props.diffValue * 2, props.diffValue * 3, "green"],
    [props.diffValue * 3, props.diffValue * 5, "bg-green"],
    [props.diffValue * 5, 999999, "green"],
  ];
});
</script>
