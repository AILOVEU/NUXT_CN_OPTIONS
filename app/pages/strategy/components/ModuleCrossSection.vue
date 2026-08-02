<template>
  <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>六标的横截面：IV vs 实现波动率</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">位于对角线上方＝IV 高于实现波动率（卖方有溢价）；气泡大小＝总持仓量</div>
    <VChart :option="crossOpt" autoresize class="chart" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_DN, fmt, wan, sign, hvFair } from './lib'

const props = defineProps({
  underlyings: { type: Array, default: () => [] },
})

const crossOpt = computed(() => {
  const pts = props.underlyings.map(u => {
    const e = u.expiries[0], hf = hvFair(u)
    const oi = u.expiries.reduce((a, b) => a + b.totalOI, 0)
    return { name: u.short, value: [+fmt(hf, 2), +fmt(e.atmIV, 2), oi] }
  })
  const maxOI = Math.max(...pts.map(p => p.value[2]))
  const mx = Math.max(...pts.map(p => Math.max(p.value[0], p.value[1]))) * 1.12
  const mn = Math.min(...pts.map(p => Math.min(p.value[0], p.value[1]))) * 0.85
  return Object.assign({}, BASE_OPT, {
    grid: { left: 56, right: 30, top: 26, bottom: 38 }, legend: { show: false },
    tooltip: { trigger: 'item', backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#e3e6ea', borderWidth: 1, textStyle: { color: '#1f2329', fontSize: 12 },
      formatter: p => `<b>${p.data.name}</b><br>预期实现波动率 ${p.value[0]}<br>近月 ATM IV ${p.value[1]}<br>风险溢价 ${sign(p.value[1] - p.value[0])}${fmt(p.value[1] - p.value[0], 2)}<br>总持仓 ${wan(p.value[2])} 张` },
    xAxis: Object.assign({ type: 'value', name: '预期实现波动率 %', min: mn, max: mx }, AXIS),
    yAxis: Object.assign({ type: 'value', name: '近月 ATM IV %', min: mn, max: mx }, AXIS),
    series: [
      { type: 'line', data: [[mn, mn], [mx, mx]], symbol: 'none', lineStyle: { color: '#c8cdd6', type: 'dashed', width: 1 }, silent: true, tooltip: { show: false } },
      { type: 'scatter', data: pts, symbolSize: v => 14 + 26 * Math.sqrt(v[2] / maxOI), itemStyle: { color: p => p.value[1] > p.value[0] ? C_UP : C_DN, opacity: .75, borderColor: '#fff', borderWidth: 2 }, label: { show: true, position: 'top', formatter: p => p.data.name, fontSize: 11, color: '#5f6672' } },
    ],
  })
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
</style>
