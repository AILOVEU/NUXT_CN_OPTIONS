<template>
  <div class="relative rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="absolute right-3 top-3 z-10 flex gap-1.5">
      <span class="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#8f95a1]">data_etfoption.csv</span>
    </div>
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#f5a623]"></span>持仓量分布与最大痛点</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">认购向右、认沽向左；黄线为到期日全市场买方总亏损（最大痛点＝亏损最小处）</div>
    <VChart :option="oiOpt" autoresize class="chart tall" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_DN, C_WARN, fmt } from './lib'

const props = defineProps({
  byStrike: { type: Array, default: null },
  painCurve: { type: Array, default: null },
  maxPain: { type: Number, default: null },
})

const oiOpt = computed(() => {
  const bs = props.byStrike
  if (!bs || !bs.length) return {}
  const ks = bs.map(b => b.K)
  const pain = (props.painCurve || []).map(p => +(p.pain / 1e8).toFixed(2))
  return Object.assign({}, BASE_OPT, {
    grid: { left: 56, right: 64, top: 34, bottom: 44 },
    legend: { top: 2, data: ['认购持仓', '认沽持仓', '买方总亏损（亿）'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: ks, name: '行权价', axisLabel: { interval: 1, fontSize: 10, rotate: 35 } }, AXIS),
    yAxis: [Object.assign({ type: 'value', name: '持仓量（张）', axisLabel: { color: '#8f95a1', fontSize: 10, formatter: v => Math.abs(v) >= 1e4 ? (Math.abs(v) / 1e4).toFixed(0) + '万' : Math.abs(v) } }, AXIS),
      Object.assign({ type: 'value', name: '亏损（亿）', position: 'right', splitLine: { show: false }, axisLabel: { fontSize: 10 } }, AXIS)],
    series: [
      { name: '认购持仓', type: 'bar', data: bs.map(b => b.cOI), itemStyle: { color: C_UP, opacity: .8 }, barGap: '15%', barWidth: '38%', tooltip: { valueFormatter: v => v } },
      { name: '认沽持仓', type: 'bar', data: bs.map(b => b.pOI), itemStyle: { color: C_DN, opacity: .8 }, barWidth: '38%' },
      { name: '买方总亏损（亿）', type: 'line', yAxisIndex: 1, data: pain, symbol: 'none', lineStyle: { color: C_WARN, width: 2 }, tooltip: { valueFormatter: v => fmt(v, 1) + '亿' },
        markLine: { silent: true, symbol: 'none', label: { formatter: '最大痛点 ' + props.maxPain, position: 'insideEndTop', color: C_WARN, fontSize: 10 }, lineStyle: { color: C_WARN, type: 'dotted', width: 1.5 }, data: [{ xAxis: ks.indexOf(props.maxPain) }] } },
    ],
  })
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
.chart.tall { height: 360px }
</style>
