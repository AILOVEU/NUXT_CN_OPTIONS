<template>
  <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>策略到期损益图</div>
    <div class="mb-2 flex flex-wrap items-center gap-2.5 pl-[11px]">
      <select v-model="selStgProxy" class="rounded-[7px] border border-[#e3e6ea] bg-white px-2.5 py-1.5 text-[12.5px]">
        <option v-for="(s, k) in STRATEGIES" :key="k" :value="k">{{ s.n }}{{ k === recommendedKey ? '　★推荐' : '' }}</option>
      </select>
      <span class="text-[11.5px] leading-[1.7] text-[#8f95a1]">{{ legsC.map(legLabel).join('　') }}</span>
    </div>
    <VChart :option="payoffOpt" autoresize class="chart" style="height: 288px" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AXIS, BASE_OPT, C_ACC, C_PUR, C_WARN, MULT, fmt, scoreDir, scoreVol, ctxOf, verdictOf, buildLegs, legLabel, legValue, STRATEGIES } from './lib'

const props = defineProps({
  u: { type: Object, default: null },
  e: { type: Object, default: null },
  selStg: { type: String, default: null },
})
const emit = defineEmits(['update:selStg'])
const U = computed(() => props.u)
const E = computed(() => props.e)
const selStgProxy = computed({ get: () => props.selStg, set: v => emit('update:selStg', v) })

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
const payoffOpt = computed(() => {
  const p = payoffData.value
  if (!p) return { title: { text: '该策略在当前到期月无可用合约', left: 'center', top: '45%', textStyle: { color: '#8f95a1', fontSize: 13, fontWeight: 400 } } }
  const S = p.S
  const spotIdx = p.xs.reduce((a, b, i) => Math.abs(b - S) < Math.abs(p.xs[a] - S) ? i : a, 0)
  return Object.assign({}, BASE_OPT, {
    grid: { left: 62, right: 26, top: 30, bottom: 34 },
    legend: { top: 2, data: ['到期损益', '当前理论损益'], textStyle: { color: '#5f6672', fontSize: 11 } },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#e3e6ea', borderWidth: 1, textStyle: { color: '#1f2329', fontSize: 12 },
      formatter: x => { let s = '标的 ' + x[0].axisValue + '<br>'; x.forEach(y => { s += y.marker + y.seriesName + ' <b>' + (y.value > 0 ? '+' : '') + Math.round(y.value) + '</b> 元<br>' }); return s } },
    xAxis: Object.assign({ type: 'category', data: p.xs, name: '到期标的价', axisLabel: { color: '#8f95a1', fontSize: 10, interval: 19 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: '盈亏（元）', axisLabel: { color: '#8f95a1', fontSize: 10, formatter: v => Math.abs(v) >= 1e4 ? (v / 1e4).toFixed(1) + '万' : v } }, AXIS),
    series: [
      { name: '到期损益', type: 'line', data: p.expPL, symbol: 'none', lineStyle: { width: 2.4, color: C_ACC },
        areaStyle: {}, markLine: { silent: true, symbol: 'none', data: [
          { yAxis: 0, lineStyle: { color: '#c8cdd6' } },
          { xAxis: spotIdx, lineStyle: { color: C_WARN, type: 'dashed', width: 1.5 }, label: { formatter: '现价 ' + fmt(S, 3), color: C_WARN, fontSize: 10, position: 'insideEndTop' } } ] } },
      { name: '当前理论损益', type: 'line', data: p.nowPL, symbol: 'none', lineStyle: { width: 1.8, color: C_PUR, type: 'dashed' } },
    ],
  })
})
</script>

<style scoped>
.chart { width: 100%; height: 290px }
</style>
