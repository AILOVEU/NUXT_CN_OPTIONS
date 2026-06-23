<!-- 价格 -->
<template>
  <MyTag label="价" :value="props.value" :cfg="cfg"> {{ props.value }} </MyTag>
</template>
<script setup>
const props = defineProps(["value", "isStockIndex", "isGray"]);
const cfg = computed(() => {
  if (props.isGray) {
    return [[0, 999999, "gray"]];
  }
  // if (props.isStockIndex) {
  //   return [
  //     [0, 500, "blue"],
  //     [500, 1500, "red"],
  //     [1500, 3000, "green"],
  //     [1500, 999999, "gray"],
  //   ];
  // }
  return [
    [0, 150, "blue"],
    [150, 700, "green"],
    [700, 3000, "red"],
    [3000, 999999, "bg-red"],
  ];
});
</script>
