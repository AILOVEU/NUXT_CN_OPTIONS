<template>
  <MyTag label="价" :value="一手价" :cfg="cfg">
    <div class="inline-block">{{ 一手价 }}</div>
  </MyTag>
  <MyTag label="目标" :value="一手价" :cfg="cfg">
    <div class="inline-block">{{ props.diffValue * 10 }}</div>
  </MyTag>
</template>
<script setup>
import { 建议买入价 } from "~/data";
const props = defineProps(["正股代码", "diffValue", "current期权Item", "spread期权Item"]);
const 一手价 = computed(() => {
  return props.current期权Item?.["一手卖一价"] - props.spread期权Item?.["一手买一价"];
});
const cfg = computed(() => {
  if (props.spread期权Item?.["买一"] < 0.015) return [[-999999, 999999, "gray"]]; // 限制义务仓最小价
  if ((props.current期权Item?.["卖一"] - props.spread期权Item?.["买一"]) / props.spread期权Item?.["买一"] > 2) return [[-999999, 999999, "gray"]];
  if (一手价.value > 建议买入价) return [[-999999, 999999, "gray"]];
  return [
    [0, props.diffValue * 2, "bg-blue"],
    [props.diffValue * 2, props.diffValue * 3, "green"],
    [props.diffValue * 3, props.diffValue * 5, "bg-green"],
    [props.diffValue * 5, 999999, "green"],
  ];
});
</script>
