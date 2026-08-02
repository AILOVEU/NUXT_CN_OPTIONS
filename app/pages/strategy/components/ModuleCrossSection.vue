<template>
  <ChartCard title="全标的波动率横截面" :desc="`IV 历史分位横截面（基于各标的近1年 IV 样本）｜颜色越红＝越贵`">
    <VChart v-if="opt" :option="opt" autoresize />
  </ChartCard>
</template>
<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import ChartCard from './ChartCard.vue'
import { BASE_OPT, AXIS } from './lib'
const props = defineProps({ underlyings: { type: Array, default: () => [] } })
const opt = computed(() => {
  const us = props.underlyings; if (!us || !us.length) return null
  return {
    ...BASE_OPT,
    xAxis: { type: 'category', data: us.map(u => u.NAME), ...AXIS },
    yAxis: { type: 'value', name: 'IV 分位 %', min: 0, max: 100, ...AXIS },
    series: [
      { name: 'IV 历史分位', type: 'bar', barWidth: '52%',
        data: us.map(u => ({ value: +(u.ivPct ? u.ivPct.pct : 0).toFixed(0), itemStyle: { color: (function (p) { return p >= 75 ? '#e02020' : p >= 50 ? '#f5a623' : p >= 25 ? '#3a9d6b' : '#2f6feb' })(u.ivPct ? u.ivPct.pct : 0) } })),
        label: { show: true, position: 'top', fontSize: 10, color: '#5f6672', formatter: p => p.value + '%' } },
      { name: '当前 ATM IV', type: 'line', symbol: 'circle', symbolSize: 6, data: us.map(u => +(u.expiries[0] ? u.expiries[0].atmIV : 0).toFixed(1)),
        lineStyle: { width: 2, color: '#1f2329' }, itemStyle: { color: '#1f2329' }, label: { show: true, position: 'bottom', fontSize: 9, color: '#8f95a1' } },
    ],
  }
})
</script>
