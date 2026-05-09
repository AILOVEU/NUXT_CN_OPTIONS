<!-- <template>
  <el-tag :type="type" size="small" :effect="effect">
    <div class="inline-block" style="font-size: 10px !important">损</div>
    <div class="inline-block ml-[1px]">{{ props.value }}</div>
  </el-tag>
</template>
<script setup>
const props = defineProps(["value"]);
const effect = computed(() => {
  // const absGamma = Math.abs(props.value);
  // if(absGamma > 2) return 'dark'
  // if(absGamma > 1.5) return 'light'
  return "plain";
});
const type = computed(() => {
  // const absGamma = Math.abs(props.value);
  // if(absGamma > 1.5) return 'success'
  return "info";
});
</script> -->

<template>
  <MyTag label="损" :value="props.value" :cfg="cfg">
    {{ props.value }}
  </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [-999, 15, "black"],
  [15, 30, "orange"],
  [30, 50, "red"],
  [50, 999, "bg-red"],
];
</script>
