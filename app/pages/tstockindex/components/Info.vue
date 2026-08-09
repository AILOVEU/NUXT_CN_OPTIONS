<template>
  <div class="grid grid-cols-2 gap-[3px]" v-if="!props.row?._split && !props.row?._current">
    <div>
      <TagIv :value="隐波" :正股代码="正股代码" />
    </div>
    <div>
      <TagDelta :value="Delta" :正股代码="正股代码" />
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
</script>
