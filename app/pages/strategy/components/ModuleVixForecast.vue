<template>
  <div class="mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold">
      <span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>隐含波动率 IV 综合分析与预测
    </div>
    <div class="mb-3 pl-[11px] text-[11.5px] text-[#8f95a1]">基于 public/vixs.csv 全样本（{{ dataRange }}），覆盖 6 个标的：历史走势、波动率锥、季节性、未来一年预测、当前分位、相关性矩阵</div>

    <div v-if="loading" class="py-8 text-center text-[12px] text-[#8f95a1]">加载隐波数据中…</div>
    <div v-else-if="err" class="py-8 text-center text-[12px] text-[#e02020]">{{ err }}</div>
    <div v-else-if="!infos.length" class="py-8 text-center text-[12px] text-[#8f95a1]">无有效隐波历史数据</div>

    <template v-else>
      <!-- 1. 历史走势 -->
      <section>
        <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 1 · 各标的隐含波动率历史走势</div>
        <VChart :option="historyOpt" autoresize class="chart-grid" />
      </section>

      <!-- 2. 波动率锥 -->
      <section class="mt-3">
        <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 2 · 波动率锥（IV 分位分布与当前水位）</div>
        <VChart :option="coneOpt" autoresize class="chart" />
      </section>

      <!-- 3. 季节性 -->
      <section class="mt-3">
        <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 3 · 各标的隐波季节性规律</div>
        <VChart :option="seasonOpt" autoresize class="chart" />
      </section>

      <!-- 4. 未来一年预测 -->
      <section class="mt-3">
        <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 4 · 未来一年隐含波动率走势预测（均值回归 + 季节性模型）</div>
        <VChart :option="forecastOpt" autoresize class="chart-grid" />
      </section>

      <!-- 5. 当前分位排名 -->
      <section class="mt-3">
        <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 5 · 各标的隐波当前历史分位</div>
        <VChart :option="rankOpt" autoresize class="chart" />
      </section>

      <!-- 6. 相关性矩阵 -->
      <section class="mt-3">
        <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 6 · 各标的隐波相关性矩阵</div>
        <VChart :option="corrOpt" autoresize class="chart-square" />
      </section>

      <!-- 核心结论 -->
      <div class="mt-3 rounded-[8px] border border-[#eee6fb] bg-[#faf7ff] p-3 text-[12px] leading-[1.7] text-[#4a4458]">
        <b class="text-[#7a5af8]">核心结论：</b>{{ conclusion }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_DN, C_WARN } from './lib'

/* ============ 常量 ============ */
// 与 public/vixs.csv 中的 code 及 iv_analysis_report.md 的 9 个标的对应
const DISPLAY = { '50': '上证50', '300': '沪深300', '1000': '中证1000', '159901': '深100ETF', '159915': '创业板ETF', '510050': '50ETF', '510300': '300ETF', '510500': '500ETF', '588000': '科创50' }
const ORDER = ['50', '300', '1000', '159901', '159915', '510050', '510300', '510500', '588000']
const MONTH_LABEL = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const QUARTER_LABEL = ['Q1', 'Q2', 'Q3', 'Q4']
const H = 252 // 未来一年交易日
const PALETTE = ['#7a5af8', '#2f6feb', '#19b36b', '#e6a23c', '#eb4d6a', '#13c2c2', '#8b5cf6', '#f59e0b', '#0ea5e9']

/* ============ 数据加载 ============ */
const loading = ref(true)
const err = ref('')
const allSeries = ref([])

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length)
  if (!lines.length) return []
  const header = lines[0].split(',').map(s => s.trim())
  const ci = { code: header.indexOf('code'), time: header.indexOf('time'), close: header.indexOf('close') }
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(',')
    const code = (c[ci.code] || '').trim()
    const t = (c[ci.time] || '').trim()
    const v = parseFloat(c[ci.close])
    if (!code || !t || isNaN(v) || v <= 0) continue
    const dt = new Date(t.replace(/\//g, '-'))
    if (isNaN(dt.getTime())) continue
    out.push({ date: dt, v, code, month: dt.getMonth(), q: Math.floor(dt.getMonth() / 3) })
  }
  return out.sort((a, b) => a.date - b.date)
}

const dataRange = computed(() => {
  if (!allSeries.value.length) return ''
  const d0 = allSeries.value[0].date, d1 = allSeries.value[allSeries.value.length - 1].date
  return `${fmtDate(d0)} ~ ${fmtDate(d1)}`
})
function fmtDate(d) { return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}` }

/* ============ 统计工具 ============ */
function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN }
function stdev(a) { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length) }
function pct(a, v) { return a.filter(x => x <= v).length / a.length }
function quant(a, q) { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.min(lo + 1, s.length - 1); return s[lo] + (s[hi] - s[lo]) * (pos - lo) }
function corr(a, b) { if (a.length < 3) return 0; const ma = mean(a), mb = mean(b); let n = 0, da = 0, db = 0; for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2 } return da * db === 0 ? 0 : n / Math.sqrt(da * db) }

/* ============ 标的分析 ============ */
const infos = computed(() => {
  const by = {}
  for (const p of allSeries.value) (by[p.code] = by[p.code] || []).push(p)
  return ORDER.filter(code => by[code] && by[code].length >= 30).map(code => analyze(code, by[code]))
})

function analyze(code, pts) {
  pts = pts.slice().sort((a, b) => a.date - b.date)
  const values = pts.map(p => p.v)
  const n = values.length
  const cur = values[n - 1]
  const sorted = values.slice().sort((a, b) => a - b)
  const mu = mean(values)
  const med = quant(sorted, 0.5)
  const std = stdev(values)
  const z = std === 0 ? 0 : (cur - mu) / std
  const p = pct(sorted, cur)

  // AR(1) 系数与半衰期
  const dev = values.slice(0, -1).map(v => v - mu)
  const dV = values.slice(1).map((v, i) => v - values[i])
  const md = mean(dev), mdx = mean(dV)
  let num = 0, den = 0
  for (let i = 0; i < dev.length; i++) { num += (dev[i] - md) * (dV[i] - mdx); den += (dev[i] - md) ** 2 }
  const phi = den === 0 ? 0.95 : Math.max(0, Math.min(0.999, 1 + num / den)) // X_t - μ = φ (X_{t-1} - μ) + ε => dX = (φ-1)(X-μ)
  const half = phi < 1 ? Math.log(2) / -Math.log(phi) : NaN
  const speed = -Math.log(phi) // κ

  // 季节因子：各月均值相对总体均值的比例（用于预测调整）
  const yrMax = pts[pts.length - 1].date.getFullYear()
  const yrMin = yrMax - 4
  const monthMean = []
  for (let mo = 0; mo < 12; mo++) {
    const vs = pts.filter(p => p.month === mo && p.date.getFullYear() >= yrMin).map(p => p.v)
    monthMean.push(vs.length ? mean(vs) : mu)
  }
  const qMean = []
  for (let q = 0; q < 4; q++) {
    const vs = pts.filter(p => p.q === q && p.date.getFullYear() >= yrMin).map(p => p.v)
    qMean.push(vs.length ? mean(vs) : mu)
  }
  const seasFactor = monthMean.map(m => m / mu)

  // 预测：AR(1) 均值回复 + 季节性因子（解析解）
  const fcPath = [], fcLo = [], fcHi = []
  const lastMo = pts[pts.length - 1].month
  const resid = dV.map((dv, i) => dv - mdx - (phi - 1) * dev[i])
  const residStd = stdev(resid)
  for (let t = 1; t <= H; t++) {
    const mo = (lastMo + t) % 12
    // AR(1) 解析均值回复：mu + phi^t * (cur - mu)
    const revert = mu + Math.pow(phi, t) * (cur - mu)
    const adjusted = revert * (0.7 + 0.3 * seasFactor[mo])
    fcPath.push(+adjusted.toFixed(2))
    // 95% 预测区间：随时间 sqrt(t) 放大
    const noise = 1.96 * residStd * Math.sqrt(Math.min(t / 60, 1) + 0.05)
    fcLo.push(+Math.max(3, adjusted - noise).toFixed(2))
    fcHi.push(+(adjusted + noise).toFixed(2))
  }
  const f1 = fcPath[21 - 1] ?? fcPath[0]
  const f3 = fcPath[63 - 1] ?? fcPath[fcPath.length - 1]
  const f6 = fcPath[126 - 1] ?? fcPath[fcPath.length - 1]
  const f12 = fcPath[fcPath.length - 1]

  return { code, name: DISPLAY[code], values, pts, cur, mu, med, std, z, p, phi, half, speed,
    monthMean: monthMean.map(v => +v.toFixed(1)), qMean: qMean.map(v => +v.toFixed(1)),
    fcPath, fcLo, fcHi, f1, f3, f6, f12, residStd }
}

/* ============ 图 1：历史走势（3×3 网格） ============ */
const historyOpt = computed(() => {
  if (!infos.value.length) return Object.assign({}, BASE_OPT)
  const cols = 3
  const grids = [], xAxes = [], yAxes = [], series = [], titles = []
  infos.value.forEach((info, i) => {
    const row = Math.floor(i / cols), col = i % cols
    const left = 4 + col * 33.5, top = 6 + row * 31, width = 30, height = 27
    grids.push({ left: left + '%', top: top + '%', width: width + '%', height: height + '%' })
    xAxes.push({ gridIndex: i, type: 'category', data: info.pts.map(p => fmtDate(p.date)), show: false })
    yAxes.push({ gridIndex: i, type: 'value', name: 'IV %', nameTextStyle: { fontSize: 9, color: '#8f95a1' }, axisLabel: { fontSize: 9, color: '#8f95a1' }, splitLine: { lineStyle: { color: '#f0f2f5' } }, scale: true })
    series.push({ name: 'IV', type: 'line', xAxisIndex: i, yAxisIndex: i, data: info.values, symbol: 'none', lineStyle: { width: 1.2, color: PALETTE[i] }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: PALETTE[i] + '33' }, { offset: 1, color: PALETTE[i] + '05' }] } },
      markLine: { silent: true, symbol: 'none', data: [{ yAxis: +info.mu.toFixed(1), lineStyle: { type: 'dashed', color: '#9ca3af', width: 1 }, label: { formatter: '均值 ' + info.mu.toFixed(1), fontSize: 8, color: '#6b7280', position: 'end' } }, { yAxis: +info.med.toFixed(1), lineStyle: { type: 'dotted', color: '#6b7280', width: 1 }, label: { formatter: '中位 ' + info.med.toFixed(1), fontSize: 8, color: '#6b7280', position: 'start' } }] }
    })
    titles.push({ text: info.name + ' IV', left: (left + 1) + '%', top: (top + 0.5) + '%', textStyle: { fontSize: 11, fontWeight: 'bold', color: '#374151' } })
  })
  return Object.assign({}, BASE_OPT, { grid: grids, title: titles, xAxis: xAxes, yAxis: yAxes, series, tooltip: { trigger: 'axis', textStyle: { fontSize: 11 } }, legend: { show: false } })
})

/* ============ 图 2：波动率锥 ============ */
const coneOpt = computed(() => {
  if (!infos.value.length) return Object.assign({}, BASE_OPT)
  const cats = infos.value.map(i => i.name)
  const q5 = infos.value.map(i => quant(i.values, 0.05))
  const q25 = infos.value.map(i => quant(i.values, 0.25))
  const q50 = infos.value.map(i => quant(i.values, 0.50))
  const q75 = infos.value.map(i => quant(i.values, 0.75))
  const q95 = infos.value.map(i => quant(i.values, 0.95))
  const cur = infos.value.map(i => i.cur)
  const q90 = infos.value.map(i => +i.p.toFixed(2))

  const stack = (base, top) => top.map((v, i) => +(v - (base[i] || 0)).toFixed(2))
  return Object.assign({}, BASE_OPT, {
    grid: { left: 58, right: 68, top: 34, bottom: 40 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['5%-25%', '25%-50%', '50%-75%', '75%-95%', '当前值'], top: 4 },
    xAxis: Object.assign({ type: 'category', data: cats, axisLabel: { color: '#5f6672', fontSize: 11, rotate: 20 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true }, AXIS),
    series: [
      { name: '5%-25%', type: 'bar', stack: 'cone', data: q25.map((v, i) => +(v - q5[i]).toFixed(2)), itemStyle: { color: '#dbeafe' }, barWidth: 34 },
      { name: '25%-50%', type: 'bar', stack: 'cone', data: stack(q25, q50), itemStyle: { color: '#93c5fd' } },
      { name: '50%-75%', type: 'bar', stack: 'cone', data: stack(q50, q75), itemStyle: { color: '#fca5a5' } },
      { name: '75%-95%', type: 'bar', stack: 'cone', data: stack(q75, q95), itemStyle: { color: '#fecaca' } },
      { name: '当前值', type: 'scatter', data: cur, symbolSize: 10, itemStyle: { color: C_UP },
        label: { show: true, position: 'top', formatter: p => `${p.value}\n(${Math.round(q90[p.dataIndex] * 100)}%)`, fontSize: 9, color: C_UP, lineHeight: 12 } },
    ],
  })
})

/* ============ 图 3：季节性（月度折线 + 季度柱状） ============ */
const seasonOpt = computed(() => {
  if (!infos.value.length) return Object.assign({}, BASE_OPT)
  return Object.assign({}, BASE_OPT, {
    grid: [{ left: 56, right: 46, top: 40, bottom: 36, height: '42%' }, { left: 56, right: 46, top: '56%', bottom: 36, height: '36%' }],
    legend: { type: 'scroll', top: 4, data: infos.value.map(i => i.name) },
    tooltip: { trigger: 'axis' },
    xAxis: [{ gridIndex: 0, type: 'category', data: MONTH_LABEL, axisLabel: { color: '#5f6672' } }, { gridIndex: 1, type: 'category', data: QUARTER_LABEL, axisLabel: { color: '#5f6672' } }],
    yAxis: [{ gridIndex: 0, type: 'value', name: 'IV %', nameTextStyle: { color: '#8f95a1', fontSize: 11 }, axisLabel: { color: '#8f95a1', fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f2f5' } }, scale: true },
      { gridIndex: 1, type: 'value', name: 'IV %', nameTextStyle: { color: '#8f95a1', fontSize: 11 }, axisLabel: { color: '#8f95a1', fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f2f5' } }, scale: true }],
    series: [
      ...infos.value.map((info, i) => ({ name: info.name, type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: info.monthMean, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: PALETTE[i] }, itemStyle: { color: PALETTE[i] } })),
      ...infos.value.map((info, i) => ({ name: info.name, type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: info.qMean, itemStyle: { color: PALETTE[i], opacity: 0.8 }, barMaxWidth: 14, barGap: '10%' })),
    ],
  })
})

/* ============ 图 4：未来一年预测（3×3 网格） ============ */
const forecastOpt = computed(() => {
  if (!infos.value.length) return Object.assign({}, BASE_OPT)
  const cols = 3
  const grids = [], xAxes = [], yAxes = [], series = [], titles = []
  infos.value.forEach((info, i) => {
    const row = Math.floor(i / cols), col = i % cols
    const left = 4 + col * 33.5, top = 6 + row * 31, width = 30, height = 27
    grids.push({ left: left + '%', top: top + '%', width: width + '%', height: height + '%' })

    const histDates = info.pts.map(p => fmtDate(p.date))
    const fcDates = Array.from({ length: H }, (_, t) => 'T+' + (t + 1))
    xAxes.push({ gridIndex: i, type: 'category', data: histDates.concat(fcDates), show: false })
    yAxes.push({ gridIndex: i, type: 'value', name: 'IV %', nameTextStyle: { fontSize: 9, color: '#8f95a1' }, axisLabel: { fontSize: 9, color: '#8f95a1' }, splitLine: { lineStyle: { color: '#f0f2f5' } }, scale: true })

    const histData = info.values.concat(new Array(H).fill(null))
    const fcData = new Array(info.values.length - 1).fill(null).concat([info.cur]).concat(info.fcPath)
    const loData = new Array(info.values.length).fill(null).concat(info.fcLo)
    const hiData = new Array(info.values.length).fill(null).concat(info.fcHi)

    series.push({ name: '历史IV', type: 'line', xAxisIndex: i, yAxisIndex: i, data: histData, symbol: 'none', lineStyle: { width: 1.2, color: PALETTE[i] }, showSymbol: false })
    series.push({ name: '预测路径', type: 'line', xAxisIndex: i, yAxisIndex: i, data: fcData, symbol: 'none', lineStyle: { width: 1.8, color: C_UP }, showSymbol: false,
      markLine: { silent: true, symbol: 'none', data: [{ xAxis: histDates.length - 1, lineStyle: { color: '#e5e7eb', width: 1, type: 'solid' } }] }
    })
    series.push({ name: '95%区间上沿', type: 'line', xAxisIndex: i, yAxisIndex: i, data: hiData, symbol: 'none', lineStyle: { opacity: 0 }, stack: 'fc' + i, areaStyle: { color: C_UP + '20' }, silent: true, tooltip: { show: false } })
    series.push({ name: '95%区间下沿', type: 'line', xAxisIndex: i, yAxisIndex: i, data: loData.map((v, idx) => v == null ? null : +(hiData[idx] - v).toFixed(2)), symbol: 'none', lineStyle: { opacity: 0 }, stack: 'fc' + i, areaStyle: { color: '#fff' }, silent: true, tooltip: { show: false } })

    titles.push({ text: `${info.name} IV（当前Z=${info.z.toFixed(1)}）`, left: (left + 1) + '%', top: (top + 0.5) + '%', textStyle: { fontSize: 11, fontWeight: 'bold', color: '#374151' } })
  })
  return Object.assign({}, BASE_OPT, { grid: grids, title: titles, xAxis: xAxes, yAxis: yAxes, series, tooltip: { trigger: 'axis', textStyle: { fontSize: 10 } }, legend: { show: false } })
})

/* ============ 图 5：当前分位排名 ============ */
const rankOpt = computed(() => {
  if (!infos.value.length) return Object.assign({}, BASE_OPT)
  const sorted = infos.value.slice().sort((a, b) => a.p - b.p)
  const cats = sorted.map(i => i.name)
  const vals = sorted.map(i => +(i.p * 100).toFixed(1))
  return Object.assign({}, BASE_OPT, {
    grid: { left: 78, right: 56, top: 24, bottom: 24 },
    tooltip: { trigger: 'axis', formatter: p => `${p[0].name}: ${p[0].value}%` },
    xAxis: Object.assign({ type: 'value', name: '分位 %', max: 100 }, AXIS),
    yAxis: Object.assign({ type: 'category', data: cats, axisLabel: { color: '#5f6672', fontSize: 11 }, inverse: true }, AXIS),
    series: [{
      type: 'bar', data: vals.map(v => ({ value: v, itemStyle: { color: v >= 75 ? C_UP : v <= 25 ? C_DN : C_WARN, borderRadius: [0, 3, 3, 0] } })),
      label: { show: true, position: 'right', formatter: '{c}%', fontSize: 11, color: '#374151' }, barWidth: 18,
      markLine: { silent: true, symbol: 'none', data: [{ xAxis: 25, lineStyle: { color: C_DN, type: 'dashed', width: 1 }, label: { formatter: '25%', fontSize: 9, color: C_DN } }, { xAxis: 75, lineStyle: { color: C_UP, type: 'dashed', width: 1 }, label: { formatter: '75%', fontSize: 9, color: C_UP } }] }
    }],
  })
})

/* ============ 图 6：相关性矩阵 ============ */
const corrMatrix = computed(() => {
  if (!infos.value.length) return []
  const byDate = {}
  for (const info of infos.value) for (const p of info.pts) (byDate[p.date.getTime()] = byDate[p.date.getTime()] || {})[info.code] = p.v
  const common = Object.keys(byDate).filter(t => infos.value.every(i => byDate[t][i.code] != null)).map(t => byDate[t])
  const m = infos.value.map((a, i) => infos.value.map((b, j) => {
    if (i === j) return 1
    const va = common.map(d => d[a.code]), vb = common.map(d => d[b.code])
    return +corr(va, vb).toFixed(2)
  }))
  return m
})
const corrOpt = computed(() => {
  if (!corrMatrix.value.length) return Object.assign({}, BASE_OPT)
  const cats = infos.value.map(i => i.name)
  const data = []
  corrMatrix.value.forEach((row, i) => row.forEach((v, j) => data.push([i, j, v])))
  return Object.assign({}, BASE_OPT, {
    grid: { left: 76, right: 76, top: 24, bottom: 56 },
    tooltip: { position: 'top', formatter: p => `${cats[p.data[0]]} × ${cats[p.data[1]]}<br/>相关系数: ${p.data[2]}` },
    xAxis: { type: 'category', data: cats, splitArea: { show: true }, axisLabel: { color: '#5f6672', fontSize: 11, rotate: 45 } },
    yAxis: { type: 'category', data: cats, splitArea: { show: true }, axisLabel: { color: '#5f6672', fontSize: 11 } },
    visualMap: { min: 0.5, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: 6, inRange: { color: ['#dcfce7', '#fde047', '#f87171', '#b91c1c'] }, textStyle: { color: '#5f6672', fontSize: 10 } },
    series: [{ name: '相关系数', type: 'heatmap', data, label: { show: true, formatter: p => p.data[2], fontSize: 10, color: '#1f2937' }, emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,.15)' } } }],
  })
})

/* ============ 核心结论 ============ */
const conclusion = computed(() => {
  if (!infos.value.length) return ''
  const high = infos.value.filter(i => i.p >= 0.75).sort((a, b) => b.z - a.z)
  const low = infos.value.filter(i => i.p <= 0.25).sort((a, b) => a.z - b.z)
  const mid = infos.value.filter(i => i.p > 0.25 && i.p < 0.75)
  const parts = []
  if (high.length) parts.push(`🔴 高估区（做空波动率）：${high.map(i => `${i.name} 分位${(i.p * 100).toFixed(0)}% Z=${i.z.toFixed(1)}`).join('、')}，未来一年大概率震荡下行回归均值`)
  if (low.length) parts.push(`🟢 低估区（做多波动率）：${low.map(i => `${i.name} 分位${(i.p * 100).toFixed(0)}% Z=${i.z.toFixed(1)}`).join('、')}，未来一年存在上行回归空间`)
  if (mid.length) parts.push(`🟡 中性区（区间震荡）：${mid.map(i => i.name).join('、')}，预计在均值附近震荡`)
  const avgCorr = []
  for (let i = 0; i < corrMatrix.value.length; i++) for (let j = i + 1; j < corrMatrix.value.length; j++) avgCorr.push(corrMatrix.value[i][j])
  const avg = avgCorr.length ? mean(avgCorr) : 0
  parts.push(`各标的 IV 平均相关性 ${avg.toFixed(2)}，系统性风险事件会同时推高整体隐波；均值回归是核心驱动力，当前偏离越远回归力度越强。以上仅供参考，不构成投资建议。`)
  return parts.join('；') + '。'
})

onMounted(async () => {
  try {
    const text = await $fetch('/vixs.csv', { responseType: 'text' })
    allSeries.value = parseCsv(text)
    if (!allSeries.value.length) err.value = 'vixs.csv 无有效隐波数据'
  } catch (e) {
    err.value = '读取 vixs.csv 失败：' + (e && e.message ? e.message : e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.chart { width: 100%; height: 360px; }
.chart-grid { width: 100%; height: 780px; }
.chart-square { width: 100%; height: 560px; }
</style>
