<!-- 正股变动1000元 , Delta 变动 Gamma*10 -->
<template>
  <MyTag label="Gam" :value="props.value * 10" :cfg="cfg">{{ Math.ceil((props.value * 10)) }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [
  [0, 5, "blue"],
  [5, 25, "black"],
  [25, 50, "red"],
  [50, 999, "bg-red"],
];
</script>
