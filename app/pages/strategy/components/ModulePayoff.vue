<template>
  <div v-if="u && e" class="rounded-[12px] border border-[#e3e6ea] bg-white p-4">
    <div class="h-2"></div>
    <div class="mb-2 flex items-center justify-between">
      <div class="text-[14px] font-[700] text-[#1f2329]">策略到期损益图</div>
      <select v-model="sel" class="rounded-[7px] border border-[#d8dce2] bg-white px-2 py-1 text-[12px] text-[#1f2329]">
        <option v-for="(v,k) in strategies" :key="k" :value="k">{{ v.n }}</option>
      </select>
    </div>
    <VChart v-if="opt" :option="opt" autoresize />
    <div v-if="legs.length" class="mt-1 flex flex-wrap gap-x-1.5 gap-y-1">
      <span v-for="(lt,i) in legsText" :key="i" class="rounded bg-[#eef2f9] px-2 py-0.5 text-[11px] text-[#2f3a4a]">{{ lt }}</span>
    </div>
    <div class="mt-3 grid grid-cols-4 gap-2.5" v-if="kpi.length">
      <div v-for="(c,i) in kpi" :key="i" class="rounded-[8px] border border-[#e3e6ea] bg-white px-2.5 py-2">
        <div class="text-[10.5px] text-[#8f95a1]">{{ c[0] }}</div>
        <div class="mt-0.5 text-[15px] font-[650] tabular-nums" :class="c[3]">{{ c[1] }}</div>
        <div class="text-[10px] text-[#8f95a1]">{{ c[2] }}</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { buildLegs, legLabel, legValue, STRATEGIES, fmt, sign, clamp, bs, hvFair, BASE_OPT, AXIS } from './lib'
const props = defineProps({
  u: { type: Object, default: null },
  e: { type: Object, default: null },
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
const sel = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const strategies = STRATEGIES
const legs = computed(() => buildLegs(props.u, props.e, props.modelValue))
const legsText = computed(() => legs.value.map(legLabel))
const opt = computed(() => {
  const u = props.u, e = props.e, lg = legs.value
  if (!lg.length) return null
  const S0 = u.spot, mult = u.MULT || 10000
  const lo = S0 * 0.8, hi = S0 * 1.2, pts = 81
  const xs = [], ys = []
  for (let i = 0; i < pts; i++) {
    const s = lo + (hi - lo) * i / (pts - 1); xs.push(+s.toFixed(2))
    let pnl = 0
    lg.forEach(l => { pnl += (legValue(l, s, 0) - l.px) * l.qty * (l.type === 'S' ? 1 : mult) })
    ys.push(+pnl.toFixed(0))
  }
  const maxP = Math.max(...ys), minP = Math.min(...ys)
  return {
    ...BASE_OPT,
    grid: { left: 64, right: 24, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: xs.map(v => v.toFixed(2)), name: '标的现价', boundaryGap: false, ...AXIS },
    yAxis: { type: 'value', name: '到期损益(元)', ...AXIS },
    series: [{
      type: 'line', step: 'middle', symbol: 'none', data: ys,
      lineStyle: { color: ys[ys.length-1] >= 0 ? '#12a05c' : '#e02020', width: 2 },
      areaStyle: { color: ys[ys.length-1] >= 0 ? 'rgba(18,160,92,.08)' : 'rgba(224,32,32,.08)' },
      markLine: { silent: true, symbol: 'none', lineStyle: { color: '#1f2329', type: 'dashed' }, data: [{ yAxis: 0 }, { xAxis: xs.findIndex(v => Math.abs(v - S0) < 1e-6) }] },
    }],
  }
})
const kpi = computed(() => {
  const u = props.u, e = props.e, lg = legs.value
  if (!lg.length) return []
  const S0 = u.spot, mult = u.MULT || 10000
  const net = lg.reduce((a, l) => a + l.px * l.qty * (l.type === 'S' ? 1 : mult), 0)
  const ys = [], xs = []
  const lo = S0 * 0.8, hi = S0 * 1.2, pts = 161
  for (let i = 0; i < pts; i++) {
    const s = lo + (hi - lo) * i / (pts - 1); xs.push(s)
    let pnl = 0; lg.forEach(l => { pnl += (legValue(l, s, 0) - l.px) * l.qty * (l.type === 'S' ? 1 : mult) }); ys.push(pnl)
  }
  const maxP = Math.max(...ys), minP = Math.min(...ys)
  const maxIdx = ys.indexOf(maxP), minIdx = ys.indexOf(minP)
  const up = maxP / Math.abs(net) * 100, dn = Math.abs(minP) / Math.abs(net) * 100
  const yr = (e.byStrike && e.byStrike.length) ? e.byStrike.map(r => r.K).filter(k => k > S0) : []
  const yk = yr.length ? yr[0] : hi
  const yPnl = (() => { let p = 0; lg.forEach(l => { p += (legValue(l, yk, 0) - l.px) * l.qty * (l.type === 'S' ? 1 : mult) }); return p })()
  return [
    ['净权利金', fmt(net,0), '建仓现金流(正=收)', net>=0?'text-[#12a05c]':'text-[#e02020]'],
    ['最大盈利', maxP>=0?('≥'+fmt(maxP,0)):fmt(maxP,0), '在 '+fmt(xs[maxIdx],2), 'text-[#12a05c]'],
    ['最大亏损', minP>=0?fmt(minP,0):('≤'+fmt(Math.abs(minP),0)), '在 '+fmt(xs[minIdx],2), 'text-[#e02020]'],
    ['盈亏比', fmt(Math.max(up,dn)/Math.min(up,dn),1)+':1', '盈利/亏损幅度', 'text-[#1f2329]'],
  ]
})
</script>
