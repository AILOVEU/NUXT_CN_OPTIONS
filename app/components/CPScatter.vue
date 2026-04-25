<template>
  <VChart :option="option" style="height: 300px; width: 100%; margin: auto" />
</template>
<script setup>
const props = defineProps(["option"]);
const option = computed(() => {
  return props.option;
});
</script>
