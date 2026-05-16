<!-- 时间价值 -->
<template>
  <MyTag label="时" :value="props.value" :cfg="cfg"> {{ props.value }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
import { 最大建议买入时间价 } from "~/data";
const cfg = [
  [-999999, -1000, "bg-green"],
  [-1000, -100, "green"],
  [-100, 最大建议买入时间价, "black"],
  [最大建议买入时间价, 999999, "red"],
];
</script>
