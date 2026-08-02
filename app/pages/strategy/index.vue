<template>
  <Nav />
  <div v-if="loaded" class="mx-auto max-w-[1560px] px-5 pb-16 pt-[18px] text-[#1f2329]"
      style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;font-size:13px;line-height:1.55;-webkit-font-smoothing:antialiased">
    <header class="mb-3.5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-[20px] font-[650] tracking-[-.2px]">ETF 期权策略分析看板
          <span class="ml-1 rounded bg-[#eef2fb] px-2 py-0.5 text-[11px] font-semibold text-[#2f6feb]">{{ model.valuationDate || '—' }}</span>
        </h1>
        <div v-if="U && E" class="mt-1 text-[12px] text-[#8f95a1]">
          {{ U.name }} · 现价 <b class="font-semibold text-[#1f2329]">{{ fmt(U.spot, 3) }}</b> ·
          近17日 <span :class="(U.hv.ret17 || 0) >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ sign(U.hv.ret17 || 0) }}{{ fmt(U.hv.ret17 || 0, 2) }}%</span>
          · 当前合约 {{ fmtExp(E.exp) }}（剩余 {{ E.days }} 天）
        </div>
      </div>
      <div class="text-right text-[11.5px] leading-[1.7] text-[#8f95a1]">
        数据源 data_etfoption.csv · {{ model.underlyings.length }} 标的 / {{ totalContracts }} 合约<br />
        历史：vixs.csv（IV 截至 {{ maxVixDate || '—' }}）+ 标的日线（截至 {{ maxTradeDate || '—' }}）
      </div>
    </header>

    <!-- 标的 / 到期月 切换（滑动置顶） -->
    <el-affix :offset="0" class="mb-3.5">
      <div class="flex flex-wrap items-center gap-8 rounded-lg border border-[#e5e8ef] bg-white px-4 py-3 shadow-sm">
        <div class="w-full max-w-[640px]">
          <div class="mb-1.5 text-[11.5px] tracking-[.4px] text-[#8f95a1]">标的</div>
          <TabSelect :options="tabUOptions" v-model="selU" />
        </div>
        <div v-if="U" class="w-full max-w-[640px]">
          <div class="mb-1.5 text-[11.5px] tracking-[.4px] text-[#8f95a1]">到期月</div>
          <TabSelect :options="tabEOptions" v-model="selE" />
        </div>
      </div>
    </el-affix>

    <!-- 区块一：标的变会变（仅依赖标的） -->
    <section class="mb-3.5 rounded-lg border border-[#2f6feb] bg-[#f5f8ff] p-3.5">
      <h2 class="mb-3 text-[12px] font-[600] tracking-[.4px] text-[#2f6feb]">仅随标的切换 — 标的变会变</h2>

      <ModuleTermStructure :u="U" />

      <div class="mt-3.5 grid grid-cols-2 gap-3.5">
        <ModuleVolCone :u="U" />
        <ModuleSpotTrend :u="U" />
      </div>

      <ModuleMethodology :u="U" :max-vix-date="maxVixDate" :max-trade-date="maxTradeDate" class="mt-3.5" />
    </section>

    <!-- 区块二：标的和到期月都会变 -->
    <section class="mb-3.5 rounded-lg border border-[#e0913a] bg-[#fff8ef] p-3.5">
      <h2 class="mb-3 text-[12px] font-[600] tracking-[.4px] text-[#c97a1a]">随标的与到期月切换 — 两者皆变</h2>

      <!-- 结论 -->
      <ModuleVerdict :u="U" :e="E" />

      <!-- KPI -->
      <ModuleKpiCards :u="U" :e="E" class="mt-3.5" />

      <!-- 信号明细 -->
      <div class="mt-3.5 grid grid-cols-2 gap-3.5">
        <ModuleDirSignal :u="U" :e="E" />
        <ModuleVolSignal :u="U" :e="E" />
      </div>

      <ModuleIvHist :u="U" :e="E" class="mt-3.5" />

      <div class="mt-3.5 grid grid-cols-2 gap-3.5">
        <ModulePayoff :u="U" :e="E" v-model:sel-stg="selStg" />
        <ModuleStrategyKpi :u="U" :e="E" :sel-stg="selStg" />
      </div>

      <!-- 按到期月下钻的合约明细（同随两者变化） -->
      <div class="mt-3.5 grid grid-cols-2 gap-3.5">
        <ModuleIvSmile :e="E" />
        <ModuleOi :e="E" />
      </div>

      <div class="mt-3.5 grid grid-cols-2 gap-3.5">
        <ModuleDoi :e="E" />
        <ModuleGex :e="E" />
      </div>

      <ModuleGreeks :e="E" class="mt-3.5" />

      <ModuleTTable :e="E" class="mt-3.5" />
    </section>

    <!-- 静态区：不随标的/到期月筛选变化 -->
    <section class="mb-3.5 rounded-lg border border-[#9aa3b2] bg-[#f6f7f9] p-3.5">
      <h2 class="mb-3 text-[12px] font-[600] tracking-[.4px] text-[#6b7280]">六标的横截面（不随筛选变化）</h2>

      <ModuleCrossSection :underlyings="model.underlyings" />

      <ModuleQuadrant :underlyings="model.underlyings" :sel-u="selU" class="mt-3.5" />

      <ModuleRank :underlyings="model.underlyings" :sel-u="selU" class="mt-3.5" />
    </section>
  </div>

  <div v-else class="mx-auto max-w-[1560px] px-5 py-20 text-center text-[#8f95a1]">
    <div v-if="loadError" style="color: #e02020">{{ loadError }}</div>
    <div v-else>数据加载中…（若作为页面独立运行，将自动拉取 /data_etfoption.csv 与历史文件）</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import Papa from 'papaparse'
import TabSelect from '~/components/TabSelect.vue'
import { OPTIONS_MAP, fields_dict } from '~/data'
import { fmt, sign, fmtExp, pstdev, daysBetween, MULT, NAME2CODE, SHORT } from './components/lib'
import ModuleVerdict from './components/ModuleVerdict.vue'
import ModuleKpiCards from './components/ModuleKpiCards.vue'
import ModuleDirSignal from './components/ModuleDirSignal.vue'
import ModuleVolSignal from './components/ModuleVolSignal.vue'
import ModuleIvSmile from './components/ModuleIvSmile.vue'
import ModuleTermStructure from './components/ModuleTermStructure.vue'
import ModuleVolCone from './components/ModuleVolCone.vue'
import ModuleIvHist from './components/ModuleIvHist.vue'
import ModuleOi from './components/ModuleOi.vue'
import ModuleDoi from './components/ModuleDoi.vue'
import ModuleGex from './components/ModuleGex.vue'
import ModuleGreeks from './components/ModuleGreeks.vue'
import ModuleSpotTrend from './components/ModuleSpotTrend.vue'
import ModuleCrossSection from './components/ModuleCrossSection.vue'
import ModuleQuadrant from './components/ModuleQuadrant.vue'
import ModulePayoff from './components/ModulePayoff.vue'
import ModuleRank from './components/ModuleRank.vue'
import ModuleStrategyKpi from './components/ModuleStrategyKpi.vue'
import ModuleTTable from './components/ModuleTTable.vue'
import ModuleMethodology from './components/ModuleMethodology.vue'

/* ============ 字段解析（业务字段 -> 中文名，中文名由 fields_dict 映射为 f 编号） ============ */
const CODE2F = Object.fromEntries(Object.entries(fields_dict).map(([f, cn]) => [cn, f]))
const MAP = {
  name: '期权名称', code: '期权代码', last: '最新价', prev: '昨收', bid: '买一', ask: '卖一',
  oi: '持仓量', doi: '日增量', iv: '隐波', prem: '溢价率', K: '行权价', exp: '到期日',
  lev: '杠杆', delta: 'Delta', gamma: 'Gamma', vega: 'Vega', theta: 'Theta',
  spot: '正股价格', uname: '正股',
}
// 业务字段 -> f 编号（fields_dict 未覆盖的字段回退为其中文名）
const F = (key) => CODE2F[MAP[key]]
const pick = (row, key, d = null) => {
  const names = [F(key), MAP[key]].filter(Boolean)
  for (const n of names) {
    const raw = row[n]
    if (raw !== undefined && raw !== null && raw !== '') { const num = parseFloat(raw); if (!isNaN(num)) return num }
  }
  return d
}
const pickStr = (row, key, d = '') => {
  const names = [F(key), MAP[key]].filter(Boolean)
  for (const n of names) { const raw = row[n]; if (raw !== undefined && raw !== null && raw !== '') return String(raw) }
  return d
}

/* ============ 状态 ============ */
const model = ref({ underlyings: [], chain: [], valuationDate: '', multiplier: MULT })
const loaded = ref(false)
const loadError = ref('')
const valDate = ref('')
const maxTradeDate = ref('')
const maxVixDate = ref('')
const selU = ref(null)
const selE = ref(null)
const selStg = ref(null)
const ivHistStore = reactive({})
const dailyStore = reactive({})

const tabUOptions = computed(() => {
  const order = OPTIONS_MAP.map(o => o.code)
  return [...model.value.underlyings]
    .sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code))
    .map(u => ({ value: u.code, label: u.short }))
})
const tabEOptions = computed(() =>
  (U.value ? U.value.expiries : []).map(e => ({ value: e.exp, label: `${fmtExp(e.exp)} · ${e.days}天` }))
)

const totalContracts = computed(() => model.value.chain.length)
const U = computed(() => model.value.underlyings.find(x => x.code === selU.value) || model.value.underlyings[0] || null)
const E = computed(() => { const u = U.value; if (!u) return null; return u.expiries.find(x => x.exp === selE.value) || u.expiries[0] || null })

/* ============ 解析期权链 ============ */
function parseChain(rows) {
  const chain = []
  rows.forEach((r) => {
    const name = pickStr(r, 'name')
    let type = null
    if (name.includes('购')) type = 'C'; else if (name.includes('沽')) type = 'P'
    if (!type) return
    const uname = pickStr(r, 'uname')
    const code = pickStr(r, 'code') || NAME2CODE[uname] || null
    const K = pick(r, 'K'), last = pick(r, 'last'), prev = pick(r, 'prev')
    const bid = pick(r, 'bid'), ask = pick(r, 'ask')
    const oi = pick(r, 'oi'), doi = pick(r, 'doi')
    const iv = pick(r, 'iv'), prem = pick(r, 'prem')
    const exp = pickStr(r, 'exp'), lev = pick(r, 'lev')
    const delta = pick(r, 'delta'), gamma = pick(r, 'gamma'), vega = pick(r, 'vega'), theta = pick(r, 'theta')
    const spot = pick(r, 'spot')
    let L = last; if (L == null || isNaN(L)) L = (!isNaN(bid) && bid != null) ? bid : (!isNaN(ask) && ask != null) ? ask : (prev || 0)
    let P = prev; if (P == null || isNaN(P)) P = L
    const chg = P ? (L - P) / P * 100 : 0
    const intrinsic = Math.max(0, (spot - K) * (type === 'C' ? 1 : -1))
    const timeval = L - intrinsic
    const thetaYuan = (theta || 0) / 365 * MULT
    const vegaYuan = (vega || 0) * MULT * 0.01
    chain.push({ u: code, uname, name, type, K, L, P, bid, ask, oi: oi || 0, doi: doi || 0, iv, prem,
      exp, lev, delta: delta || 0, gamma: gamma || 0, vega: vega || 0, theta: theta || 0, spot,
      intrinsic, timeval, chg, thetaYuan, vegaYuan })
  })
  const byU = {}
  chain.forEach(c => { (byU[c.u] = byU[c.u] || []).push(c) })
  const underlyings = Object.keys(byU).map((code) => {
    const items = byU[code]; const uname = items[0].uname; const spot = items[0].spot
    const expiries = [...new Set(items.map(x => x.exp))].sort().map((exp) => {
      const sub = items.filter(x => x.exp === exp)
      const strikes = [...new Set(sub.map(x => x.K))].sort((a, b) => a - b)
      const cmap = {}, pmap = {}
      sub.forEach(x => { (x.type === 'C' ? cmap : pmap)[x.K] = x })
      const atmK = strikes.reduce((a, b) => Math.abs(b - spot) < Math.abs(a - spot) ? b : a, strikes[0])
      const cc = cmap[atmK], pp = pmap[atmK]
      const ivs = [cc, pp].filter(x => x && x.iv).map(x => x.iv)
      const atmIV = ivs.length ? ivs.reduce((a, b) => a + b, 0) / ivs.length : null
      const ivc25 = interpDelta(sub.filter(x => x.type === 'C').map(x => [Math.abs(x.delta), x.iv]))
      const ivp25 = interpDelta(sub.filter(x => x.type === 'P').map(x => [Math.abs(x.delta), x.iv]))
      const rr25 = (ivc25 != null && ivp25 != null) ? ivc25 - ivp25 : null
      const bf25 = (ivc25 != null && ivp25 != null && atmIV != null) ? (ivc25 + ivp25) / 2 - atmIV : null
      const callOI = sub.filter(x => x.type === 'C').reduce((a, x) => a + x.oi, 0)
      const putOI = sub.filter(x => x.type === 'P').reduce((a, x) => a + x.oi, 0)
      const callDOI = sub.filter(x => x.type === 'C').reduce((a, x) => a + x.doi, 0)
      const putDOI = sub.filter(x => x.type === 'P').reduce((a, x) => a + x.doi, 0)
      const pain = strikes.map(K => { let pay = 0; sub.forEach(x => { pay += (x.type === 'C' ? Math.max(0, K - x.K) : Math.max(0, x.K - K)) * x.oi }); return { K, pain: pay * MULT } })
      const maxPain = pain.reduce((a, b) => a.pain < b.pain ? a : b).K
      const byStrike = strikes.map(K => {
        const c_ = cmap[K], p_ = pmap[K]
        const gexC = (c_ && c_.gamma) ? c_.gamma * c_.oi * MULT * spot * spot * 0.01 : 0
        const gexP = (p_ && p_.gamma) ? p_.gamma * p_.oi * MULT * spot * spot * 0.01 : 0
        return { K,
          cIV: c_ ? c_.iv : null, pIV: p_ ? p_.iv : null,
          cOI: c_ ? c_.oi : 0, pOI: p_ ? p_.oi : 0, cDOI: c_ ? c_.doi : 0, pDOI: p_ ? p_.doi : 0,
          cLast: c_ ? c_.L : null, pLast: p_ ? p_.L : null,
          cChg: c_ ? +c_.chg.toFixed(2) : null, pChg: p_ ? +p_.chg.toFixed(2) : null,
          cDelta: c_ ? c_.delta : null, pDelta: p_ ? p_.delta : null,
          cGamma: c_ ? c_.gamma : null, pGamma: p_ ? p_.gamma : null,
          cVega: c_ ? c_.vega : null, pVega: p_ ? p_.vega : null,
          cTheta: c_ ? +c_.thetaYuan.toFixed(2) : null, pTheta: p_ ? +p_.thetaYuan.toFixed(2) : null,
          cLev: c_ ? c_.lev : null, pLev: p_ ? p_.lev : null,
          cPrem: c_ ? c_.prem : null, pPrem: p_ ? p_.prem : null,
          cTV: c_ ? +c_.timeval.toFixed(4) : null, pTV: p_ ? +p_.timeval.toFixed(4) : null,
          gexC, gexP, netGex: gexC - gexP }
      })
      const netDelta = sub.reduce((a, x) => a + (x.delta || 0) * x.oi, 0)
      const netGex = byStrike.reduce((a, b) => a + b.netGex, 0)
      let cum = 0, flip = null, pr = null
      byStrike.forEach(b => { cum += b.netGex; if (pr != null && pr < 0 && cum >= 0) flip = b.K; pr = cum })
      return { exp, days: valDate.value ? daysBetween(valDate.value, exp) : 30, atmK, atmIV, ivc25, ivp25, rr25, bf25,
        callOI, putOI, oiPCR: callOI ? putOI / callOI : null, callDOI, putDOI, doiPCR: callDOI > 0 ? putDOI / callDOI : null,
        maxPain, painCurve: pain, byStrike, netDelta, netGex, gammaFlip: flip, totalOI: callOI + putOI }
    })
    const totalOI = expiries.reduce((a, e) => a + e.totalOI, 0)
    return { code, name: uname, short: SHORT[code] || uname, spot, hv: {}, longHV: null, ivHist: [], ivPct: null, expiries, totalOI }
  })
  underlyings.sort((a, b) => b.totalOI - a.totalOI)
  return { underlyings, chain, valuationDate: valDate.value || '', multiplier: MULT }
}
function interpDelta(pts, target = 0.25) {
  const a = pts.filter(p => p[0] && p[1] && p[0] > 0.01 && p[0] < 0.99).sort((x, y) => x[0] - y[0])
  if (a.length < 2) return a.length ? a[0][1] : null
  if (target <= a[0][0]) return a[0][1]
  if (target >= a[a.length - 1][0]) return a[a.length - 1][1]
  for (let i = 1; i < a.length; i++) {
    if (a[i][0] >= target) {
      const [a0, i0] = a[i - 1], [a1, i1] = a[i]
      if (a1 === a0) return i1
      return i0 + (i1 - i0) * (target - a0) / (a1 - a0)
    }
  }
  return null
}

/* ============ 历史数据加载与加工 ============ */
async function loadChain() {
  try {
    const res = await fetch('/data_etfoption.csv')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const txt = await res.text()
    const rows = Papa.parse(txt, { header: true, skipEmptyLines: true }).data
    buildFromRows(rows)
  } catch (e) { loadError.value = '无法加载期权链数据：' + e.message }
}
function buildFromRows(rows) {
  model.value = parseChain(rows)
  loaded.value = true
  if (selU.value == null) selU.value = OPTIONS_MAP[0].code
  const u = U.value
  if (u && !selE.value) selE.value = u.expiries[0].exp
}
async function loadHistory() {
  const codes = model.value.underlyings.map(u => u.code)
  try {
    const res = await fetch('/vixs.csv'); const txt = await res.text()
    const rows = Papa.parse(txt, { header: true, skipEmptyLines: true }).data
    rows.forEach((r) => {
      const d = r.time; if (!d) return
      const code = r.code
      const v = parseFloat(r.close)
      if (code && v > 1 && v < 200) (ivHistStore[code] = ivHistStore[code] || []).push({ d, v })
    })
  } catch (e) { /* IV 历史缺失则降级 */ }
  try {
    const res = await fetch('/etf_qianfuquan.csv')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const txt = await res.text()
    const rows = Papa.parse(txt, { header: true, skipEmptyLines: true }).data.filter(r => r.close)
    const byCode = {}
    rows.forEach(r => {
      const code = r.code; if (!code) return
      ;(byCode[code] = byCode[code] || []).push({ d: r.date, o: +r.open, h: +r.high, l: +r.low, c: +r.close, v: +r.volumn || 0 })
    })
    codes.forEach(code => { if (byCode[code]) dailyStore[code] = byCode[code] })
  } catch (e) { /* 无日线则降级 */ }
  let md = null
  codes.forEach(c => (dailyStore[c] || []).forEach(x => { if (!md || x.d > md) md = x.d }))
  if (md) { maxTradeDate.value = md }
  let mv = null
  codes.forEach(c => (ivHistStore[c] || []).forEach(x => { if (!mv || x.d > mv) mv = x.d }))
  if (mv) maxVixDate.value = mv
  if (md && !valDate.value) { valDate.value = md; recomputeDays() }
  model.value.underlyings.forEach(enrichUnderlying)
}
function recomputeDays() {
  if (!valDate.value) return
  model.value.underlyings.forEach(u => u.expiries.forEach(e => { e.days = daysBetween(valDate.value, e.exp) }))
}
function enrichUnderlying(u) {
  const code = u.code
  const ds = (dailyStore[code] || []).slice().sort((a, b) => a.d < b.d ? -1 : 1)
  const hv = {}
  if (ds.length >= 5) {
    const cl = ds.map(x => x.c)
    const rets = []
    for (let i = 1; i < cl.length; i++) if (cl[i - 1] > 0) rets.push(Math.log(cl[i] / cl[i - 1]))
    hv.hvCC = pstdev(rets) * Math.sqrt(252) * 100
    const pk = ds.filter(x => x.l > 0).map(x => (Math.log(x.h / x.l) ** 2) / (4 * Math.log(2)))
    hv.hvPark = Math.sqrt(pk.reduce((a, b) => a + b, 0) / pk.length) * Math.sqrt(252) * 100
    if (rets.length >= 5) { hv.hv5 = pstdev(rets.slice(-5)) * Math.sqrt(252) * 100; hv.hv10 = pstdev(rets.slice(-10)) * Math.sqrt(252) * 100; hv.rv5 = hv.hv5 }
    hv.hvBlend = 0.5 * hv.hvPark + (hv.rv5 ? 0.3 * hv.rv5 : 0.3 * hv.hvPark) + 0.2 * (hv.hvCC || hv.hvPark)
    hv.rvTrend = (hv.rv5 && hv.hvCC) ? hv.rv5 / hv.hvCC - 1 : 0
    hv.ret17 = ds.length >= 17 ? (cl[cl.length - 1] / cl[cl.length - 17] - 1) * 100 : (cl[cl.length - 1] / cl[0] - 1) * 100
    hv.ma5 = cl.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, cl.length)
    hv.ma10 = cl.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, cl.length)
    hv.last = cl[cl.length - 1]
    hv.closes = ds.map(x => ({ d: x.d, o: x.o, h: x.h, l: x.l, c: x.c, v: x.v }))
  }
  u.hv = hv
  if (ds.length >= 400) {
    const cl = ds.map(x => x.c); const rets = []
    for (let i = 1; i < cl.length; i++) if (cl[i - 1] > 0) rets.push(Math.log(cl[i] / cl[i - 1]))
    const cone = [5, 10, 20, 40, 60, 120, 250].map((win) => {
      const hs = []
      for (let i = win; i < rets.length; i++) hs.push(pstdev(rets.slice(i - win, i)) * Math.sqrt(252) * 100)
      const tail = hs.slice(-750); const s = tail.slice().sort((a, b) => a - b); const n = s.length
      return { win, min: s[0], p10: s[Math.floor(n / 10)], p25: s[Math.floor(n / 4)], median: s[Math.floor(n / 2)],
        p75: s[Math.floor(3 * n / 4)], p90: s[Math.floor(9 * n / 10)], max: s[n - 1], cur: tail[tail.length - 1] }
    })
    u.longHV = { cone, endDate: ds[ds.length - 1].d }
  } else u.longHV = null
  const ih = (ivHistStore[code] || []).slice(-750)
  u.ivHist = ih
  if (ih.length && u.expiries[0] && u.expiries[0].atmIV != null) {
    const vals = ih.map(x => x.v); const s = vals.slice().sort((a, b) => a - b); const n = s.length
    const below = vals.filter(v => v < u.expiries[0].atmIV).length
    u.ivPct = { pct: below / n * 100, n, median: s[Math.floor(n / 2)], p10: s[Math.floor(n / 10)],
      p90: s[Math.floor(9 * n / 10)], min: s[0], max: s[n - 1], last: ih[ih.length - 1].v, lastDate: ih[ih.length - 1].d }
  } else u.ivPct = null
}

watch(selU, () => { const u = model.value.underlyings.find(x => x.code === selU.value); selE.value = (u && u.expiries && u.expiries.length) ? u.expiries[0].exp : null; selStg.value = null })

/* ============ 生命周期 ============ */
onMounted(async () => {
  await loadChain()
  await loadHistory()
})
</script>
