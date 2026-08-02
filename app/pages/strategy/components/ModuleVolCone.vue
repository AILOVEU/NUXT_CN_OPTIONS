<template>
  <ChartCard v-if="u && u.cone && u.cone.length" title="波动率锥 Volatility Cone" :desc="`当前 20 日 HV ${fmt(u.hv.hv20,1)}% 处于近1年 ${fmt(u.hvPct.pct,0)} 分位（基于 ${u.hvPct.basis} 个样本）`">
    <VChart v-if="opt" :option="opt" autoresize />
  </ChartCard>
</template>
<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import ChartCard from './ChartCard.vue'
import { BASE_OPT, AXIS, fmt } from './lib'
const props = defineProps({ u: { type: Object, default: null } })
const opt = computed(() => {
  const u = props.u; const z = u.cone; if (!z || !z.length) return null
  return {
    ...BASE_OPT,
    xAxis: { type: 'category', data: z.map(x => x.label), ...AXIS },
    yAxis: { type: 'value', name: 'HV %', min: 0, ...AXIS },
    series: [
      { name: 'P90', type: 'line', stack: 'p90', areaStyle: { color: 'rgba(224,32,32,.07)' }, lineStyle: { opacity: 0 }, symbol: 'none', data: z.map(x => +x.p90.toFixed(2)) },
      { name: 'P10–P90', type: 'line', stack: 'p10p90', areaStyle: { color: 'rgba(224,32,32,.05)' }, lineStyle: { opacity: 0 }, symbol: 'none', data: z.map(x => +(x.p90 - x.p10).toFixed(2)) },
      { name: 'P10', type: 'line', lineStyle: { opacity: 0 }, symbol: 'none', data: z.map(x => +x.p10.toFixed(2)), tooltip: { show: false } },
      { name: 'P25–P75', type: 'line', stack: 'p25p75', areaStyle: { color: 'rgba(47,111,235,.12)' }, lineStyle: { opacity: 0 }, symbol: 'none', data: z.map(x => +(x.p75 - x.p25).toFixed(2)) },
      { name: 'P25', type: 'line', lineStyle: { opacity: 0 }, symbol: 'none', data: z.map(x => +x.p25.toFixed(2)), tooltip: { show: false } },
      { name: 'P50 中位', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, data: z.map(x => +x.p50.toFixed(2)),
        lineStyle: { width: 2, color: '#2f6feb' }, itemStyle: { color: '#2f6feb' } },
      { name: '当前 HV', type: 'line', smooth: true, symbol: 'diamond', symbolSize: 7, data: z.map(x => +x.cur.toFixed(2)),
        lineStyle: { width: 2.4, color: '#e02020' }, itemStyle: { color: '#e02020' } },
    ],
  }
})
</script>
