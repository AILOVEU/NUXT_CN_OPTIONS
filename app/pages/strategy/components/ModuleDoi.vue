<template>
  <ChartCard v-if="e" title="当日新增持仓 ΔOI 分布" :desc="`到期日 ${e.label}｜净 ΔOI ${wan(e.netDeltaOI)}｜主力增强方向 ${e.domOi>0?'认购(偏多)':e.domOi<0?'认沽(偏空)':'均衡'}`">
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
    yAxis: { type: 'value', name: 'ΔOI（张）', ...AXIS },
    series: [{ name: 'ΔOI（认购-认沽）', type: 'bar', barWidth: '62%',
      data: rows.map(r => ({ value: +(r.dcOI - r.dpOI).toFixed(0), itemStyle: { color: (r.dcOI - r.dpOI) >= 0 ? '#e02020' : '#12a05c' } })) }],
  }
})
</script>
