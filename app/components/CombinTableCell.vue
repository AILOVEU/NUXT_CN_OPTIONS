<template>
  <template v-if="Array.isArray(props.value)">
    <div class="flex gap-[12px] items-center justify-between" v-if="props.showDiff">
      <div>{{ diffValue }}</div>
      <div class="text-[#dcdada]">
        <div>{{ props.value[0] }}</div>
        <div>{{ props.value[1] }}</div>
      </div>
    </div>

    <div v-else>
      <div>
        <div>{{ props.value[0] }}</div>
        <div>{{ props.value[1] }}</div>
      </div>
    </div>
  </template>
  <template v-else>
    {{ props.value }}
  </template>
</template>

<script setup>
import { formatDecimal } from "~/utils/utils";
const props = defineProps(["value", "showDiff"]);

const diffValue = computed(() => {
  if (Array.isArray(props.value)) {
    const diff = props.value[0] - props.value[1];
    return formatDecimal(diff, 3);
  }
});
</script>
