<!-- 虚实度 -->
<template>
  <MyTag label="" :value="props.value" :cfg="cfg"> {{ props.档位名称 }} </MyTag>
</template>
<script setup>
const props = defineProps(["value", "档位名称"]);
const cfg = [
  // [-99, -5, ""],
  [-99, -6, "bg-green"],
  [-6, -1, "green"],
  [-1, 0, "black"],
  [0, 5, "red"],
  [5, 99, "bg-red"],
  // [5, 99, ""],
];
</script>
