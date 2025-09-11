<template>
  <div class="grid grid-cols-2 gap-[3px]">
    <div>
      <el-tag type="info" size="small">隐波</el-tag>{{ 隐波.toFixed(2) }}
    </div>
    <div>
      <el-tag type="info" size="small">Delta</el-tag>{{ Delta.toFixed(3) }}
    </div>
    <div>
      <el-tag type="info" size="small">溢价</el-tag>
      {{ 溢价率}}%
    </div>
    <div>
      <el-tag type="info" size="small">杠杆</el-tag>{{ 杠杆.toFixed(1) }}
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["row", "isCall"]);
const callOrPut = computed(() => {
  return props.isCall ? "C" : "P";
});
const 隐波 = computed(() => {
  return props.row[callOrPut.value + "隐波"];
});
const Delta = computed(() => {
  return props.row[callOrPut.value + "Delta"];
});
const 溢价率 = computed(() => {
  return props.row[callOrPut.value + "溢价率"];
});
const 杠杆 = computed(() => {
  return props.row[callOrPut.value + "杠杆"];
});
</script>
