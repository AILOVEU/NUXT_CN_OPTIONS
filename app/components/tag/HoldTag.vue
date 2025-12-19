<template>
  <div
    class="absolute top-0 left-0 rounded-[50%] h-[16px] leading-[16px] text-[white] font-semibold px-[4px]"
    :style="{ backgroundColor: props.持仓 > 0 ? 'red' : 'green' }"
  >
    {{ props.持仓 }}
  </div>
</template>
<script setup>
const props = defineProps(["持仓"]);
</script>
