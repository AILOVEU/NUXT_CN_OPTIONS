<template>
  <div class="relative mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="absolute right-3 top-3 z-10 flex gap-1.5">
      <span class="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#8f95a1]">data_stockindex.csv</span>
    </div>
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold">
      <span class="h-[13px] w-[3px] rounded-[2px] bg-[#e67e22]"></span>股指期权全景分析
    </div>
    <div class="mb-3 pl-[11px] text-[11.5px] text-[#8f95a1]">
      基于 public/data_stockindex.csv，覆盖上证50 / 沪深300 / 中证1000 三大股指期权，辅助买卖决策与观点输出
    </div>

    <div v-if="loading" class="py-8 text-center text-[12px] text-[#8f95a1]">加载股指期权数据中…</div>
    <div v-else-if="err" class="py-8 text-center text-[12px] text-[#e02020]">{{ err }}</div>
    <div v-else-if="!rows.length" class="py-8 text-center text-[12px] text-[#8f95a1]">无有效股指期权数据</div>

    <template v-else>
      <!-- 标的切换 -->
      <div class="mb-3 flex items-center gap-2">
        <span class="text-[11.5px] text-[#8f95a1]">标的：</span>
        <button
          v-for="u in underlyings" :key="u"
          class="rounded-md px-3 py-1 text-[11.5px] font-medium transition-colors"
          :class="selUnderlying === u ? 'bg-[#e67e22] text-white' : 'bg-[#f6f7f9] text-[#5f6672] hover:bg-[#eef0f3]'"
          @click="selUnderlying = u"
        >{{ u }}</button>
        <span class="ml-4 text-[11.5px] text-[#8f95a1]">到期月：</span>
        <button
          v-for="exp in expiries" :key="exp"
          class="rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors"
          :class="selExpiry === exp ? 'bg-[#e67e22] text-white' : 'bg-[#f6f7f9] text-[#5f6672] hover:bg-[#eef0f3]'"
          @click="selExpiry = exp"
        >{{ exp }}</button>
      </div>

      <!-- 图 1：IV 偏斜 + 图 2：期限结构（并排） -->
      <div class="grid grid-cols-2 gap-3.5">
        <section>
          <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 1 · IV 偏斜曲线（按到期月）</div>
          <VChart :option="skewOpt" autoresize class="chart" />
        </section>
        <section>
          <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 2 · ATM IV 期限结构</div>
          <VChart :option="termOpt" autoresize class="chart" />
        </section>
      </div>

      <!-- 图 3：持仓量分布（按行权价） -->
      <section class="mt-3.5">
        <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 3 · 持仓量 OI 分布（按行权价，当前标的）</div>
        <VChart :option="oiOpt" autoresize class="chart" />
      </section>

      <!-- 图 4：Put/Call 比率 + 图 5：Delta 暴露（并排） -->
      <div class="mt-3.5 grid grid-cols-2 gap-3.5">
        <section>
          <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 4 · Put/Call 比率（OI & 成交量）</div>
          <VChart :option="pcOpt" autoresize class="chart" />
        </section>
        <section>
          <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 5 · Delta 暴露分布（按到期月）</div>
          <VChart :option="deltaOpt" autoresize class="chart" />
        </section>
      </div>

      <!-- 图 6：各标的 IV 水位对比（锥形） -->
      <section class="mt-3.5">
        <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 6 · 三大股指 ATM IV 当前水位</div>
        <VChart :option="ivLevelOpt" autoresize class="chart" />
      </section>

      <!-- 图 7：跨标的 IV 偏斜对比 + 图 8：风险反转（并排） -->
      <div class="mt-3.5 grid grid-cols-2 gap-3.5">
        <section>
          <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 7 · 跨标的 IV 偏斜对比（近月）</div>
          <VChart :option="crossSkewOpt" autoresize class="chart" />
        </section>
        <section>
          <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 8 · 25-Delta 风险反转</div>
          <VChart :option="rrOpt" autoresize class="chart" />
        </section>
      </div>

      <!-- 图 9：Gamma 敞口 GEX -->
      <section class="mt-3.5">
        <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 9 · Gamma 敞口 GEX（当前标的 & 到期月）</div>
        <div class="mb-1 text-[11px] text-[#8f95a1]">按做市商多认购、空认沽假设。累计为正=做市商多Gamma会抑制波动，为负=放大波动</div>
        <VChart :option="gexOpt" autoresize class="chart-tall" />
      </section>

      <!-- 核心观点 -->
      <div class="mt-3.5 rounded-[8px] border border-[#fde8d0] bg-[#fef9f2] p-3 text-[12px] leading-[1.7] text-[#4a4458]">
        <b class="text-[#e67e22]">核心观点：</b>{{ viewpoint }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_DN, C_WARN } from './lib'

/* ============ 常量 ============ */
const UNDERLYING_NAMES = { '上证50': '上证50', '沪深300': '沪深300', '中证1000': '中证1000' }
const UNDERLYING_SPOTS = { '上证50': 2887.05, '沪深300': 4543.18, '中证1000': 7079.78 }
const PALETTE = ['#e67e22', '#2f6feb', '#19b36b', '#e02020', '#9b59b6', '#1abc9c']

/* ============ 到期月排序 ============ */
function parseExpiry(exp) {
  const m = exp.match(/(\d{2})年(\d{1,2})月/)
  if (!m) return null
  return { year: 2000 + parseInt(m[1]), month: parseInt(m[2]) }
}
function sortExpiries(exps) {
  return exps.slice().sort((a, b) => {
    const pa = parseExpiry(a), pb = parseExpiry(b)
    if (!pa || !pb) return a.localeCompare(b)
    return pa.year !== pb.year ? pa.year - pb.year : pa.month - pb.month
  })
}

/* ============ 数据加载 ============ */
const loading = ref(true)
const err = ref('')
const rows = ref([])
const selUnderlying = ref('上证50')
const selExpiry = ref('')

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length)
  if (!lines.length) return []
  const headers = lines[0].split(',').map(s => s.trim().replace(/"/g, ''))
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(s => s.trim().replace(/"/g, ''))
    if (vals.length < headers.length) continue
    const r = {}
    for (let j = 0; j < headers.length; j++) r[headers[j]] = vals[j]
    const name = r.f14 || ''
    const cp = name.includes('购') ? 'C' : name.includes('沽') ? 'P' : null
    if (!cp) continue
    // 提取到期月：期权名称如"上证50沽26年8月2850" -> "26年8月"
    const expMatch = name.match(/(\d{2})年(\d{1,2})月/)
    const expiry = expMatch ? `${expMatch[1]}年${expMatch[2]}月` : ''
    if (!expiry) continue

    const underlying = r.f333 || ''
    if (!UNDERLYING_NAMES[underlying]) continue

    out.push({
      underlying,
      expiry,
      cp,
      name,
      last: parseFloat(r.f2) || 0,
      chgPct: parseFloat(r.f3) || 0,
      chg: parseFloat(r.f4) || 0,
      vol: parseInt(r.f5) || 0,
      bid: parseFloat(r.f31) || 0,
      ask: parseFloat(r.f32) || 0,
      oi: parseInt(r.f108) || 0,
      K: parseFloat(r.f161) || 0,
      iv: parseFloat(r.f249) || 0,
      delta: parseFloat(r.f325) || 0,
      spot: parseFloat(r.f334) || UNDERLYING_SPOTS[underlying] || 0,
    })
  }
  return out
}

onMounted(async () => {
  try {
    const res = await fetch('/data_stockindex.csv')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const text = await res.text()
    const data = parseCsv(text)
    if (!data.length) { err.value = 'CSV 无有效行'; return }
    rows.value = data
    // 默认选第一个标的和第一个到期月
    const uSet = [...new Set(data.map(r => r.underlying))].sort()
    selUnderlying.value = uSet[0] || '上证50'
    const exps = sortExpiries([...new Set(data.filter(r => r.underlying === selUnderlying.value).map(r => r.expiry))])
    selExpiry.value = exps[0] || ''
  } catch (e) { err.value = '加载失败: ' + e.message } finally { loading.value = false }
})

/* ============ 派生数据 ============ */
const underlyings = computed(() => [...new Set(rows.value.map(r => r.underlying))].sort())
const expiries = computed(() => {
  const exps = [...new Set(rows.value.filter(r => r.underlying === selUnderlying.value).map(r => r.expiry))]
  return sortExpiries(exps)
})
const filtered = computed(() => rows.value.filter(r => r.underlying === selUnderlying.value && r.expiry === selExpiry.value))
const allByU = computed(() => {
  const map = {}
  for (const r of rows.value) {
    if (!map[r.underlying]) map[r.underlying] = []
    map[r.underlying].push(r)
  }
  return map
})

// 找到某标的某到期月下最接近 ATM 的 IV（C+P 均值）
function atmIV(underlying, expiry) {
  const spot = UNDERLYING_SPOTS[underlying] || 0
  const opts = rows.value.filter(r => r.underlying === underlying && r.expiry === expiry)
  if (!opts.length) return null
  let best = null, bestDist = Infinity
  for (const r of opts) {
    const d = Math.abs(r.K - spot)
    if (d < bestDist) { bestDist = d; best = r }
  }
  return best ? best.iv : null
}

/* ============ 统计工具 ============ */
function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN }
function stdev(a) { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length) }
function quant(a, q) { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.min(lo + 1, s.length - 1); return s[lo] + (s[hi] - s[lo]) * (pos - lo) }

/* ============ 图 1：IV 偏斜曲线 ============ */
const skewOpt = computed(() => {
  if (!filtered.value.length) return Object.assign({}, BASE_OPT)
  const exps = expiries.value
  const series = []
  exps.forEach((exp, i) => {
    const calls = filtered.value.filter(r => r.expiry === exp && r.cp === 'C').sort((a, b) => a.K - b.K)
    const puts = filtered.value.filter(r => r.expiry === exp && r.cp === 'P').sort((a, b) => a.K - b.K)
    const spot = UNDERLYING_SPOTS[selUnderlying.value] || 0
    const data = calls.map(r => [(r.K / spot * 100 - 100).toFixed(1), r.iv])
    if (data.length) {
      series.push({ name: exp + ' 购', type: 'line', data, symbol: 'circle', symbolSize: 4, lineStyle: { width: 1.5, color: PALETTE[i * 2 % PALETTE.length] }, itemStyle: { color: PALETTE[i * 2 % PALETTE.length] } })
    }
    const pdata = puts.map(r => [(r.K / spot * 100 - 100).toFixed(1), r.iv])
    if (pdata.length) {
      series.push({ name: exp + ' 沽', type: 'line', data: pdata, symbol: 'diamond', symbolSize: 4, lineStyle: { width: 1.5, color: PALETTE[(i * 2 + 1) % PALETTE.length], type: 'dashed' }, itemStyle: { color: PALETTE[(i * 2 + 1) % PALETTE.length] } })
    }
  })
  return Object.assign({}, BASE_OPT, {
    tooltip: { trigger: 'axis' },
    legend: { type: 'scroll', top: 2, textStyle: { fontSize: 10 } },
    xAxis: Object.assign({ type: 'category', name: 'OTM%', axisLabel: { color: '#5f6672', fontSize: 10 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true, axisLabel: { color: '#8f95a1', fontSize: 10 } }, AXIS),
    series,
  })
})

/* ============ 图 2：ATM IV 期限结构 ============ */
const termOpt = computed(() => {
  if (!rows.value.length) return Object.assign({}, BASE_OPT)
  const series = []
  underlyings.value.forEach((u, i) => {
    const pts = []
    const exps = sortExpiries([...new Set(rows.value.filter(r => r.underlying === u).map(r => r.expiry))])
    for (const exp of exps) {
      const iv = atmIV(u, exp)
      if (iv != null) pts.push([exp, iv])
    }
    if (pts.length) {
      series.push({ name: u, type: 'line', data: pts, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: PALETTE[i] }, itemStyle: { color: PALETTE[i] } })
    }
  })
  return Object.assign({}, BASE_OPT, {
    tooltip: { trigger: 'axis' },
    legend: { top: 2, textStyle: { fontSize: 10 } },
    xAxis: Object.assign({ type: 'category', axisLabel: { color: '#5f6672', fontSize: 10 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'ATM IV %', scale: true, axisLabel: { color: '#8f95a1', fontSize: 10 } }, AXIS),
    series,
  })
})

/* ============ 图 3：OI 分布 ============ */
const oiOpt = computed(() => {
  if (!filtered.value.length) return Object.assign({}, BASE_OPT)
  const spot = UNDERLYING_SPOTS[selUnderlying.value] || 0
  const sorted = filtered.value.slice().sort((a, b) => a.K - b.K)
  const cats = sorted.map(r => r.K)
  const callOi = sorted.filter(r => r.cp === 'C').map(r => { const m = sorted.find(s => s.K === r.K && s.cp === 'C'); return m ? m.oi : 0 })
  const putOi = sorted.filter(r => r.cp === 'P').map(r => { const m = sorted.find(s => s.K === r.K && s.cp === 'P'); return m ? m.oi : 0 })
  // 去重 K
  const uniqK = [...new Set(cats)]
  const cOi = uniqK.map(k => { const f = filtered.value.find(r => r.K === k && r.cp === 'C'); return f ? f.oi : 0 })
  const pOi = uniqK.map(k => { const f = filtered.value.find(r => r.K === k && r.cp === 'P'); return f ? f.oi : 0 })
  return Object.assign({}, BASE_OPT, {
    grid: { left: 56, right: 20, top: 30, bottom: 44 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 2, data: ['Call OI', 'Put OI'], textStyle: { fontSize: 10 } },
    xAxis: Object.assign({ type: 'category', data: uniqK, axisLabel: { color: '#5f6672', fontSize: 9, rotate: 30 }, name: '行权价' }, AXIS),
    yAxis: Object.assign({ type: 'value', name: '持仓量', axisLabel: { color: '#8f95a1', fontSize: 10, formatter: v => v >= 10000 ? (v / 10000).toFixed(0) + '万' : v } }, AXIS),
    series: [
      { name: 'Call OI', type: 'bar', data: cOi, itemStyle: { color: C_UP, opacity: 0.7 }, barMaxWidth: 16 },
      { name: 'Put OI', type: 'bar', data: pOi, itemStyle: { color: C_DN, opacity: 0.7 }, barMaxWidth: 16 },
      { name: '标的价格', type: 'line', data: uniqK.map(k => (k === Math.round(spot / 50) * 50 ? spot : null)), symbol: 'none', lineStyle: { opacity: 0 }, markLine: { silent: true, symbol: 'none', data: [{ xAxis: uniqK.indexOf(Math.round(spot / 50) * 50), lineStyle: { color: '#9ca3af', type: 'dashed', width: 1 }, label: { formatter: '现价 ' + spot, fontSize: 9, color: '#6b7280' } }] }, silent: true },
    ],
  })
})

/* ============ 图 4：Put/Call 比率 ============ */
const pcOpt = computed(() => {
  if (!rows.value.length) return Object.assign({}, BASE_OPT)
  const cats = underlyings.value
  const pcOi = cats.map(u => {
    const calls = rows.value.filter(r => r.underlying === u && r.cp === 'C')
    const puts = rows.value.filter(r => r.underlying === u && r.cp === 'P')
    const coi = calls.reduce((s, r) => s + r.oi, 0)
    const poi = puts.reduce((s, r) => s + r.oi, 0)
    return coi ? +(poi / coi).toFixed(2) : 0
  })
  const pcVol = cats.map(u => {
    const calls = rows.value.filter(r => r.underlying === u && r.cp === 'C')
    const puts = rows.value.filter(r => r.underlying === u && r.cp === 'P')
    const cv = calls.reduce((s, r) => s + r.vol, 0)
    const pv = puts.reduce((s, r) => s + r.vol, 0)
    return cv ? +(pv / cv).toFixed(2) : 0
  })
  return Object.assign({}, BASE_OPT, {
    grid: { left: 50, right: 20, top: 30, bottom: 36 },
    tooltip: { trigger: 'axis' },
    legend: { top: 2, data: ['OI P/C', 'Vol P/C'], textStyle: { fontSize: 10 } },
    xAxis: Object.assign({ type: 'category', data: cats, axisLabel: { color: '#5f6672', fontSize: 10 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: '比率', axisLabel: { color: '#8f95a1', fontSize: 10 } }, AXIS),
    series: [
      { name: 'OI P/C', type: 'bar', data: pcOi, itemStyle: { color: '#e67e22', borderRadius: [3, 3, 0, 0] }, barWidth: 20, label: { show: true, position: 'top', fontSize: 10, color: '#e67e22' } },
      { name: 'Vol P/C', type: 'bar', data: pcVol, itemStyle: { color: '#2f6feb', borderRadius: [3, 3, 0, 0] }, barWidth: 20, label: { show: true, position: 'top', fontSize: 10, color: '#2f6feb' } },
      { name: '', type: 'line', data: cats.map(() => 1), symbol: 'none', lineStyle: { color: '#9ca3af', type: 'dashed', width: 1 }, silent: true, tooltip: { show: false } },
    ],
  })
})

/* ============ 图 5：Delta 暴露分布 ============ */
const deltaOpt = computed(() => {
  if (!filtered.value.length) return Object.assign({}, BASE_OPT)
  const spot = UNDERLYING_SPOTS[selUnderlying.value] || 0
  const sorted = filtered.value.slice().sort((a, b) => a.K - b.K)
  const uniqK = [...new Set(sorted.map(r => r.K))]
  const cDelta = uniqK.map(k => {
    return filtered.value.filter(r => r.K === k && r.cp === 'C').reduce((s, r) => s + r.delta * r.oi, 0)
  })
  const pDelta = uniqK.map(k => {
    return filtered.value.filter(r => r.K === k && r.cp === 'P').reduce((s, r) => s + r.delta * r.oi, 0)
  })
  return Object.assign({}, BASE_OPT, {
    grid: { left: 56, right: 20, top: 30, bottom: 44 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 2, data: ['Call Delta', 'Put Delta'], textStyle: { fontSize: 10 } },
    xAxis: Object.assign({ type: 'category', data: uniqK, axisLabel: { color: '#5f6672', fontSize: 9, rotate: 30 }, name: '行权价' }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'Delta × OI', axisLabel: { color: '#8f95a1', fontSize: 10 } }, AXIS),
    series: [
      { name: 'Call Delta', type: 'bar', stack: 'delta', data: cDelta, itemStyle: { color: C_UP, opacity: 0.7 }, barMaxWidth: 16 },
      { name: 'Put Delta', type: 'bar', stack: 'delta', data: pDelta, itemStyle: { color: C_DN, opacity: 0.7 }, barMaxWidth: 16 },
    ],
  })
})

/* ============ 图 6：IV 水位对比 ============ */
const ivLevelOpt = computed(() => {
  if (!rows.value.length) return Object.assign({}, BASE_OPT)
  const cats = underlyings.value
  const ivAll = cats.map(u => rows.value.filter(r => r.underlying === u).map(r => r.iv).filter(v => v > 0))
  const q25 = ivAll.map(a => quant(a, 0.25))
  const q50 = ivAll.map(a => quant(a, 0.50))
  const q75 = ivAll.map(a => quant(a, 0.75))
  const cur = ivAll.map(a => a.length ? mean(a) : 0)
  const w = 0.45
  const stackH = (base, top) => top.map((v, i) => +(v - (base[i] || 0)).toFixed(2))
  return Object.assign({}, BASE_OPT, {
    grid: { left: 50, right: 20, top: 30, bottom: 36 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 2, data: ['75%-Max', '50%-75%', '25%-50%', 'Min-25%', '当前均值'], textStyle: { fontSize: 10 } },
    xAxis: Object.assign({ type: 'category', data: cats, axisLabel: { color: '#5f6672', fontSize: 10 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true, axisLabel: { color: '#8f95a1', fontSize: 10 } }, AXIS),
    series: [
      { name: 'Min-25%', type: 'bar', stack: 'ivl', barWidth: w, data: stackH(ivAll.map(a => quant(a, 0)), ivAll.map(a => quant(a, 0.25))), itemStyle: { color: '#ebf5fb' } },
      { name: '25%-50%', type: 'bar', stack: 'ivl', barWidth: w, data: stackH(q25, q50), itemStyle: { color: '#d6eaf8' } },
      { name: '50%-75%', type: 'bar', stack: 'ivl', barWidth: w, data: stackH(q50, q75), itemStyle: { color: '#fadbd8' } },
      { name: '75%-Max', type: 'bar', stack: 'ivl', barWidth: w, data: stackH(q75, ivAll.map(a => quant(a, 1))), itemStyle: { color: '#fdedec' } },
      { name: '当前均值', type: 'scatter', symbolSize: 12, data: cur.map((v, i) => [i, v]), itemStyle: { color: '#2c3e50', borderColor: '#fff', borderWidth: 1.5 }, label: { show: true, position: 'top', formatter: p => cur[p.dataIndex].toFixed(1), fontSize: 9, fontWeight: 'bold', color: '#e02020' } },
    ],
  })
})

/* ============ 图 7：跨标的 IV 偏斜对比（近月） ============ */
const crossSkewOpt = computed(() => {
  if (!rows.value.length) return Object.assign({}, BASE_OPT)
  const series = []
  underlyings.value.forEach((u, i) => {
    const exps = sortExpiries([...new Set(rows.value.filter(r => r.underlying === u).map(r => r.expiry))])
    if (!exps.length) return
    const nearExp = exps[0]
    const spot = UNDERLYING_SPOTS[u] || 0
    const calls = rows.value.filter(r => r.underlying === u && r.expiry === nearExp && r.cp === 'C').sort((a, b) => a.K - b.K)
    const puts = rows.value.filter(r => r.underlying === u && r.expiry === nearExp && r.cp === 'P').sort((a, b) => a.K - b.K)
    // 合并 C+P 按 moneyness 取均值 IV
    const byK = {}
    for (const r of [...calls, ...puts]) {
      const m = +(r.K / spot * 100 - 100).toFixed(1)
      if (!byK[m]) byK[m] = []
      byK[m].push(r.iv)
    }
    const data = Object.entries(byK).map(([m, ivs]) => [m, mean(ivs)]).sort((a, b) => a[0] - b[0])
    if (data.length) {
      series.push({ name: u + ' ' + nearExp, type: 'line', data, symbol: 'circle', symbolSize: 4, lineStyle: { width: 2, color: PALETTE[i] }, itemStyle: { color: PALETTE[i] } })
    }
  })
  return Object.assign({}, BASE_OPT, {
    tooltip: { trigger: 'axis' },
    legend: { type: 'scroll', top: 2, textStyle: { fontSize: 10 } },
    xAxis: Object.assign({ type: 'category', name: 'OTM%', axisLabel: { color: '#5f6672', fontSize: 10 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true, axisLabel: { color: '#8f95a1', fontSize: 10 } }, AXIS),
    series,
  })
})

/* ============ 图 8：25-Delta 风险反转 ============ */
const rrOpt = computed(() => {
  if (!rows.value.length) return Object.assign({}, BASE_OPT)
  const cats = underlyings.value
  const exps = expiries.value.slice(0, 3) // 取前3个到期月
  const series = []
  exps.forEach((exp, i) => {
    const data = cats.map(u => {
      const spot = UNDERLYING_SPOTS[u] || 0
      const calls = rows.value.filter(r => r.underlying === u && r.expiry === exp && r.cp === 'C').sort((a, b) => Math.abs(a.delta - 0.25) - Math.abs(b.delta - 0.25))
      const puts = rows.value.filter(r => r.underlying === u && r.expiry === exp && r.cp === 'P').sort((a, b) => Math.abs(a.delta + 0.25) - Math.abs(b.delta + 0.25))
      const c25 = calls[0] ? calls[0].iv : null
      const p25 = puts[0] ? puts[0].iv : null
      return c25 != null && p25 != null ? +(c25 - p25).toFixed(2) : null
    })
    if (data.some(v => v != null)) {
      series.push({ name: exp, type: 'bar', data, itemStyle: { color: PALETTE[i], opacity: 0.75, borderRadius: [3, 3, 0, 0] }, barWidth: 20, label: { show: true, position: 'top', fontSize: 9, color: PALETTE[i] } })
    }
  })
  return Object.assign({}, BASE_OPT, {
    grid: { left: 50, right: 20, top: 30, bottom: 36 },
    tooltip: { trigger: 'axis' },
    legend: { top: 2, textStyle: { fontSize: 10 } },
    xAxis: Object.assign({ type: 'category', data: cats, axisLabel: { color: '#5f6672', fontSize: 10 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'C25 IV − P25 IV', axisLabel: { color: '#8f95a1', fontSize: 10 } }, AXIS),
    series,
  })
})

/* ============ 图 9：Gamma 敞口 GEX ============ */
// 从相邻行权价的 Delta 差估算 Gamma（dDelta/dK * OI * S^2 * 0.01 / 10000万）
// GEX = gamma * OI * S * S * 0.01，单位为"亿元/1%"
const gexOpt = computed(() => {
  if (!filtered.value.length) return Object.assign({}, BASE_OPT)
  const spot = UNDERLYING_SPOTS[selUnderlying.value] || 0
  const sorted = filtered.value.slice().sort((a, b) => a.K - b.K)
  const uniqK = [...new Set(sorted.map(r => r.K))]

  // 按行权价聚合 C/P 的 delta 和 OI
  const byK = {}
  for (const r of sorted) {
    if (!byK[r.K]) byK[r.K] = { cDelta: 0, cOi: 0, pDelta: 0, pOi: 0 }
    if (r.cp === 'C') { byK[r.K].cDelta += Math.abs(r.delta) * r.oi; byK[r.K].cOi += r.oi }
    else { byK[r.K].pDelta += Math.abs(r.delta) * r.oi; byK[r.K].pOi += r.oi }
  }

  // 估算 Gamma：相邻行权价间 Delta 变化 / K 间距
  const ks = uniqK.slice().sort((a, b) => a - b)
  const cGex = [], pGex = [], netGexCum = []
  let cum = 0

  for (let i = 0; i < ks.length; i++) {
    const K = ks[i]
    const d = byK[K] || { cDelta: 0, cOi: 0, pDelta: 0, pOi: 0 }
    // Gamma 估算：相邻行权价的 delta 差
    let cGamma = 0, pGamma = 0
    if (i < ks.length - 1) {
      const next = byK[ks[i + 1]] || { cDelta: 0, cOi: 0, pDelta: 0, pOi: 0 }
      const dK = ks[i + 1] - K
      if (dK > 0) {
        cGamma = (d.cOi > 0 ? Math.abs((next.cDelta / (next.cOi || 1)) - (d.cDelta / d.cOi)) / dK : 0)
        pGamma = (d.pOi > 0 ? Math.abs((next.pDelta / (next.pOi || 1)) - (d.pDelta / d.pOi)) / dK : 0)
      }
    } else if (i > 0) {
      // 最后一个用前一个的 gamma
      cGamma = cGex[i - 1] != null ? parseFloat(cGex[i - 1]) / (d.cOi || 1) / spot / spot / 0.01 : 0
      pGamma = pGex[i - 1] != null ? parseFloat(pGex[i - 1]) / (d.pOi || 1) / spot / spot / 0.01 : 0
    }
    const gC = d.cOi > 0 ? cGamma * d.cOi * spot * spot * 0.01 / 1e8 : 0
    const gP = d.pOi > 0 ? pGamma * d.pOi * spot * spot * 0.01 / 1e8 : 0
    cGex.push(+gC.toFixed(3))
    pGex.push(+gP.toFixed(3))
    cum += gC - gP
    netGexCum.push(+cum.toFixed(3))
  }

  return Object.assign({}, BASE_OPT, {
    grid: { left: 56, right: 60, top: 34, bottom: 44 },
    legend: { top: 2, data: ['认购 Gamma', '认沽 Gamma', '累计净 Gamma'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: ks, name: '行权价', axisLabel: { interval: 1, fontSize: 10, rotate: 35 } }, AXIS),
    yAxis: [Object.assign({ type: 'value', name: 'Gamma 敞口（亿元/1%）' }, AXIS), Object.assign({ type: 'value', name: '累计（亿）', position: 'right', splitLine: { show: false } }, AXIS)],
    series: [
      { name: '认购 Gamma', type: 'bar', data: cGex, itemStyle: { color: C_UP, opacity: 0.75 }, barWidth: '40%' },
      { name: '认沽 Gamma', type: 'bar', data: pGex.map(v => -v), itemStyle: { color: C_DN, opacity: 0.75 }, barGap: '15%', barWidth: '40%' },
      { name: '累计净 Gamma', type: 'line', yAxisIndex: 1, data: netGexCum, symbol: 'none', lineStyle: { width: 2, color: '#7a5af8' }, markLine: { silent: true, symbol: 'none', data: [{ yAxis: 0, lineStyle: { color: '#c8cdd6', type: 'dashed' } }] } },
    ],
  })
})

/* ============ 核心观点 ============ */
const viewpoint = computed(() => {
  if (!rows.value.length) return '数据加载中…'
  const parts = []

  // P/C 比率分析
  for (const u of underlyings.value) {
    const calls = rows.value.filter(r => r.underlying === u && r.cp === 'C')
    const puts = rows.value.filter(r => r.underlying === u && r.cp === 'P')
    const coi = calls.reduce((s, r) => s + r.oi, 0)
    const poi = puts.reduce((s, r) => s + r.oi, 0)
    const pc = coi ? (poi / coi).toFixed(2) : '0'
    const cv = calls.reduce((s, r) => s + r.vol, 0)
    const pv = puts.reduce((s, r) => s + r.vol, 0)
    const pcv = cv ? (pv / cv).toFixed(2) : '0'
    const signal = parseFloat(pc) > 1.2 ? '偏空（Put 持仓偏重）' : parseFloat(pc) < 0.8 ? '偏多（Call 持仓偏重）' : '中性'
    parts.push(`${u} OI P/C=${pc}，Vol P/C=${pcv}，${signal}`)
  }

  // IV 水位
  for (const u of underlyings.value) {
    const ivs = rows.value.filter(r => r.underlying === u).map(r => r.iv).filter(v => v > 0)
    if (!ivs.length) continue
    const cur = mean(ivs)
    const q25 = quant(ivs, 0.25), q75 = quant(ivs, 0.75)
    const level = cur > q75 ? '偏高' : cur < q25 ? '偏低' : '中等'
    parts.push(`${u} 整体 IV 均值 ${cur.toFixed(1)}%（${level}，25%分位=${q25.toFixed(1)}，75%分位=${q75.toFixed(1)}）`)
  }

  // 风险反转
  for (const u of underlyings.value) {
    const exps = sortExpiries([...new Set(rows.value.filter(r => r.underlying === u).map(r => r.expiry))])
    if (!exps.length) continue
    const nearExp = exps[0]
    const spot = UNDERLYING_SPOTS[u] || 0
    const calls = rows.value.filter(r => r.underlying === u && r.expiry === nearExp && r.cp === 'C').sort((a, b) => Math.abs(a.delta - 0.25) - Math.abs(b.delta - 0.25))
    const puts = rows.value.filter(r => r.underlying === u && r.expiry === nearExp && r.cp === 'P').sort((a, b) => Math.abs(a.delta + 0.25) - Math.abs(b.delta + 0.25))
    if (calls[0] && puts[0]) {
      const rr = calls[0].iv - puts[0].iv
      const rrLabel = rr > 2 ? 'Call IV 显著高于 Put（市场偏多，追涨意愿强）' : rr < -2 ? 'Put IV 显著高于 Call（市场偏空，对冲需求强）' : 'Call/Put IV 接近（市场方向中性）'
      parts.push(`${u} 近月(${nearExp}) 25-Delta 风险反转=${rr.toFixed(2)}，${rrLabel}`)
    }
  }

  // GEX 分析（当前选中标的和到期月）
  const gexFiltered = rows.value.filter(r => r.underlying === selUnderlying.value && r.expiry === selExpiry.value)
  if (gexFiltered.length) {
    const gexSpot = UNDERLYING_SPOTS[selUnderlying.value] || 0
    const sorted = gexFiltered.slice().sort((a, b) => a.K - b.K)
    const uniqK = [...new Set(sorted.map(r => r.K))].sort((a, b) => a - b)
    const byK = {}
    for (const r of sorted) {
      if (!byK[r.K]) byK[r.K] = { cDelta: 0, cOi: 0, pDelta: 0, pOi: 0 }
      if (r.cp === 'C') { byK[r.K].cDelta += Math.abs(r.delta) * r.oi; byK[r.K].cOi += r.oi }
      else { byK[r.K].pDelta += Math.abs(r.delta) * r.oi; byK[r.K].pOi += r.oi }
    }
    let netGex = 0, flip = null, prev = null
    for (let i = 0; i < uniqK.length; i++) {
      const K = uniqK[i]
      const d = byK[K] || { cDelta: 0, cOi: 0, pDelta: 0, pOi: 0 }
      let cGamma = 0, pGamma = 0
      if (i < uniqK.length - 1) {
        const next = byK[uniqK[i + 1]] || { cDelta: 0, cOi: 0, pDelta: 0, pOi: 0 }
        const dK = uniqK[i + 1] - K
        if (dK > 0) {
          cGamma = (d.cOi > 0 ? Math.abs((next.cDelta / (next.cOi || 1)) - (d.cDelta / d.cOi)) / dK : 0)
          pGamma = (d.pOi > 0 ? Math.abs((next.pDelta / (next.pOi || 1)) - (d.pDelta / d.pOi)) / dK : 0)
        }
      }
      const g = (d.cOi > 0 ? cGamma * d.cOi : 0) * gexSpot * gexSpot * 0.01 / 1e8 - (d.pOi > 0 ? pGamma * d.pOi : 0) * gexSpot * gexSpot * 0.01 / 1e8
      netGex += g
      if (prev != null && prev < 0 && netGex >= 0 && !flip) flip = K
      prev = netGex
    }
    const gexLabel = netGex > 0.1 ? '净多 Gamma（做市商对冲将抑制波动，行情易窄幅震荡）' : netGex < -0.1 ? '净空 Gamma（做市商对冲将放大波动，行情易大幅波动）' : 'Gamma 中性'
    const flipInfo = flip != null ? `，Gamma 翻转点 ≈ ${flip}` : ''
    parts.push(`${selUnderlying.value} ${selExpiry.value} 累计净 GEX ≈ ${netGex.toFixed(2)}亿（${gexLabel}${flipInfo}）`)
  }

  parts.push('以上基于当前快照数据，期权交易需结合动态 Greeks 与市场流动性综合判断，不构成投资建议。')
  return parts.join('；') + '。'
})
</script>

<style scoped>
.chart { width: 100%; height: 260px; }
.chart-tall { width: 100%; height: 360px; }
</style>
