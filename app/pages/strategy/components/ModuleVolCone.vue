<template>
  <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>波动率锥 Volatility Cone</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">历史各窗口实现波动率分布（近3年）＋ 当前 IV 与近期实现波动率定位</div>
    <VChart :option="coneOpt" autoresize class="chart" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_DN, C_PUR, fmt } from './lib'

const props = defineProps({
  u: { type: Object, default: null },
})
const U = computed(() => props.u)

const coneOpt = computed(() => {
  const u = U.value; if (!u) return {}
  const lh = u.longHV
  if (!lh || !lh.cone) return { title: { text: '该标的无日线历史数据', left: 'center', top: '45%', textStyle: { color: '#8f95a1', fontSize: 13, fontWeight: 400 } } }
  const xs = lh.cone.map(c => c.win + '日')
  const band = (a, b, color, name) => ([
    { name: name + '_base', type: 'line', stack: name, data: lh.cone.map(c => c[a]), symbol: 'none', lineStyle: { opacity: 0 }, silent: true, tooltip: { show: false } },
    { name, type: 'line', stack: name, data: lh.cone.map(c => c[b] - c[a]), symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color }, tooltip: { show: false } },
  ])
  const ivPts = (u.expiries || []).map(ex => [ex.days * 250 / 365, ex.atmIV])
  return Object.assign({}, BASE_OPT, {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#e3e6ea', borderWidth: 1, textStyle: { color: '#1f2329', fontSize: 12 } },
    legend: { top: 2, data: ['中位数', '近期实现波动率', '当前各期限 IV'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: xs, name: '统计窗口' }, AXIS),
    yAxis: Object.assign({ type: 'value', name: '年化波动率 %', scale: true }, AXIS),
    series: [
      ...band('min', 'p10', 'rgba(122,90,248,.05)', 'r1'), ...band('p10', 'p25', 'rgba(122,90,248,.10)', 'r2'),
      ...band('p25', 'p75', 'rgba(122,90,248,.18)', 'r3'), ...band('p75', 'p90', 'rgba(122,90,248,.10)', 'r4'), ...band('p90', 'max', 'rgba(122,90,248,.05)', 'r5'),
      { name: '中位数', type: 'line', data: lh.cone.map(c => +fmt(c.median, 1)), symbol: 'none', lineStyle: { width: 2, color: C_PUR } },
      { name: '近期实现波动率', type: 'line', data: [+fmt(u.hv.hv5 || u.hv.rv5, 1), +fmt(u.hv.hv10, 1), +fmt(u.hv.hvCC, 1), null, null, null, null], symbolSize: 7, lineStyle: { width: 2, color: C_DN }, itemStyle: { color: C_DN }, connectNulls: false },
      { name: '当前各期限 IV', type: 'scatter', symbolSize: 12, itemStyle: { color: C_UP }, data: (u.expiries || []).map(ex => { const w = ex.days * 250 / 365; let idx = 0, bd = 1e9; lh.cone.forEach((c, i) => { const a = Math.abs(c.win - w); if (a < bd) { bd = a; idx = i } }); return [idx, +fmt(ex.atmIV, 1)] }) },
    ],
  })
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
</style>
