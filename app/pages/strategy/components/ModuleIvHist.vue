<template>
  <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>隐含波动率历史走势</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">该标的 IV 指数历史序列（vixs.csv），红线为当前 ATM IV 所处水平</div>
    <VChart :option="ivHistOpt" autoresize class="chart" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_PUR, fmt } from './lib'

const props = defineProps({
  u: { type: Object, default: null },
  e: { type: Object, default: null },
})
const U = computed(() => props.u)
const E = computed(() => props.e)

const ivHistOpt = computed(() => {
  const u = U.value; if (!u) return {}
  const d = u.ivHist
  if (!d || !d.length) return { title: { text: '该标的无 IV 历史序列', left: 'center', top: '45%', textStyle: { color: '#8f95a1', fontSize: 13, fontWeight: 400 } } }
  if (!E.value) return { title: { text: '加载中…', left: 'center', top: '45%', textStyle: { color: '#8f95a1', fontSize: 13, fontWeight: 400 } } }
  return Object.assign({}, BASE_OPT, {
    grid: { left: 52, right: 60, top: 26, bottom: 34 }, legend: { show: false },
    xAxis: Object.assign({ type: 'category', data: d.map(x => x.d), axisLabel: { color: '#8f95a1', fontSize: 10, formatter: v => v.replace(/^(\d{4})\/(\d+)\/\d+$/, '$1/$2') } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true }, AXIS),
    dataZoom: [{ type: 'inside', start: 40, end: 100 }, { type: 'slider', height: 14, bottom: 6, borderColor: '#e3e6ea', fillerColor: 'rgba(47,111,235,.08)' }],
    series: [{ type: 'line', data: d.map(x => x.v), symbol: 'none', lineStyle: { width: 1.4, color: C_PUR }, areaStyle: { color: 'rgba(122,90,248,.09)' },
      markLine: { silent: true, symbol: 'none', label: { fontSize: 10, position: 'insideEndTop' }, data: [
        { yAxis: +fmt(E.value.atmIV, 2), lineStyle: { color: C_UP, width: 1.6 }, label: { formatter: '当前 ' + fmt(E.value.atmIV, 1), color: C_UP } },
        { yAxis: u.ivPct ? +fmt(u.ivPct.median, 2) : null, lineStyle: { color: '#8f95a1', type: 'dashed', width: 1 }, label: { formatter: u.ivPct ? '3年中位 ' + fmt(u.ivPct.median, 1) : '3年中位 —', color: '#8f95a1' } },
      ] } }],
  })
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
</style>
