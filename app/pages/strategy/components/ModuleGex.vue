<template>
  <ChartCard v-if="e" title="Gamma 暴露 GEX 分布" :desc="`到期日 ${e.label}｜净 GEX ${wan(e.gex)}｜零界点 ${fmt(e.zeroG,3)}（GEX 翻转处，常成支撑/阻力）`">
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
    yAxis: { type: 'value', name: 'GEX', ...AXIS },
    series: [{ name: 'GEX', type: 'bar', barWidth: '62%',
      data: rows.map(r => ({ value: +(r.gex / 1e8).toFixed(2), itemStyle: { color: r.gex >= 0 ? '#12a05c' : '#e02020' } })),
      markLine: { silent: true, symbol: 'none', lineStyle: { color: '#1f2329', type: 'dashed' }, data: [{ xAxis: e.zeroG }] } }],
  }
})
</script>
