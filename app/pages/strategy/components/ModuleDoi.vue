<template>
  <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#f5a623]"></span>日增仓分布（资金流向）</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">当日新增持仓，反映资金在哪些行权价上新建头寸</div>
    <VChart :option="doiOpt" autoresize class="chart tall" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_DN } from './lib'

const props = defineProps({
  e: { type: Object, default: null },
})
const E = computed(() => props.e)

const doiOpt = computed(() => {
  if (!E.value) return {}
  const ks = E.value.byStrike.map(b => b.K)
  return Object.assign({}, BASE_OPT, {
    grid: { left: 56, right: 30, top: 34, bottom: 44 },
    legend: { top: 2, data: ['认购增仓', '认沽增仓'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: ks, name: '行权价', axisLabel: { interval: 1, fontSize: 10, rotate: 35 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: '日增仓（张）', axisLabel: { color: '#8f95a1', fontSize: 10, formatter: v => Math.abs(v) >= 1e4 ? (v / 1e4).toFixed(0) + '万' : v } }, AXIS),
    series: [
      { name: '认购增仓', type: 'bar', data: E.value.byStrike.map(b => b.cDOI), itemStyle: { color: C_UP, opacity: .85 }, barWidth: '40%' },
      { name: '认沽增仓', type: 'bar', data: E.value.byStrike.map(b => b.pDOI), itemStyle: { color: C_DN, opacity: .85 }, barGap: '15%', barWidth: '40%' },
    ],
  })
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
.chart.tall { height: 360px }
</style>
