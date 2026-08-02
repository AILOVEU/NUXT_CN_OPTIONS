<template>
  <ChartCard title="波动率象限图" :desc="`横轴＝IV 历史分位，纵轴＝VRP；右上待回调、左下可持有、左上做多波动、右下卖波动`">
    <VChart v-if="opt" :option="opt" autoresize />
  </ChartCard>
</template>
<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import ChartCard from './ChartCard.vue'
import { BASE_OPT, AXIS, fmt } from './lib'
const props = defineProps({ underlyings: { type: Array, default: () => [] } })
const opt = computed(() => {
  const us = props.underlyings; if (!us || !us.length) return null
  const pts = us.map(u => ({ name: u.NAME, v: [(u.ivPct ? u.ivPct.pct : 0), +(u.expiries[0].atmIV - u.hv.hvBlend).toFixed(1)] }))
  return {
    ...BASE_OPT,
    grid: { left: 56, right: 30, top: 40, bottom: 46 },
    xAxis: { type: 'value', name: 'IV 分位 %', min: 0, max: 100, ...AXIS },
    yAxis: { type: 'value', name: 'VRP (IV-HV)', ...AXIS },
    series: [{
      type: 'scatter', symbolSize: 16, data: pts.map(p => ({ name: p.name, value: p.v })),
      label: { show: true, position: 'right', fontSize: 10, color: '#1f2329', formatter: p => p.name },
      itemStyle: { color: p => (p.value[0] >= 75 ? '#e02020' : p.value[0] >= 50 ? '#f5a623' : p.value[0] >= 25 ? '#3a9d6b' : '#2f6feb') },
      markLine: { silent: true, symbol: 'none', lineStyle: { color: '#c9cfd8', type: 'dashed' }, data: [{ xAxis: 50 }, { yAxis: 0 }] },
    }],
  }
})
</script>
