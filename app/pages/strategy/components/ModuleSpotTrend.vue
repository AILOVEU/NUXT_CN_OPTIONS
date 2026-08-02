<template>
  <ChartCard v-if="u" title="标的历史走势" :desc="`窗口 ${hist.length} 个交易日｜当前 ${fmt(u.spot,3)}｜区间涨跌 ${sign(u.ret*100)}${fmt(u.ret*100,1)}%`">
    <VChart v-if="opt" :option="opt" autoresize />
  </ChartCard>
</template>
<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import ChartCard from './ChartCard.vue'
import { BASE_OPT, AXIS, fmt, sign } from './lib'
const props = defineProps({ u: { type: Object, default: null }, hist: { type: Array, default: () => [] } })
const opt = computed(() => {
  const h = props.hist; if (!h || !h.length) return null
  return {
    ...BASE_OPT,
    xAxis: { type: 'category', data: h.map(x => x.d.slice(5)), boundaryGap: false, ...AXIS },
    yAxis: { type: 'value', scale: true, ...AXIS },
    series: [
      { name: '收盘', type: 'line', smooth: true, symbol: 'none', data: h.map(x => +x.s.toFixed(3)),
        lineStyle: { width: 2, color: '#1f2329' }, areaStyle: { color: 'rgba(31,35,41,.05)' } },
      ...(h.some(x => x.ma5 != null) ? [{ name: 'MA5', type: 'line', smooth: true, symbol: 'none', data: h.map(x => x.ma5 == null ? null : +x.ma5.toFixed(3)), lineStyle: { width: 1.4, color: '#7a5af8' }, itemStyle: { color: '#7a5af8' } }] : []),
      ...(h.some(x => x.ma10 != null) ? [{ name: 'MA10', type: 'line', smooth: true, symbol: 'none', data: h.map(x => x.ma10 == null ? null : +x.ma10.toFixed(3)), lineStyle: { width: 1.4, color: '#2f6feb' }, itemStyle: { color: '#2f6feb' } }] : []),
    ],
  }
})
</script>
