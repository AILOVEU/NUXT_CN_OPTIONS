<template>
  <div class="relative rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="absolute right-3 top-3 z-10 flex gap-1.5">
      <span class="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#8f95a1]">data_etfoption.csv</span>
    </div>
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#12a05c]"></span>希腊字母沿行权价分布</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">Delta / Gamma / Vega / Theta（每张每日元）随行权价的变化</div>
    <VChart :option="greeksOpt" autoresize class="chart tall" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_DN, C_ACC, C_PUR } from './lib'

const props = defineProps({
  byStrike: { type: Array, default: null },
})

const greeksOpt = computed(() => {
  const bs = props.byStrike
  if (!bs || !bs.length) return {}
  const ks = bs.map(b => b.K)
  return Object.assign({}, BASE_OPT, {
    grid: { left: 52, right: 56, top: 34, bottom: 34 },
    legend: { top: 2, data: ['认购Δ', '认沽Δ', 'Γ', 'Vega', '认购Θ(元/日)'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: ks, name: '行权价' }, AXIS),
    yAxis: [Object.assign({ type: 'value', name: 'Δ / Γ / Vega' }, AXIS), Object.assign({ type: 'value', name: 'Θ 元/日', position: 'right', splitLine: { show: false } }, AXIS)],
    series: [
      { name: '认购Δ', type: 'line', data: bs.map(b => b.cDelta), symbol: 'none', lineStyle: { width: 2, color: C_UP }, connectNulls: true },
      { name: '认沽Δ', type: 'line', data: bs.map(b => b.pDelta), symbol: 'none', lineStyle: { width: 2, color: C_DN }, connectNulls: true },
      { name: 'Γ', type: 'line', data: bs.map(b => b.cGamma || b.pGamma), symbol: 'none', lineStyle: { width: 1.8, color: C_PUR }, areaStyle: { color: 'rgba(122,90,248,.10)' }, connectNulls: true },
      { name: 'Vega', type: 'line', data: bs.map(b => b.cVega || b.pVega), symbol: 'none', lineStyle: { width: 1.6, color: C_ACC, type: 'dashed' }, connectNulls: true },
      { name: '认购Θ(元/日)', type: 'bar', yAxisIndex: 1, data: bs.map(b => b.cTheta), itemStyle: { color: 'rgba(245,166,35,.5)' } },
    ],
  })
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
.chart.tall { height: 360px }
</style>
