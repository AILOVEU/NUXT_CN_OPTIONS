<template>
  <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold">
      <span class="h-[13px] w-[3px] rounded-[2px]" :style="{ background: accent }"></span>{{ title }}
    </div>
    <div v-if="desc" class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">{{ desc }}</div>
    <div class="chart" :class="{ tall }">
      <slot>
        <VChart :option="option" autoresize />
      </slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  desc: { type: String, default: '' },
  accent: { type: String, default: '#2f6feb' },
  option: { type: Object, default: () => ({}) },
  tall: { type: Boolean, default: false },
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
.chart.tall { height: 360px }
.chart :deep(.echarts) { width: 100%; height: 100% }
</style>
