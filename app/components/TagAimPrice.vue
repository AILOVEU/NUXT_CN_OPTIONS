<!-- 打和点 -->
<template>
  <MyTag label="和" :value="props.value" :cfg="cfg"> {{ props.value }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [[0, 999999, "black"]];
</script>
