<template>
  <div class="mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold">
      <span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>隐含波动率 IV 综合分析与预测
    </div>
    <div class="mb-3 pl-[11px] text-[11.5px] text-[#8f95a1]">基于 public/vixs.csv 全样本（{{ dataRange }}），覆盖 9 个标的：历史走势、波动率锥、季节性、未来一年预测、当前分位、相关性矩阵（算法对齐 iv_analysis_report.py）</div>

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
        <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 3 · 各标的隐波季节性规律（代表标的：50ETF/300ETF/500ETF/科创50/创业板ETF）</div>
        <VChart :option="seasonOpt" autoresize class="chart" />
      </section>

      <!-- 4. 未来一年预测 -->
      <section class="mt-3">
        <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">图 4 · 未来一年隐含波动率走势预测（均值回归 + 季节性模型，覆盖 vixs 全部标的）</div>
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
import { OPTIONS_MAP } from '~/data'

/* ============ 常量（与 py 脚本保持一致） ============ */
const DISPLAY = { '50': '上证50 IV', '300': '沪深300 IV', '1000': '中证1000 IV', '159901': '深100ETF IV', '159915': '创业板ETF IV', '510050': '50ETF IV', '510300': '300ETF IV', '510500': '500ETF IV', '588000': '科创50 IV' }
const OPTIONS_MAP_ORDER = OPTIONS_MAP.map(o => o.code)
const SEASONAL_CODES = ['510050', '510300', '510500', '588000', '159915'] // 图3季节性代表标的
const MONTH_LABEL = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const QUARTER_LABEL = ['Q1', 'Q2', 'Q3', 'Q4']
const H = 250 // 未来一年交易日（py: periods=250）
const PALETTE = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#e91e63']

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
  const codes = Object.keys(by).filter(c => by[c].length >= 30)
  const orderIdx = code => { const i = OPTIONS_MAP_ORDER.indexOf(code); return i >= 0 ? i : 9999 }
  codes.sort((a, b) => orderIdx(a) - orderIdx(b))
  return codes.map(code => analyze(code, by[code]))
})

function analyze(code, pts) {
  pts = pts.slice().sort((a, b) => a.date - b.date)
  const values = pts.map(p => p.v)
  const n = values.length
  const cur = values[n - 1]
  const cmin = values.reduce((m, v) => Math.min(m, v), Infinity)
  const sorted = values.slice().sort((a, b) => a - b)
  const mu = mean(values)
  const med = quant(sorted, 0.5)
  const std = stdev(values)
  const z = std === 0 ? 0 : (cur - mu) / std
  const p = pct(sorted, cur)

  // AR(1) 系数 φ：deviation 的滞后一阶自相关（py: corrcoef(dev[:-1], dev[1:])）
  const dev = values.map(v => v - mu)
  let phi = 0
  const d0 = dev.slice(0, -1), d1 = dev.slice(1)
  const md0 = mean(d0), md1 = mean(d1)
  let num = 0, den0 = 0, den1 = 0
  for (let i = 0; i < d0.length; i++) { num += (d0[i] - md0) * (d1[i] - md1); den0 += (d0[i] - md0) ** 2; den1 += (d1[i] - md1) ** 2 }
  phi = (den0 * den1) === 0 ? 0.95 : num / Math.sqrt(den0 * den1)
  if (!(phi > 0 && phi < 1)) phi = 0.95 // py 默认
  const half = -Math.log(2) / Math.log(phi)

  // 季节因子：各月均值 / 总体均值（py: monthly_mean / mean_iv）
  const monthMean = []
  for (let mo = 0; mo < 12; mo++) {
    const vs = pts.filter(p => p.month === mo).map(p => p.v)
    monthMean.push(vs.length ? mean(vs) : mu)
  }
  const qMean = []
  for (let q = 0; q < 4; q++) {
    const vs = pts.filter(p => p.q === q).map(p => p.v)
    qMean.push(vs.length ? mean(vs) : mu)
  }
  const seasFactor = monthMean.map(m => m / mu)

  // 预测：AR(1) 均值回归 + 季节性因子（py 口径）
  // forecast_path[i] = target + phi*(forecast_path[i-1] - target)，target = mean * seasonal_factor[month]
  const fcPath = [cur], fcLo = [cur], fcHi = [cur]
  const lastTime = pts[pts.length - 1].date.getTime()
  for (let i = 1; i <= H; i++) {
    const mo = new Date(lastTime + i * 86400000).getMonth()
    const target = mu * (seasFactor[mo] || 1)
    let v = target + phi * (fcPath[i - 1] - target)
    const unc = std * Math.sqrt((1 - Math.pow(phi, 2 * i)) / (1 - phi * phi)) * 0.5 // py 置信区间
    let up = v + unc, lo = v - unc
    v = Math.max(v, cmin * 0.5); up = Math.max(up, v); lo = Math.max(lo, cmin * 0.3)
    fcPath.push(+v.toFixed(2)); fcHi.push(+up.toFixed(2)); fcLo.push(+lo.toFixed(2))
  }
  fcPath.shift(); fcHi.shift(); fcLo.shift() // 去掉初始化项
  const f1 = fcPath[20 - 1] ?? fcPath[0]
  const f3 = fcPath[60 - 1] ?? fcPath[fcPath.length - 1]
  const f6 = fcPath[125 - 1] ?? fcPath[fcPath.length - 1]
  const f12 = fcPath[H - 1]
  const trend = z > 0.5 ? '下行回归' : (z < -0.5 ? '上行回归' : '区间震荡')

  return { code, name: DISPLAY[code], values, pts, cur, cmin, mu, med, std, z, p, phi, half,
    monthMean: monthMean.map(v => +v.toFixed(1)), qMean: qMean.map(v => +v.toFixed(1)),
    fcPath, fcLo, fcHi, f1, f3, f6, f12, trend }
}

/* ============ 图 1：历史走势（每行固定 3 个，自适应行数） ============ */
const historyOpt = computed(() => {
  if (!infos.value.length) return Object.assign({}, BASE_OPT)
  const cols = 3
  const rows = Math.ceil(infos.value.length / cols)
  const grids = [], xAxes = [], yAxes = [], series = [], titles = []
  infos.value.forEach((info, i) => {
    const row = Math.floor(i / cols), col = i % cols
    const rowH = rows === 1 ? 100 : Math.floor(90 / rows)
    const gap = rows === 1 ? 0 : Math.floor(6 / rows)
    const left = 4 + col * 33.5, top = 6 + row * (rowH + gap), width = 30, height = rows === 1 ? 80 : rowH - gap
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

/* ============ 图 2：波动率锥（py: 双柱并排，左为分位锥，右为当前值柱） ============ */
const coneOpt = computed(() => {
  if (!infos.value.length) return Object.assign({}, BASE_OPT)
  const cats = infos.value.map(i => i.name)
  const q0 = infos.value.map(i => quant(i.values, 0))
  const q5 = infos.value.map(i => quant(i.values, 0.05))
  const q25 = infos.value.map(i => quant(i.values, 0.25))
  const q50 = infos.value.map(i => quant(i.values, 0.50))
  const q75 = infos.value.map(i => quant(i.values, 0.75))
  const q95 = infos.value.map(i => quant(i.values, 0.95))
  const q100 = infos.value.map(i => quant(i.values, 1))
  const cur = infos.value.map(i => i.cur)
  const pctV = infos.value.map(i => +(i.p * 100).toFixed(0))
  const w = '70%'
  const stackH = (base, top) => top.map((v, i) => +(v - (base[i] || 0)).toFixed(2))
  return Object.assign({}, BASE_OPT, {
    grid: { left: 50, right: 20, top: 36, bottom: 64 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => {
      const idx = p[0].dataIndex
      return `${cats[idx]}<br/>Min: ${q0[idx].toFixed(1)} | 5%: ${q5[idx].toFixed(1)} | 25%: ${q25[idx].toFixed(1)} | 50%: ${q50[idx].toFixed(1)}<br/>75%: ${q75[idx].toFixed(1)} | 95%: ${q95[idx].toFixed(1)} | Max: ${q100[idx].toFixed(1)}<br/>当前: ${cur[idx].toFixed(1)} (分位 ${pctV[idx]}%)`
    } },
    legend: { data: ['95%-Max', '75%-95%', '50%-75%', '25%-50%', '5%-25%', 'Min-5%', '当前值'], top: 4 },
    xAxis: Object.assign({ type: 'category', data: cats, axisLabel: { color: '#5f6672', fontSize: 10, rotate: 30 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: '隐含波动率 (%)', scale: true }, AXIS),
    series: [
      { name: 'Min-5%', type: 'bar', stack: 'cone', barWidth: w, data: stackH(q0, q5), itemStyle: { color: '#ebf5fb' } },
      { name: '5%-25%', type: 'bar', stack: 'cone', barWidth: w, data: stackH(q5, q25), itemStyle: { color: '#d6eaf8' } },
      { name: '25%-50%', type: 'bar', stack: 'cone', barWidth: w, data: stackH(q25, q50), itemStyle: { color: '#aed6f1' } },
      { name: '50%-75%', type: 'bar', stack: 'cone', barWidth: w, data: stackH(q50, q75), itemStyle: { color: '#f5b7b1' } },
      { name: '75%-95%', type: 'bar', stack: 'cone', barWidth: w, data: stackH(q75, q95), itemStyle: { color: '#fadbd8' } },
      { name: '95%-Max', type: 'bar', stack: 'cone', barWidth: w, data: stackH(q95, q100), itemStyle: { color: '#fdedec' } },
      { name: '当前值', type: 'scatter', symbolSize: 7, symbol: 'circle', data: cur.map((v, i) => [i, v]), itemStyle: { color: '#2c3e50', borderColor: '#fff', borderWidth: 1.5 },
        label: { show: true, position: 'top', formatter: p => `${cur[p.dataIndex].toFixed(1)}\n(${pctV[p.dataIndex]}%)`, fontSize: 9, fontWeight: 'bold', color: '#e02020', lineHeight: 11 } },
    ],
  })
})

/* ============ 图 3：季节性（py: 仅 5 个代表标的，月度折线 + 季度分组柱） ============ */
const seasonInfos = computed(() => infos.value.filter(i => SEASONAL_CODES.includes(i.code)))
const seasonOpt = computed(() => {
  const arr = seasonInfos.value
  if (!arr.length) return Object.assign({}, BASE_OPT)
  return Object.assign({}, BASE_OPT, {
    grid: [{ left: 56, right: 46, top: 40, bottom: 36, height: '42%' }, { left: 56, right: 46, top: '56%', bottom: 36, height: '36%' }],
    legend: { type: 'scroll', top: 4, data: arr.map(i => i.name) },
    tooltip: { trigger: 'axis' },
    xAxis: [{ gridIndex: 0, type: 'category', data: MONTH_LABEL, axisLabel: { color: '#5f6672' } }, { gridIndex: 1, type: 'category', data: QUARTER_LABEL, axisLabel: { color: '#5f6672' } }],
    yAxis: [{ gridIndex: 0, type: 'value', name: 'IV %', nameTextStyle: { color: '#8f95a1', fontSize: 11 }, axisLabel: { color: '#8f95a1', fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f2f5' } }, scale: true },
      { gridIndex: 1, type: 'value', name: 'IV %', nameTextStyle: { color: '#8f95a1', fontSize: 11 }, axisLabel: { color: '#8f95a1', fontSize: 10 }, splitLine: { lineStyle: { color: '#f0f2f5' } }, scale: true }],
    series: [
      ...arr.map((info) => ({ name: info.name, type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: info.monthMean, symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: PALETTE[SEASONAL_CODES.indexOf(info.code) % PALETTE.length] }, itemStyle: { color: PALETTE[SEASONAL_CODES.indexOf(info.code) % PALETTE.length] } })),
      ...arr.map((info) => ({ name: info.name, type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: info.qMean, itemStyle: { color: PALETTE[SEASONAL_CODES.indexOf(info.code) % PALETTE.length], opacity: 0.8 }, barMaxWidth: 14 })),
    ],
  })
})

/* ============ 图 4：未来一年预测（自动根据 vixs 标的数布局，每行固定 3 个） ============ */
const forecastInfos = computed(() => infos.value)
const forecastOpt = computed(() => {
  const arr = forecastInfos.value
  if (!arr.length) return Object.assign({}, BASE_OPT)
  const cols = 3
  const rows = Math.ceil(arr.length / cols)
  const grids = [], xAxes = [], yAxes = [], series = [], titles = []
  arr.forEach((info, i) => {
    const row = Math.floor(i / cols), col = i % cols
    const rowH = rows === 1 ? 100 : Math.floor(90 / rows)
    const gap = rows === 1 ? 0 : Math.floor(6 / rows)
    const left = 4 + col * 33.5, top = 6 + row * (rowH + gap), width = 30, height = rows === 1 ? 80 : rowH - gap
    grids.push({ left: left + '%', top: top + '%', width: width + '%', height: height + '%' })

    // 历史仅最近 1 年
    const lastTime = info.pts[info.pts.length - 1].date.getTime()
    const cutoff = lastTime - 365 * 86400000
    const histPts = info.pts.filter(p => p.date.getTime() >= cutoff)
    const histDates = histPts.map(p => fmtDate(p.date))
    const fcDates = Array.from({ length: H }, (_, t) => fmtDate(new Date(lastTime + (t + 1) * 86400000)))
    xAxes.push({ gridIndex: i, type: 'category', data: histDates.concat(fcDates), show: row === 1 })
    yAxes.push({ gridIndex: i, type: 'value', name: 'IV %', min: 0, nameTextStyle: { fontSize: 9, color: '#8f95a1' }, axisLabel: { fontSize: 9, color: '#8f95a1' }, splitLine: { lineStyle: { color: '#f0f2f5' } } })

    const histData = histPts.map(p => p.v).concat(new Array(H).fill(null))
    const fcData = new Array(histPts.length - 1).fill(null).concat([info.cur]).concat(info.fcPath)
    const loData = new Array(histPts.length).fill(null).concat(info.fcLo)
    const hiData = new Array(histPts.length).fill(null).concat(info.fcHi)

    series.push({ name: '历史IV', type: 'line', xAxisIndex: i, yAxisIndex: i, data: histData, symbol: 'none', lineStyle: { width: 1.2, color: PALETTE[i] }, showSymbol: false })
    series.push({ name: '均值', type: 'line', xAxisIndex: i, yAxisIndex: i, data: new Array(histDates.length).fill(+info.mu.toFixed(1)), symbol: 'none', lineStyle: { type: 'dashed', color: '#19b36b', width: 0.8, opacity: 0.7 }, silent: true, tooltip: { show: false } })
    series.push({ name: '中位数', type: 'line', xAxisIndex: i, yAxisIndex: i, data: new Array(histDates.length).fill(+info.med.toFixed(1)), symbol: 'none', lineStyle: { type: 'dashed', color: '#9ca3af', width: 0.8, opacity: 0.7 }, silent: true, tooltip: { show: false } })
    series.push({ name: '预测均值路径', type: 'line', xAxisIndex: i, yAxisIndex: i, data: fcData, symbol: 'none', lineStyle: { width: 1.6, color: '#e02020' }, showSymbol: false,
      markLine: { silent: true, symbol: 'none', data: [{ xAxis: histDates.length - 1, lineStyle: { color: '#e5e7eb', width: 1 } }] }
    })
    series.push({ name: '预测区间', type: 'line', xAxisIndex: i, yAxisIndex: i, data: loData, symbol: 'none', lineStyle: { opacity: 0 }, stack: 'fc' + i, silent: true, tooltip: { show: false } })
    series.push({ name: '预测区间', type: 'line', xAxisIndex: i, yAxisIndex: i, data: hiData.map((v, idx) => v == null ? null : +(v - (loData[idx] || 0)).toFixed(2)), symbol: 'none', lineStyle: { opacity: 0 }, stack: 'fc' + i, areaStyle: { color: 'rgba(224,32,32,0.18)' }, silent: true, tooltip: { show: false } })

    titles.push({ text: `${info.name}（当前Z=${info.z.toFixed(1)}，均值=${info.mu.toFixed(1)}）`, left: (left + 1) + '%', top: (top + 0.5) + '%', textStyle: { fontSize: 11, fontWeight: 'bold', color: '#374151' } })
  })
  return Object.assign({}, BASE_OPT, { grid: grids, title: titles, xAxis: xAxes, yAxis: yAxes, series, tooltip: { trigger: 'axis', textStyle: { fontSize: 10 } }, legend: { type: 'scroll', top: 'top', textStyle: { fontSize: 10 } } })
})

/* ============ 图 5：当前分位排名 ============ */
const rankOpt = computed(() => {
  if (!infos.value.length) return Object.assign({}, BASE_OPT)
  const orderIdx = code => { const i = OPTIONS_MAP_ORDER.indexOf(code); return i >= 0 ? i : 9999 }
  const sorted = infos.value.slice().sort((a, b) => orderIdx(a.code) - orderIdx(b.code))
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

/* ============ 图 6：相关性矩阵（py: pivot 对齐后成对 corr） ============ */
const corrMatrix = computed(() => {
  if (!infos.value.length) return []
  // 每个标的按日期对齐到值表
  const tables = infos.value.map(info => {
    const m = {}
    for (const p of info.pts) m[Math.floor(p.date.getTime() / 86400000)] = p.v
    return m
  })
  const m = infos.value.map((_a, i) => infos.value.map((_b, j) => {
    if (i === j) return 1
    const ta = tables[i], tb = tables[j]
    const va = [], vb = []
    for (const k in ta) if (tb[k] != null) { va.push(ta[k]); vb.push(tb[k]) }
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
    xAxis: { type: 'category', data: cats, splitArea: { show: true }, axisLabel: { color: '#5f6672', fontSize: 10, rotate: 45 } },
    yAxis: { type: 'category', data: cats, splitArea: { show: true }, axisLabel: { color: '#5f6672', fontSize: 10 } },
    visualMap: { min: 0.5, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: 6, inRange: { color: ['#1a9850', '#fee08b', '#d73027'] }, textStyle: { color: '#5f6672', fontSize: 10 } },
    series: [{ name: '相关系数', type: 'heatmap', data, label: { show: true, formatter: p => p.data[2], fontSize: 10, color: '#fff' }, emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,.15)' } } }],
  })
})

/* ============ 核心结论（对齐 py 报告口径） ============ */
const conclusion = computed(() => {
  if (!infos.value.length) return ''
  const high = infos.value.filter(i => i.p >= 0.75).sort((a, b) => b.z - a.z)
  const low = infos.value.filter(i => i.p <= 0.25).sort((a, b) => a.z - b.z)
  const mid = infos.value.filter(i => i.p > 0.25 && i.p < 0.75)
  const parts = []
  if (high.length) parts.push(`🔴 高估区（建议做空波动率）：${high.map(i => `${i.name} 当前${i.cur.toFixed(1)}/分位${(i.p * 100).toFixed(0)}%/Z=${i.z.toFixed(1)}`).join('、')}，未来一年大概率震荡下行回归均值，可考虑卖出宽跨式等策略`)
  if (low.length) parts.push(`🟢 低估区（建议做多波动率）：${low.map(i => `${i.name} 当前${i.cur.toFixed(1)}/分位${(i.p * 100).toFixed(0)}%/Z=${i.z.toFixed(1)}`).join('、')}，未来一年有上行回归空间，可考虑买入跨式等策略`)
  if (mid.length) parts.push(`🟡 中性区（区间震荡）：${mid.map(i => i.name).join('、')}，预计在均值附近震荡，适合波段交易`)
  const avgCorr = []
  for (let i = 0; i < corrMatrix.value.length; i++) for (let j = i + 1; j < corrMatrix.value.length; j++) avgCorr.push(corrMatrix.value[i][j])
  const avg = avgCorr.length ? mean(avgCorr) : 0
  parts.push(`各标的 IV 平均相关性 ${avg.toFixed(2)}（普遍>0.8），系统性风险事件会同时推高所有标的 IV；均值回归是核心驱动力，当前偏离越远回归力度越强，半衰期约 ${high.concat(mid, low).length ? infos.value[0].half.toFixed(0) : '—'} 个交易日；季节性上 Q1 偏高、Q4 偏低。以上仅供参考，不构成投资建议。`)
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
