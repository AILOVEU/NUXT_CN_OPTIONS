<template>
  <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#12a05c]"></span>Gamma 敞口 GEX</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">按“做市商多认购、空认沽”假设。累计为正＝做市商多 Gamma，会抑制波动；为负＝放大波动</div>
    <VChart :option="gexOpt" autoresize class="chart tall" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_DN, C_PUR } from './lib'

const props = defineProps({
  e: { type: Object, default: null },
})
const E = computed(() => props.e)

const gexOpt = computed(() => {
  if (!E.value) return {}
  const ks = E.value.byStrike.map(b => b.K)
  let cum = 0; const cums = E.value.byStrike.map(b => { cum += b.netGex; return +(cum / 1e8).toFixed(3) })
  return Object.assign({}, BASE_OPT, {
    grid: { left: 56, right: 60, top: 34, bottom: 44 },
    legend: { top: 2, data: ['认购 Gamma', '认沽 Gamma', '累计净 Gamma'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: ks, name: '行权价', axisLabel: { interval: 1, fontSize: 10, rotate: 35 } }, AXIS),
    yAxis: [Object.assign({ type: 'value', name: 'Gamma 敞口（亿元/1%）' }, AXIS), Object.assign({ type: 'value', name: '累计（亿）', position: 'right', splitLine: { show: false } }, AXIS)],
    series: [
      { name: '认购 Gamma', type: 'bar', data: E.value.byStrike.map(b => +(b.gexC / 1e8).toFixed(3)), itemStyle: { color: C_UP, opacity: .75 }, barWidth: '40%' },
      { name: '认沽 Gamma', type: 'bar', data: E.value.byStrike.map(b => +(-b.gexP / 1e8).toFixed(3)), itemStyle: { color: C_DN, opacity: .75 }, barGap: '15%', barWidth: '40%' },
      { name: '累计净 Gamma', type: 'line', yAxisIndex: 1, data: cums, symbol: 'none', lineStyle: { width: 2, color: C_PUR }, markLine: { silent: true, symbol: 'none', data: [{ yAxis: 0, lineStyle: { color: '#c8cdd6', type: 'dashed' } }] } },
    ],
  })
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
.chart.tall { height: 360px }
</style>
