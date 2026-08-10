<template>
  <div class="relative rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="absolute right-3 top-3 z-10 flex gap-1.5">
      <span class="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#8f95a1]">data_etfoption.csv</span>
      <span class="rounded bg-[#fef3e2] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#b8860b]">vixs.csv</span>
      <span class="rounded bg-[#e8f5e9] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#2e7d32]">etf_qianfuquan.csv</span>
    </div>
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>策略象限图</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">横轴方向评分、纵轴波动率评分，六个标的所处象限决定策略类型</div>
    <VChart :option="quadOpt" autoresize class="chart tall" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AXIS, BASE_OPT, C_ACC, fmt, sign, scoreDir, scoreVol } from './lib'

const props = defineProps({
  underlyings: { type: Array, default: () => [] },
  selU: { type: String, default: null },
})

const quadOpt = computed(() => {
  const pts = props.underlyings.filter(u => u.expiries && u.expiries[0]).map(u => {
    const e = u.expiries[0], d = scoreDir(u, e), v = scoreVol(u, e)
    return { name: u.short, value: [+fmt(d.score, 1), +fmt(v.score, 1)], cur: u.code === props.selU }
  })
  const label = (x, y, t, c) => ({ type: 'scatter', data: [{ value: [x, y] }], symbolSize: 1, silent: true, label: { show: true, formatter: t, fontSize: 11, color: c, fontWeight: 600 }, tooltip: { show: false } })
  return Object.assign({}, BASE_OPT, {
    grid: { left: 56, right: 30, top: 26, bottom: 40 }, legend: { show: false },
    tooltip: { trigger: 'item', backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#e3e6ea', borderWidth: 1, textStyle: { color: '#1f2329', fontSize: 12 },
      formatter: p => `<b>${p.data.name}</b><br>方向 ${sign(p.value[0])}${p.value[0]}<br>波动率 ${sign(p.value[1])}${p.value[1]}` },
    xAxis: Object.assign({ type: 'value', name: '方向评分（→ 看多）', min: -100, max: 100, splitLine: { lineStyle: { color: '#f2f4f7' } } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: '波动率评分（↑ 做多波动率）', min: -100, max: 100, splitLine: { lineStyle: { color: '#f2f4f7' } } }, AXIS),
    series: [
      label(-58, 72, '买入认沽', '#b9bfc9'), label(58, 72, '买入认购', '#b9bfc9'), label(-58, -72, '熊市看涨价差', '#b9bfc9'),
      label(58, -72, '牛市看跌价差', '#b9bfc9'), label(0, -88, '卖出宽跨 / 铁鹰', '#b9bfc9'), label(0, 88, '买入跨式', '#b9bfc9'),
      { type: 'scatter', data: pts, symbolSize: p => p.data && p.data.cur ? 22 : 14, itemStyle: { color: p => p.data.cur ? C_ACC : 'rgba(122,90,248,.55)', borderColor: '#fff', borderWidth: 2 },
        label: { show: true, position: 'right', formatter: p => p.data.name, fontSize: 11, color: '#5f6672' },
        markLine: { silent: true, symbol: 'none', lineStyle: { color: '#d8dce2' }, data: [{ xAxis: 0 }, { yAxis: 0 }] } },
    ],
  })
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
.chart.tall { height: 360px }
</style>
