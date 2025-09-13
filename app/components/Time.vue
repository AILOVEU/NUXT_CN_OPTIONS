<template>
  <div>
    <div class="flex justify-between w-full border-b-[1px]">
      <div>
        <el-tag type="info" size="small">时</el-tag>{{ 时间价值 }}
      </div>
      <div>
        <el-tag type="info" size="small">实</el-tag>{{ 实值价值 }}
      </div>
    </div>
    <div>
      {{ 最新价 }}
    </div>
  </div>
</template>
<script setup>
import { UNIT } from "~/data";
const props = defineProps(["row", "isCall"]);
const callOrPut = computed(() => {
  return props.isCall ? "C" : "P";
});
const 最新价 = computed(() => {
  return Math.floor(props.row[callOrPut.value + "最新价"] * UNIT);
});
const 实值价值 = computed(() => {
  const 行权价 = props.row[callOrPut.value + "行权价"];
  const 正股价格 = props.row["正股价格"];
  if (props.isCall) {
    if (正股价格 > 行权价) return Math.floor((正股价格 - 行权价) * UNIT);
  } else {
    if (正股价格 < 行权价) return Math.floor((行权价 - 正股价格) * UNIT);
  }
  return 0;
});
const 时间价值 = computed(() => {
  return 最新价.value - 实值价值.value;
});
</script>
