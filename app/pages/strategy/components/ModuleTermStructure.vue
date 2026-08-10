<template>
  <div class="relative rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="absolute right-3 top-3 z-10 flex gap-1.5">
      <span class="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#8f95a1]">data_etfoption.csv</span>
    </div>
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>波动率期限结构</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">近月高于远月＝倒挂（市场紧张，近月贵）；反之为正向（Contango）</div>
    <VChart :option="termOpt" autoresize class="chart" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_DN, C_ACC, fmt } from './lib'

const props = defineProps({
  expiries: { type: Array, default: null },
})

const termOpt = computed(() => {
  const exps = props.expiries
  if (!exps || !exps.length) return {}
  const xs = exps.map(e => e.days + '天')
  return Object.assign({}, BASE_OPT, {
    legend: { top: 2, data: ['平值 IV', '25Δ 认购 IV', '25Δ 认沽 IV'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: xs, name: '剩余期限' }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true }, AXIS),
    series: [
      { name: '平值 IV', type: 'line', data: exps.map(e => +fmt(e.atmIV, 2)), symbolSize: 8, lineStyle: { width: 3, color: C_ACC }, itemStyle: { color: C_ACC }, label: { show: true, color: '#5f6672', fontSize: 11, formatter: '{c}' }, areaStyle: { color: 'rgba(47,111,235,.07)' } },
      { name: '25Δ 认购 IV', type: 'line', data: exps.map(e => +fmt(e.ivc25, 2)), symbolSize: 5, lineStyle: { width: 1.6, color: C_UP, type: 'dashed' }, itemStyle: { color: C_UP } },
      { name: '25Δ 认沽 IV', type: 'line', data: exps.map(e => +fmt(e.ivp25, 2)), symbolSize: 5, lineStyle: { width: 1.6, color: C_DN, type: 'dashed' }, itemStyle: { color: C_DN } },
    ],
  })
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
</style>
