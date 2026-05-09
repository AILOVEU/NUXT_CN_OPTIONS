<template>
  <MyTag label="内" :value="props.value" :cfg="cfg"> {{ props.value }} </MyTag>
</template>
<script setup>
const props = defineProps(["value"]);
const cfg = [[-999999, 999999, "black"]];
</script>
