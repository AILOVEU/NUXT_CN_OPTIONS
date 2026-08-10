<template>
  <div class="relative rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="absolute right-3 top-3 z-10 flex gap-1.5">
      <span class="rounded bg-[#e8f5e9] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#2e7d32]">etf_qianfuquan.csv</span>
    </div>
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>标的近期走势与波动</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">近 17 个交易日日线（红涨绿跌）与成交量</div>
    <VChart :option="spotOpt" autoresize class="chart" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_DN, C_WARN } from './lib'

const props = defineProps({
  hv: { type: Object, default: null },
})

const spotOpt = computed(() => {
  const h = props.hv; if (!h || !h.closes || !h.closes.length) return Object.assign({}, BASE_OPT, {
    title: { text: '该标的无日线历史数据', left: 'center', top: '45%', textStyle: { color: '#8f95a1', fontSize: 13, fontWeight: 400 } },
    xAxis: [], yAxis: [], series: [],
  })
  const cs = h.closes
  return Object.assign({}, BASE_OPT, {
    title: { show: false },
    grid: { left: 52, right: 56, top: 26, bottom: 34 }, legend: { show: false },
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#e3e6ea', borderWidth: 1, textStyle: { color: '#1f2329', fontSize: 12 } },
    xAxis: Object.assign({ type: 'category', data: cs.map(x => x.d), axisLabel: { fontSize: 10, rotate: 35, interval: 0 } }, AXIS),
    yAxis: [Object.assign({ type: 'value', scale: true, name: '价格' }, AXIS), Object.assign({ type: 'value', position: 'right', splitLine: { show: false }, show: false }, AXIS)],
    series: [
      { name: '成交量', type: 'bar', yAxisIndex: 1, data: cs.map(x => x.v), itemStyle: { color: (p) => { const i = p.dataIndex; return (i > 0 && cs[i].c >= cs[i - 1].c) ? 'rgba(224,32,32,.20)' : 'rgba(18,160,92,.20)' } } },
      { name: 'K线', type: 'candlestick', data: cs.map(x => [x.o, x.c, x.l, x.h]), itemStyle: { color: C_UP, color0: '#fff', borderColor: C_UP, borderColor0: C_DN } },
      { name: 'MA5', type: 'line', data: cs.map((_, i) => i < 4 ? null : +(cs.slice(i - 4, i + 1).reduce((a, b) => a + b.c, 0) / 5).toFixed(4)), symbol: 'none', lineStyle: { width: 1.4, color: C_WARN } },
    ],
  })
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
</style>
