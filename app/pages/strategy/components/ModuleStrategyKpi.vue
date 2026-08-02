<template>
  <div class="mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
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
  u: { type: Object, default: null },
  e: { type: Object, default: null },
  selStg: { type: String, default: null },
})
const U = computed(() => props.u)
const E = computed(() => props.e)

const recommendedKey = computed(() => {
  const u = U.value, e = E.value
  if (!u || !e) return 'long_straddle'
  return verdictOf(scoreDir(u, e).score, scoreVol(u, e).score, ctxOf(u, e)).key
})
const legsC = computed(() => { const u = U.value, e = E.value; if (!u || !e) return []; return buildLegs(u, e, props.selStg || recommendedKey.value) })
const payoffData = computed(() => computePayoff(U.value, E.value, legsC.value))
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
