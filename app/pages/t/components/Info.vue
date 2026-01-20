<template>
  <div class="grid grid-cols-2 gap-[3px]" v-if="!props.row?._split && !props.row?._current">
    <div>
      <TagIv :隐波="隐波" :正股代码="正股代码" />
    </div>
    <div>
      <TagDelta :Delta="Delta" :正股代码="正股代码" />
    </div>
    <div>
      <TagPremium :溢价率="溢价率" :正股代码="正股代码" />
    </div>
    <div>
      <TagLeverage :杠杆="杠杆" :正股代码="正股代码" />
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["row"]);
const 正股代码 = computed(() => {
  return props.row["正股代码"];
});
const 隐波 = computed(() => {
  return props.row["隐波"];
});
const Delta = computed(() => {
  return props.row["Delta"];
});
const 溢价率 = computed(() => {
  return props.row["溢价率"];
});
const 杠杆 = computed(() => {
  return props.row["杠杆"];
});
</script>
