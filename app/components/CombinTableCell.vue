<template>
  <template v-if="Array.isArray(props.value)">
    <div class="flex gap-[12px] items-center justify-between" v-if="props.showDiff">
      <div>{{ format(diffValue) }}</div>
      <div class="text-[#dcdada]">
        <div>{{ format(props.value[0]) }}</div>
        <div>{{ format(props.value[1]) }}</div>
      </div>
    </div>

    <div v-else>
      <div>
        <div>{{ format(props.value[0]) }}</div>
        <div>{{ format(props.value[1]) }}</div>
      </div>
    </div>
  </template>
  <template v-else>
    {{ format(props.value) }}
  </template>
</template>

<script setup>
import { formatDecimal } from "~/utils/utils";
const props = defineProps(["value", "showDiff", "format"]);

const format = computed(() => {
  if (props.format) return props.format;
  return (val) => val;
});

const diffValue = computed(() => {
  if (Array.isArray(props.value)) {
    const diff = props.value[0] - props.value[1];
    return formatDecimal(diff, 3);
  }
});
</script>
