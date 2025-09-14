<template>
  <div class="flex justify-between items-center max-w-[200px] mx-auto" v-if="持仓">
    <div>
      <div><el-tag type="info" size="small">最新</el-tag>{{ 最新价 }}</div>
      <div><el-tag type="info" size="small">成本</el-tag>{{ 成本价 }}</div>
    </div>
    <div class="px-[3px]">*{{ 持仓 }}</div>
    <div>
      <div>
        <el-tag type="info" size="small">仓位</el-tag>{{ 最新价 * 持仓 }}
      </div>
      <div>
        <el-tag type="info" size="small"> 盈亏 </el-tag>
        <span :style="{ color: 盈亏 > 0 ? 'red' : 'green' }">{{ 盈亏 }}</span>
      </div>
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
const 成本价 = computed(() => {
  return Math.floor(props.row[callOrPut.value + "成本价"] * UNIT);
});
const 持仓 = computed(() => {
  return props.row[callOrPut.value + "持仓"];
});
const 盈亏 = computed(() => {
  return (最新价.value - 成本价.value) * 持仓.value;
});
</script>
