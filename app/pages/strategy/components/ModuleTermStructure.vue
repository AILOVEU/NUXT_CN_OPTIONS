<template>
  <ChartCard v-if="u && u.expiries && u.expiries.length" title="波动率期限结构" :desc="`近月 ATM IV ${fmt(u.expiries[0].atmIV,1)} → 远月 ${fmt(u.expiries[u.expiries.length-1].atmIV,1)}｜结构${u.termSlope>0?'近低远高(Contango)':'近高远低(倒挂)'}`">
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
  const u = props.u; if (!u || !u.expiries || !u.expiries.length) return null
  return {
    ...BASE_OPT,
    xAxis: { type: 'category', data: u.expiries.map(e => e.label), ...AXIS },
    yAxis: { type: 'value', name: 'IV %', ...AXIS },
    series: [
      { name: 'ATM IV', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, data: u.expiries.map(e => +e.atmIV.toFixed(2)),
        lineStyle: { width: 2.5, color: '#2f6feb' }, itemStyle: { color: '#2f6feb' }, areaStyle: { color: 'rgba(47,111,235,.08)' } },
      { name: 'IVxHV(偏高判据)', type: 'line', smooth: true, symbol: 'none', data: u.expiries.map(e => +e.ivxhv.toFixed(2)),
        lineStyle: { width: 1.6, color: '#e02020', type: 'dashed' }, itemStyle: { color: '#e02020' } },
    ],
  }
})
</script>
