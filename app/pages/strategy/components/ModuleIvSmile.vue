<template>
  <div class="relative rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="absolute right-3 top-3 z-10 flex gap-1.5">
      <span class="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#8f95a1]">data_etfoption.csv</span>
    </div>
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>波动率微笑 / 偏斜</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">同一到期日下各行权价隐含波动率。左低右高＝看跌保护贵，曲线越弯＝尾部越贵</div>
    <VChart :option="smileOpt" autoresize class="chart" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_DN, C_ACC } from './lib'

const props = defineProps({
  byStrike: { type: Array, default: null },
  atmK: { type: Number, default: null },
})

const smileOpt = computed(() => {
  const bs = props.byStrike
  if (!bs || !bs.length) return {}
  const ks = bs.map(b => b.K)
  return Object.assign({}, BASE_OPT, {
    grid: { left: 52, right: 52, top: 34, bottom: 44 },
    legend: { top: 2, data: ['认购 IV', '认沽 IV', '平均'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: ks, name: '行权价', axisLabel: { interval: 1, fontSize: 10, rotate: 35 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true }, AXIS),
    series: [
      { name: '认购 IV', type: 'line', data: bs.map(b => b.cIV), smooth: true, symbolSize: 5, lineStyle: { width: 2, color: C_UP }, itemStyle: { color: C_UP }, connectNulls: true },
      { name: '认沽 IV', type: 'line', data: bs.map(b => b.pIV), smooth: true, symbolSize: 5, lineStyle: { width: 2, color: C_DN }, itemStyle: { color: C_DN }, connectNulls: true },
      { name: '平均', type: 'line', data: bs.map(b => (b.cIV && b.pIV) ? (b.cIV + b.pIV) / 2 : null), smooth: true, symbol: 'none', lineStyle: { width: 1.5, color: C_ACC, type: 'dashed' }, connectNulls: true,
        markLine: { silent: true, symbol: 'none', label: { formatter: '平值 ' + props.atmK, position: 'insideEndTop', color: C_ACC, fontSize: 10 }, lineStyle: { color: C_ACC, type: 'dotted', width: 1.5 }, data: [{ xAxis: ks.indexOf(props.atmK) }] } },
    ],
  })
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
</style>
