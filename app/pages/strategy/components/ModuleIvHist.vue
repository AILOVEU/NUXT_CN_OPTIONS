<template>
  <ChartCard v-if="e" title="IV 历史分布" :desc="`到期日 ${e.label}｜当前 ATM IV 处于样本 ${fmt(e.ivPct?e.ivPct.pct:0,0)} 分位（basis ${e.ivPct?e.ivPct.basis:0}）`">
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
  const e = props.e; if (!e || !e.ivHist || !e.ivHist.length) return null
  const arr = e.ivHist
  const bins = 18, lo = Math.min(...arr), hi = Math.max(...arr), w = (hi - lo) / bins || 1
  const counts = new Array(bins).fill(0)
  arr.forEach(v => { counts[Math.min(bins - 1, Math.floor((v - lo) / w))]++ })
  const cur = e.atmIV, cbin = Math.min(bins - 1, Math.floor((cur - lo) / w))
  return {
    ...BASE_OPT,
    xAxis: { type: 'category', data: counts.map((_, i) => +(lo + (i + .5) * w).toFixed(1)), name: 'ATM IV %', ...AXIS },
    yAxis: { type: 'value', name: '天数', ...AXIS },
    series: [{ name: '天数', type: 'bar', barWidth: '92%',
      data: counts.map((c, i) => ({ value: c, itemStyle: { color: i === cbin ? '#e02020' : 'rgba(47,111,235,.55)' } })) }],
  }
})
</script>
