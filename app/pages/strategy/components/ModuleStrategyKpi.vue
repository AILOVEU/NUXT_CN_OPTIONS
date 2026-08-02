<template>
  <div class="mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>策略风险收益指标</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">按当前盘口中值计价，合约乘数 {{ MULT }}，单位：元/组</div>
    <div class="grid grid-cols-4 gap-2.5" v-if="stgKpi.length">
      <div v-for="(k, i) in stgKpi" :key="i" class="rounded-[9px] border border-[#e3e6ea] bg-white p-[9px_11px]">
        <div class="text-[11.5px] text-[#8f95a1]">{{ k[0] }}</div>
        <div class="mt-0.5 text-[16px] font-[650] tabular-nums tracking-[-.5px]" :class="k[2]">{{ k[1] }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MULT, fmt, sign, wan, scoreDir, scoreVol, ctxOf, verdictOf, buildLegs, legValue } from './lib'

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
const payoffData = computed(() => {
  const u = U.value, e = E.value; const legs = legsC.value
  if (!u || !e || !legs.length) return null
  const S = u.spot; const lo = S * 0.78, hi = S * 1.22, N = 140
  const xs = [], expPL = [], nowPL = []
  const cost = legs.reduce((a, l) => a + l.qty * l.px * MULT, 0)
  for (let i = 0; i <= N; i++) {
    const s = lo + (hi - lo) * i / N; xs.push(+s.toFixed(4))
    let pe = 0, pn = 0
    legs.forEach(l => { pe += l.qty * (legValue(l, s, e.days) - l.px) * MULT; pn += l.qty * (legValue(l, s, 0) - l.px) * MULT })
    expPL.push(+pe.toFixed(0)); nowPL.push(+pn.toFixed(0))
  }
  const mx = Math.max(...expPL), mn = Math.min(...expPL)
  const bes = []
  for (let i = 1; i < xs.length; i++) if (expPL[i - 1] * expPL[i] < 0) { const t = Math.abs(expPL[i - 1]) / (Math.abs(expPL[i - 1]) + Math.abs(expPL[i])); bes.push(+(xs[i - 1] + (xs[i] - xs[i - 1]) * t).toFixed(4)) }
  const rowOf = (l) => { if (l.type === 'S') return null; const ex = u.expiries.find(x => x.days === l.t) || e; return ex.byStrike.find(x => x.K === l.K) }
  const gk = (l, cf, pf, sv) => { if (l.type === 'S') return sv; const b = rowOf(l); if (!b) return 0; return (l.type === 'C' ? b[cf] : b[pf]) || 0 }
  const netD = legs.reduce((a, l) => a + l.qty * gk(l, 'cDelta', 'pDelta', 1), 0)
  const netT = legs.reduce((a, l) => a + l.qty * gk(l, 'cTheta', 'pTheta', 0), 0)
  const netV = legs.reduce((a, l) => a + l.qty * gk(l, 'cVega', 'pVega', 0) * MULT * 0.01, 0)
  const sig = e.atmIV / 100 * Math.sqrt(e.days / 365); let win = 0, tot = 0
  for (let i = 0; i < xs.length; i++) { const z = Math.log(xs[i] / S) / sig; const w = Math.exp(-z * z / 2); tot += w; if (expPL[i] > 0) win += w }
  const pop = tot ? win / tot * 100 : 0
  return { xs, expPL, nowPL, cost, mx, mn, bes, netD, netT, netV, pop, S }
})
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
