<template>
  <div v-if="持仓" class="flex flex-col justify-center">
    <div class="flex justify-between items-center max-w-[200px] mx-auto">
      <div>
        <div><el-tag type="info" size="small">最新</el-tag>{{ 一手价 }}</div>
        <div><el-tag type="info" size="small">成本</el-tag>{{ 一手成本价 }}</div>
      </div>
      <div class="px-[3px]">*{{ 持仓 }}</div>
      <div>
        <div><el-tag type="info" size="small">仓位</el-tag>{{ 一手价 * 持仓 }}</div>
        <div>
          <el-tag type="info" size="small"> 盈亏 </el-tag>
          <span :style="{ color: 盈亏 > 0 ? 'red' : 'green' }">{{ 盈亏 }}</span>
        </div>
      </div>
    </div>
    <div :style="{ color: 持仓 > 0 ? 'red' : 'green' }" class="h-[12px] leading-[16px] align-bottom">
      {{ 持仓Str }}
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["row"]);
const 一手价 = computed(() => {
  return props.row["一手价"];
});
const 一手成本价 = computed(() => {
  return props.row["一手成本价"];
});
const 持仓 = computed(() => {
  return props.row["持仓"];
});
const 盈亏 = computed(() => {
  return (一手价.value - 一手成本价.value) * 持仓.value;
});

const 持仓Str = computed(() => {
  let str = "";
  for (let i = 0; i < Math.abs(持仓.value); i++) {
    str += "*";
  }
  return str;
});
</script>
