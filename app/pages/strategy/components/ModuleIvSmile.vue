<template>
  <ChartCard v-if="e" title="波动率微笑" :desc="`到期日 ${e.label}（${e.days}天）｜ATM IV ${fmt(e.atmIV,1)}｜偏度 ${fmt(e.skew,1)}｜25ΔRR ${fmt(e.rr25,2)}`">
    <VChart v-if="opt" :option="opt" autoresize />
  </ChartCard>
</template>
<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import ChartCard from './ChartCard.vue'
import { BASE_OPT, AXIS, fmt } from './lib'
const props = defineProps({ e: { type: Object, default: null } })
const opt = computed(() => {
  const e = props.e; if (!e || !e.byStrike) return null
  const rows = e.byStrike
  return {
    ...BASE_OPT,
    xAxis: { type: 'category', data: rows.map(r => r.K), name: '行权价', ...AXIS },
    yAxis: { type: 'value', name: 'IV %', scale: true, ...AXIS },
    series: [
      { name: '认购 IV', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, data: rows.map(r => r.cIV == null ? null : +r.cIV.toFixed(2)),
        lineStyle: { width: 2, color: '#e02020' }, itemStyle: { color: '#e02020' } },
      { name: '认沽 IV', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, data: rows.map(r => r.pIV == null ? null : +r.pIV.toFixed(2)),
        lineStyle: { width: 2, color: '#12a05c' }, itemStyle: { color: '#12a05c' } },
    ],
  }
})
</script>
