<template>
  <div class="relative rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="absolute right-3 top-3 z-10 flex gap-1.5">
      <span class="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#8f95a1]">data_etfoption.csv</span>
      <span class="rounded bg-[#fef3e2] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#b8860b]">vixs.csv</span>
    </div>
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>隐含波动率历史走势</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">该标的 IV 指数历史序列（vixs.csv），红线为当前 ATM IV 所处水平</div>
    <VChart :option="ivHistOpt" autoresize class="chart" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_PUR, fmt } from './lib'

const props = defineProps({
  ivHist: { type: Array, default: null },
  ivPct: { type: Object, default: null },
  atmIV: { type: Number, default: null },
})

const ivHistOpt = computed(() => {
  const d = props.ivHist
  if (!d || !d.length) return Object.assign({}, BASE_OPT, {
    title: { text: '该标的无 IV 历史序列', left: 'center', top: '45%', textStyle: { color: '#8f95a1', fontSize: 13, fontWeight: 400 } },
    xAxis: [], yAxis: [], series: [],
  })
  if (props.atmIV == null) return Object.assign({}, BASE_OPT, {
    title: { text: '加载中…', left: 'center', top: '45%', textStyle: { color: '#8f95a1', fontSize: 13, fontWeight: 400 } },
    xAxis: [], yAxis: [], series: [],
  })
  return Object.assign({}, BASE_OPT, {
    title: { show: false },
    grid: { left: 52, right: 60, top: 26, bottom: 34 }, legend: { show: false },
    xAxis: Object.assign({ type: 'category', data: d.map(x => x.d), axisLabel: { color: '#8f95a1', fontSize: 10, formatter: v => v.replace(/^(\d{4})\/(\d+)\/\d+$/, '$1/$2') } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true }, AXIS),
    series: [{ type: 'line', data: d.map(x => x.v), symbol: 'none', lineStyle: { width: 1.4, color: C_PUR }, areaStyle: { color: 'rgba(122,90,248,.09)' },
      markLine: { silent: true, symbol: 'none', label: { fontSize: 10, position: 'insideEndTop' }, data: [
        { yAxis: +fmt(props.atmIV, 2), lineStyle: { color: C_UP, width: 1.6 }, label: { formatter: '当前 ' + fmt(props.atmIV, 1), color: C_UP } },
        { yAxis: props.ivPct ? +fmt(props.ivPct.median, 2) : null, lineStyle: { color: '#8f95a1', type: 'dashed', width: 1 }, label: { formatter: props.ivPct ? '3年中位 ' + fmt(props.ivPct.median, 1) : '3年中位 —', color: '#8f95a1' } },
      ] } }],
  })
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
</style>
