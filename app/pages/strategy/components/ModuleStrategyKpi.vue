<template>
  <div class="relative mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="absolute right-3 top-3 z-10 flex gap-1.5">
      <span class="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#8f95a1]">data_etfoption.csv</span>
      <span class="rounded bg-[#fef3e2] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#b8860b]">vixs.csv</span>
      <span class="rounded bg-[#e8f5e9] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#2e7d32]">etf_qianfuquan.csv</span>
    </div>
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>策略风险收益指标</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">按当前盘口中值计价，合约乘数 {{ MULT }}，单位：元/组</div>
    <div class="grid grid-cols-4 gap-2.5" v-if="stgKpi.length">
      <div v-for="(k, i) in stgKpi" :key="i" class="rounded-[9px] border border-[#e3e6ea] bg-white p-[9px_11px]">
        <div class="text-[11.5px] text-[#8f95a1]">{{ k[0] }}</div>
        <div class="mt-0.5 text-[16px] font-[650] tabular-nums tracking-[-.5px]" :style="{color: k[2]==='up'?C_UP:(k[2]==='dn'?C_DN:'')}">{{ k[1] }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MULT, fmt, sign, wan, scoreDir, scoreVol, ctxOf, verdictOf, buildLegs, computePayoff, C_UP, C_DN } from './lib'

const props = defineProps({
  spot: { type: Number, default: null },
  hv: { type: Object, default: null },
  ivPct: { type: Object, default: null },
  expiries: { type: Array, default: null },
  atmIV: { type: Number, default: null },
  days: { type: Number, default: null },
  byStrike: { type: Array, default: null },
  maxPain: { type: Number, default: null },
  rr25: { type: Number, default: null },
  doiPCR: { type: Number, default: null },
  netDelta: { type: Number, default: null },
  totalOI: { type: Number, default: null },
  selStg: { type: String, default: null },
})
const u = computed(() => ({ spot: props.spot, hv: props.hv || {}, ivPct: props.ivPct, expiries: props.expiries || [] }))
const e = computed(() => props.byStrike ? {
  atmIV: props.atmIV, days: props.days, byStrike: props.byStrike,
  maxPain: props.maxPain, rr25: props.rr25, doiPCR: props.doiPCR,
  netDelta: props.netDelta, totalOI: props.totalOI,
} : null)

const recommendedKey = computed(() => {
  if (props.spot == null || !e.value) return 'long_straddle'
  return verdictOf(scoreDir(u.value, e.value).score, scoreVol(u.value, e.value).score, ctxOf(u.value, e.value)).key
})
const legsC = computed(() => { if (props.spot == null || !e.value) return []; return buildLegs(u.value, e.value, props.selStg || recommendedKey.value) })
const payoffData = computed(() => computePayoff(u.value, e.value, legsC.value))
const stgKpi = computed(() => {
  const p = payoffData.value; if (!p) return []
  return [
    ['净权利金', (p.cost < 0 ? '收入 ' : '支出 ') + wan(Math.abs(p.cost)) + ' 元', p.cost < 0 ? 'up' : 'dn'],
    ['最大盈利', (p.mx > 0 ? '+' : '') + wan(p.mx) + ' 元', 'up'],
    ['最大亏损', wan(p.mn) + ' 元', 'dn'],
    ['盈亏平衡点', p.bes.length ? p.bes.map(b => fmt(b, 3)).join(' / ') : '—', ''],
    ['到期获利概率', fmt(p.pop, 1) + '%', p.pop > 55 ? 'up' : ''],
    ['组合 Delta', sign(p.netD) + fmt(p.netD, 3), p.netD > 0 ? 'up' : 'dn'],
    ['组合 Theta', sign(p.netT) + fmt(p.netT, 1) + ' 元/日', p.netT > 0 ? 'up' : 'dn'],
    ['组合 Vega', sign(p.netV) + fmt(p.netV, 1) + ' 元/IV点', p.netV > 0 ? 'up' : 'dn'],
  ]
})
</script>
