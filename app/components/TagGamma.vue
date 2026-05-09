<!-- 正股变动1000元 , Delta 变动 Gamma*10 -->

<template>
  <MyTag label="Gam" :value="props.value * 10" :cfg="cfg">{{ (props.value * 10).toFixed(1) }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [0, 15, "black"],
  [15, 20, "black"],
  [20, 30, "orange"],
  [30, 40, "red"],
  [40, 999, "bg-red"],
];
</script>
