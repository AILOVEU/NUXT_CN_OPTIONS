<template>
  <ChartCard title="期权希腊字暴露" :desc="`按行权价聚合的 Δ / Γ / VEGA 暴露（×1e8）`">
    <VChart v-if="opt" :option="opt" autoresize />
  </ChartCard>
</template>
<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import ChartCard from './ChartCard.vue'
import { BASE_OPT, AXIS } from './lib'
const props = defineProps({ e: { type: Object, default: null } })
const opt = computed(() => {
  const e = props.e; if (!e || !e.byStrike) return null
  const rows = e.byStrike
  const f = x => x == null ? null : +(x / 1e8).toFixed(2)
  return {
    ...BASE_OPT,
    xAxis: { type: 'category', data: rows.map(r => r.K), name: '行权价', ...AXIS },
    yAxis: { type: 'value', name: '暴露', ...AXIS },
    series: [
      { name: 'Δ', type: 'line', smooth: true, symbol: 'none', data: rows.map(r => f(r.delta)), lineStyle: { width: 2, color: '#e02020' }, itemStyle: { color: '#e02020' } },
      { name: 'Γ', type: 'line', smooth: true, symbol: 'none', data: rows.map(r => f(r.gamma)), lineStyle: { width: 2, color: '#7a5af8' }, itemStyle: { color: '#7a5af8' } },
      { name: 'VEGA', type: 'line', smooth: true, symbol: 'none', data: rows.map(r => f(r.vega)), lineStyle: { width: 2, color: '#2f6feb' }, itemStyle: { color: '#2f6feb' } },
    ],
  }
})
</script>
