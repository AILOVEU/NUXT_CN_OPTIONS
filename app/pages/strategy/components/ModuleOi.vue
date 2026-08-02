<template>
  <ChartCard v-if="e" title="持仓量 OI 分布" :desc="`到期日 ${e.label}｜总 OI ${wan(e.totalOI)}｜Put/Call OI ${fmt(e.pcOI,2)}`">
    <VChart v-if="opt" :option="opt" autoresize />
  </ChartCard>
</template>
<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import ChartCard from './ChartCard.vue'
import { BASE_OPT, AXIS, wan, fmt } from './lib'
const props = defineProps({ e: { type: Object, default: null } })
const opt = computed(() => {
  const e = props.e; if (!e || !e.byStrike) return null
  const rows = e.byStrike
  return {
    ...BASE_OPT,
    xAxis: { type: 'category', data: rows.map(r => r.K), name: '行权价', ...AXIS },
    yAxis: { type: 'value', name: 'OI（张）', ...AXIS },
    series: [
      { name: '认购 OI', type: 'bar', stack: 'oi', data: rows.map(r => r.cOI || 0), itemStyle: { color: '#e02020' } },
      { name: '认沽 OI', type: 'bar', stack: 'oi', data: rows.map(r => r.pOI || 0), itemStyle: { color: '#12a05c' } },
    ],
  }
})
</script>
