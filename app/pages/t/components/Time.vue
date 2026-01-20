<template>
  <div v-if="!props.row?._split && !props.row?._current">
    <div class="flex justify-between w-full border-b-[1px] pb-[2px]">
      <el-tag type="info" size="small">时</el-tag>
      <div :style="{ color: 一手时间价 < 0 ? 'red' : '' }">{{ 一手时间价 }}</div>
      <el-tag type="info" size="small">实</el-tag>
      <div>{{ 一手内在价 }}</div>
    </div>
    <div class="flex justify-center pt-[2px]">
      {{ 一手价 }}
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["row"]);
const 一手价 = computed(() => {
  return props.row["一手价"];
});

const 一手时间价 = computed(() => {
  return props.row["一手时间价"];
});
const 一手内在价 = computed(() => {
  return props.row["一手内在价"];
});
</script>
