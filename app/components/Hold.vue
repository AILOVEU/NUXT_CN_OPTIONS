<template>
  <div class="flex justify-between items-center" v-if="持仓">
    <div>
      <div>{{ 最新价 }}</div>
      <div>{{ 成本价 }}</div>
    </div>
    <div class="px-[12px]">*{{ 持仓 }}</div>
    <div>
      <div>{{ 最新价 * 持仓 }}</div>
      <div>{{ (最新价 - 成本价) * 持仓 }}</div>
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
</script>
