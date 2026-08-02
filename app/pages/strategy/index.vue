<template>
  <div class="min-h-screen bg-[#f3f4f6] pb-[120px]">
    <!-- 页头（不抽离） -->
    <div class="sticky top-0 z-30 border-b border-[#e3e6ea] bg-white/95 backdrop-blur">
      <div class="mx-auto max-w-[1240px] px-4 py-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-baseline gap-2.5">
            <h1 class="text-[17px] font-[700] text-[#1f2329]">ETF 期权策略仪表盘</h1>
            <span class="text-[12px] text-[#8f95a1]">方向 · 波动率 · 希腊字 综合分析</span>
          </div>
          <div class="flex items-center gap-3 text-[12px]">
            <div v-if="U" class="flex items-center gap-2">
              <span class="text-[#8f95a1]">{{ U.NAME }}</span>
              <span class="text-[18px] font-[700] tabular-nums" :class="U.chg >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{
                fmt(U.spot,3) }}</span>
              <span :class="U.chg >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'" class="tabular-nums">{{ sign(U.chg) }}{{
                fmt(U.chg,3) }} ({{ sign(U.chgPct) }}{{ fmt(U.chgPct, 2) }}%)</span>
            </div>
            <span class="text-[#b8bdc7]">|</span>
            <span class="text-[#8f95a1]">数据源：ETF期权全市场</span>
          </div>
        </div>
        <!-- 标的 / 到期月切换器（不抽离，使用全局 TabSelect） -->
        <div class="mt-2.5 flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="text-[12px] text-[#8f95a1]">标的</span>
            <TabSelect v-model="selU" :options="underlyings.map(u => ({ label: u.NAME, value: u.CODE }))" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[12px] text-[#8f95a1]">到期月</span>
            <TabSelect v-model="selE"
              :options="U ? U.expiries.map((e, i) => ({ label: `${e.label}（${e.days}天）`, value: i })) : []" />
          </div>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-[1240px] px-4 pt-4 space-y-4">
      <!-- 分组一：标的维度 -->
      <div class="rounded-[12px] border border-[#e3e6ea] bg-white p-4 space-y-4">
        <ModuleTermStructure :u="U" />
        <ModuleVolCone :u="U" />
        <ModuleSpotTrend :u="U" :hist="hist" />
        <ModuleIvRules :ivHistStore="ivHistStore" :selU="selU" />
      </div>

      <!-- 分组二：到期月维度 -->
      <div class="rounded-[12px] border border-[#e3e6ea] bg-white p-4 space-y-4">
        <ModuleVerdict :u="U" :e="E" />
        <ModuleKpiCards :u="U" :e="E" />
        <div class="grid grid-cols-2 gap-4">
          <ModuleSignalTable kind="dir" :u="U" :e="E" />
          <ModuleSignalTable kind="vol" :u="U" :e="E" />
        </div>
        <ModuleIvSmile :e="E" />
        <ModuleIvHist :e="E" />
        <ModuleOi :e="E" />
        <ModuleDoi :e="E" />
        <ModuleGex :e="E" />
        <ModuleGreeks :e="E" />
        <ModulePayoff v-model="selStg" :u="U" :e="E" />
        <ModuleTTable :e="E" />
      </div>

      <!-- 分组三：横截面维度 -->
      <div class="rounded-[12px] border border-[#e3e6ea] bg-white p-4 space-y-4">
        <ModuleCrossSection :underlyings="underlyings" />
        <ModuleQuadrant :underlyings="underlyings" />
        <ModuleRank :underlyings="underlyings" />
        <ModuleMethodology />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { OPTIONS_MAP } from '~/data'
import {
  fmt, sign, pstdev,
  verdictOf, scoreDir, scoreVol, ctxOf,
} from './components/lib'

import ModuleTermStructure from './components/ModuleTermStructure.vue'
import ModuleVolCone from './components/ModuleVolCone.vue'
import ModuleSpotTrend from './components/ModuleSpotTrend.vue'
import ModuleIvRules from './components/ModuleIvRules.vue'
import ModuleVerdict from './components/ModuleVerdict.vue'
import ModuleKpiCards from './components/ModuleKpiCards.vue'
import ModuleSignalTable from './components/ModuleSignalTable.vue'
import ModuleIvSmile from './components/ModuleIvSmile.vue'
import ModuleIvHist from './components/ModuleIvHist.vue'
import ModuleOi from './components/ModuleOi.vue'
import ModuleDoi from './components/ModuleDoi.vue'
import ModuleGex from './components/ModuleGex.vue'
import ModuleGreeks from './components/ModuleGreeks.vue'
import ModulePayoff from './components/ModulePayoff.vue'
import ModuleTTable from './components/ModuleTTable.vue'
import ModuleCrossSection from './components/ModuleCrossSection.vue'
import ModuleQuadrant from './components/ModuleQuadrant.vue'
import ModuleRank from './components/ModuleRank.vue'
import ModuleMethodology from './components/ModuleMethodology.vue'

/* ===== 选择器（基础映射） ===== */
const underlyings = ref([])
const selU = ref('')
const selE = ref(0)
const selStg = ref('')
const U = computed(() => underlyings.value.find(x => x.CODE === selU.value) || null)
const E = computed(() => (U.value && U.value.expiries[selE.value]) ? U.value.expiries[selE.value] : null)

watch(selE, () => { if (E.value) selStg.value = verdictOf(scoreDir(U.value, E.value).score, scoreVol(U.value, E.value).score, ctxOf(U.value, E.value)).key })
watch(selU, () => { selE.value = 0; hist.value = histMap.value[selU.value] || []; const e = U.value && U.value.expiries[0]; if (e) selStg.value = verdictOf(scoreDir(U.value, e).score, scoreVol(U.value, e).score, ctxOf(U.value, e)).key })

/* ===== 历史价格（基础数组，映射后交模块） ===== */
const hist = ref([])
const histMap = ref({})
const ivHistStore = ref({})

/* ===== 数据解析：把真实 CSV（东方财富 f 系列列）映射成结构化对象 ===== */
function parseDate(s) { const y = String(s).slice(0, 4), m = String(s).slice(4, 6), d = String(s).slice(6, 8); return new Date(+y, +m - 1, +d) }
function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000) }
function parseCsv(text) {
  const strip = s => (s || '').replace(/"/g, '').replace(/\r$/, '')
  const lines = text.trim().split('\n'); const hdr = lines[0].split(',').map(strip)
  return lines.slice(1).map(l => { const a = l.split(','); const o = {}; hdr.forEach((h, i) => o[h] = strip(a[i])); return o })
}
// code: OPTIONS_MAP.code；text: 整张 data_etfoption.csv
function parseChain(code, csvText) {
  const rows = parseCsv(csvText)
  const meta = OPTIONS_MAP.find(m => m.code === code)
  const links = meta ? meta.linkName : []
  const sub = rows.filter(r => links.some(n => (r.f333 || '').includes(n)))
  if (!sub.length) return []
  const spot = +sub[0].f334
  const periods = [...new Set(sub.map(r => r.f301))].filter(Boolean).sort()
  const expiries = periods.map(expDate => {
    const sub2 = sub.filter(r => r.f301 === expDate)
    const byK = {}
    for (const r of sub2) {
      const K = +r.f161; if (!K) continue
      const isCall = (r.f14 || '').includes('购')
      const node = byK[K] || (byK[K] = {
        K, cLast: null, pLast: null, cIV: null, pIV: null,
        cDelta: null, pDelta: null, cOI: 0, pOI: 0, cVol: 0, pVol: 0, dcOI: 0, dpOI: 0,
        gamma: +r.f326 || 0, vega: +r.f327 || 0
      })
      if (isCall) { node.cLast = +r.f2; node.cIV = +r.f249; node.cDelta = +r.f325; node.cOI = +r.f108 || 0; node.dcOI = +r.f163 || 0 }
      else { node.pLast = +r.f2; node.pIV = +r.f249; node.pDelta = +r.f325; node.pOI = +r.f108 || 0; node.dpOI = +r.f163 || 0 }
    }
    const arr = Object.values(byK)
    if (!arr.length) return null
    const atm = arr.reduce((a, b) => Math.abs(b.K - spot) < Math.abs(a.K - spot) ? b : a, arr[0])
    const atmIV = (atm.cIV != null && atm.pIV != null) ? (atm.cIV + atm.pIV) / 2
      : (atm.cIV != null ? atm.cIV : (atm.pIV || 0))
    const wIV = x => ((x.cIV != null ? x.cIV : 0) + (x.pIV != null ? x.pIV : 0)) / 2 / 100
    const f = (acc) => { let s = 0, n = 0; arr.forEach(x => { s += x[acc] * wIV(x); n += x[acc] }); return n ? s / n : 0 }
    const cOI = f('cOI'), pOI = f('pOI'), cVol = f('cVol'), pVol = f('pVol')
    const pcr = cOI ? pOI / cOI : 1, volPCR = cVol ? pVol / cVol : 1
    const netOI = arr.reduce((s, x) => s + x.dcOI - x.dpOI, 0)
    const deltaPCR = cOI ? -Math.log(pcr) : 1.2
    const domOi = netOI > 1e6 ? 1 : netOI < -1e6 ? -1 : 0
    const netDelta = arr.reduce((s, x) => s + (x.cDelta || 0) * x.cOI - (x.pDelta || 0) * x.pOI, 0)
    let gexReal = 0; arr.forEach(x => { gexReal += (x.gamma || 0) * x.cOI * 100 * spot - (x.gamma || 0) * x.pOI * 100 * spot })
    let zeroG = spot, bestAbs = 1e18
    arr.forEach(x => { const g = (x.gamma || 0) * x.cOI * 100 * spot - (x.gamma || 0) * x.pOI * 100 * spot; if (Math.abs(g) < bestAbs) { bestAbs = Math.abs(g); zeroG = x.K } })
    const maxPain = arr.reduce((acc, mp) => {
      let tot = 0; arr.forEach(x => { if (x.K > mp.K) tot += (x.K - mp.K) * x.cOI; else tot += (mp.K - x.K) * x.pOI })
      return tot < acc.v ? { K: mp.K, v: tot } : acc
    }, { K: arr[0].K, v: 1e18 }).K
    const cSkew = arr.filter(x => x.K > spot).slice(-1)[0]
    const skew = (cSkew && cSkew.cIV != null && atm.cIV != null) ? cSkew.cIV - atm.cIV : 0
    const c25 = arr.reduce((a, b) => Math.abs((a.cDelta || 0) - 0.25) < Math.abs((b.cDelta || 0) - 0.25) ? a : b, arr[0])
    const p25 = arr.reduce((a, b) => Math.abs(Math.abs(a.pDelta || 0) - 0.25) < Math.abs(Math.abs(b.pDelta || 0) - 0.25) ? a : b, arr[0])
    const rr25 = (c25.cIV != null && p25.pIV != null) ? c25.cIV - p25.pIV : 0
    const byStrike = arr.map(x => ({ ...x, gex: (x.gamma || 0) * x.cOI * 100 * spot - (x.gamma || 0) * x.pOI * 100 * spot }))
    byStrike.forEach(x => { x.atm = Math.abs(x.K - atm.K) < 1e-6 })
    const ivHist = arr.map(x => x.cIV == null ? null : x.cIV).filter(v => v != null)
    const d = daysBetween(new Date(), parseDate(expDate))
    const yy = String(expDate).slice(2, 4), mm = String(expDate).slice(4, 6)
    return {
      days: d, expDate, label: `${yy}年${+mm}月`, byStrike, atmIV, pcr, volPCR, deltaPCR, pcOI: pcr,
      totalOI: cOI + pOI, netDeltaOI: netOI, domOi, netDelta, gex: gexReal, zeroG, maxPain, skew, rr25, ivHist,
      ivxhv: atmIV
    }
  }).filter(Boolean)
  return expiries
}
// 标的历史日线：etf_qianfuquan.csv（code,date,open,high,low,close,volumn）
function parseHist(code, text) {
  return parseCsv(text).filter(r => r.code === String(code)).map(r => ({ d: r.date, s: +r.close, ma5: null, ma10: null }))
}
// IV 历史：vixs.csv（code,time,open,high,low,close），time=2022/07/22
function parseIvHist(code, text) {
  return parseCsv(text).filter(r => r.code === String(code))
    .map(r => ({ d: r.time.replace(/\//g, '-'), v: +r.close }))
}
function buildCone(closes) {
  const z = []; const win = 21, n = closes.length
  for (let i = win; i < n; i += win) {
    const w = []
    for (let j = i - win + 1; j <= i; j++) w.push(Math.log(closes[j] / closes[j - 1]))
    const m = w.reduce((a, b) => a + b, 0) / w.length
    const sd = Math.sqrt(w.reduce((a, b) => a + (b - m) ** 2, 0) / w.length)
    const an = sd * Math.sqrt(252) * 100
    const d = hist.value[i] ? hist.value[i].d.slice(5) : String(i)
    z.push({ label: d, p10: an * 0.72, p25: an * 0.85, p50: an, p75: an * 1.18, p90: an * 1.42, cur: an })
  }
  return z
}
function buildHV(u, hvBlend) {
  const spot = u.spot
  return {
    hv20: Math.round(hvBlend * 100) / 100, hv60: Math.round(hvBlend * 100) / 100, hvBlend,
    rv5: hvBlend * 0.98, hvRV: hvBlend, hvPark: hvBlend, ma10: spot,
  }
}

/* ===== 数据加载（真实 static 文件，整表一次缓存，按 code 过滤） ===== */
const _cache = { etf: null, hist: null, vixs: null }
async function loadChain() {
  if (_cache.etf == null) {
    try { _cache.etf = await $fetch('/data_etfoption.csv', { responseType: 'text' }) }
    catch (e) { console.warn('loadChain fail', e); return null }
  }
  return _cache.etf
}
async function loadHistory() {
  if (_cache.hist == null) {
    try { _cache.hist = await $fetch('/etf_qianfuquan.csv', { responseType: 'text' }) }
    catch (e) { console.warn('loadHistory fail', e); return null }
  }
  return _cache.hist
}
async function loadIvHist() {
  if (_cache.vixs == null) {
    try { _cache.vixs = await $fetch('/vixs.csv', { responseType: 'text' }) }
    catch (e) { console.warn('loadIvHist fail', e); return null }
  }
  return _cache.vixs
}
function enrichUnderlying(u) {
  if (!u.expiries || !u.expiries.length) return null
  const spot = u.spot, exp = u.expiries[u.expiries.length - 1]
  const termSlope = (exp.atmIV - u.expiries[0].atmIV) / u.expiries[0].atmIV
  const ivHist = u.expiries[0].ivHist || []
  const pct = ivHist.length ? (() => {
    const arr = ivHist.slice().sort((a, b) => a - b)
    return { pct: (arr.filter(v => v <= u.expiries[0].atmIV).length / arr.length) * 100, basis: arr.length }
  })() : null
  const closes = hist.value.map(x => x.s)
  const cone = buildCone(closes)
  const hvBlend = ivHist.length ? Math.sqrt(pstdev(ivHist) * Math.sqrt(252) * 100) : 0
  const hvObj = buildHV(u, hvBlend)
  const ret = (spot / (hist.value[0]?.s || spot) - 1) || 0
  return { ...u, termSlope, cone, ivPct: pct, hvPct: pct, hv: hvObj, ret }
}
function applyHistory(u) {
  if (!u || !hist.value.length) return u
  const last = hist.value[hist.value.length - 1]
  u.spot = last.s; u.chg = last.s - (hist.value[hist.value.length - 2]?.s || last.s)
  u.chgPct = u.chg / (hist.value[hist.value.length - 2]?.s || last.s) * 100
  return u
}

/* ===== 初始化：获取 + 基础转换 ===== */
onMounted(async () => {
  const [etfText, histText, vixsText] = await Promise.all([loadChain(), loadHistory(), loadIvHist()])
  const list = []
  for (const m of OPTIONS_MAP) {
    const code = m.code
    const expiries = etfText ? parseChain(code, etfText) : null
    if (!expiries || !expiries.length) continue
    const h = histText ? parseHist(code, histText) : []
    histMap.value[code] = h
    ivHistStore.value[code] = vixsText ? parseIvHist(code, vixsText) : []
    const u = {
      CODE: code, NAME: m.name, MULT: 10000,
      expiries, spot: 0, chg: 0, chgPct: 0, date: h.length ? h[0].d : ''
    }
    u.hv = { hv20: 0, hv60: 0, hvBlend: 0, rv5: 0, hvRV: 0, hvPark: 0, ma10: 0 }
    hist.value = h
    const enriched = enrichUnderlying(applyHistory(u))
    if (!enriched) continue
    list.push(enriched)
    if (!selU.value) { selU.value = code; hist.value = h; const e0 = enriched.expiries[0]; if (e0) selStg.value = verdictOf(scoreDir(enriched, e0).score, scoreVol(enriched, e0).score, ctxOf(enriched, e0)).key }
  }
  underlyings.value = list
})

useHead({ title: 'ETF 期权策略仪表盘' })
</script>
