<template>
  <div class="mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>隐波未来一年预测（总体 / 单标的 · 多维度）</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">基于 public/vixs.csv 全样本，采用 OU 均值回复模型 + 季节性 + 跳跃风险三维度，生成未来 252 个交易日（约一年）的隐波预测区间；"全部"为六标的按日中位数合并的总体视角，不随标的选择变化</div>

    <div v-if="loading" class="py-8 text-center text-[12px] text-[#8f95a1]">加载隐波数据中…</div>
    <div v-else-if="err" class="py-8 text-center text-[12px] text-[#e02020]">{{ err }}</div>
    <div v-else-if="!selOpts.length" class="py-8 text-center text-[12px] text-[#8f95a1]">无有效隐波历史数据</div>
    <div v-else>
      <!-- 标的切换（仅限静态区内部，不影响策略模块） -->
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <span class="text-[11.5px] tracking-[.4px] text-[#8f95a1]">预测标的</span>
        <button v-for="o in selOpts" :key="o.code" @click="sel = o.code"
          class="rounded-full border px-3 py-1 text-[12px] transition"
          :class="sel === o.code ? 'border-[#7a5af8] bg-[#f3f0ff] font-semibold text-[#7a5af8]' : 'border-[#e3e6ea] bg-white text-[#5f6672] hover:border-[#c9bdfa]'">
          {{ o.short }}
        </button>
      </div>

      <!-- 当前状态 KPI -->
      <div class="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div class="rounded-[8px] border border-[#eef0f3] bg-[#f8fafc] p-2.5">
          <div class="text-[11px] text-[#8f95a1]">当前隐波</div>
          <div class="text-[18px] font-semibold" :style="{ color: qColor(cur.pct) }">{{ fmt(cur.iv, 1) }}%</div>
          <div class="text-[11px] text-[#8f95a1]">历史分位 {{ fmt(cur.pct * 100, 0) }}%</div>
        </div>
        <div class="rounded-[8px] border border-[#eef0f3] bg-[#f8fafc] p-2.5">
          <div class="text-[11px] text-[#8f95a1]">OU 长期中枢</div>
          <div class="text-[18px] font-semibold text-[#2f6feb]">{{ fmt(cur.center, 1) }}%</div>
          <div class="text-[11px] text-[#8f95a1]">回复半衰期 {{ fmt(cur.half, 1) }} 天</div>
        </div>
        <div class="rounded-[8px] border border-[#eef0f3] bg-[#f8fafc] p-2.5">
          <div class="text-[11px] text-[#8f95a1]">1 年预测中枢</div>
          <div class="text-[18px] font-semibold">{{ fmt(cur.fcCenter, 1) }}%</div>
          <div class="text-[11px] text-[#8f95a1]">区间 {{ fmt(cur.fcLo, 0) }}~{{ fmt(cur.fcHi, 0) }}%</div>
        </div>
        <div class="rounded-[8px] border border-[#eef0f3] bg-[#f8fafc] p-2.5">
          <div class="text-[11px] text-[#8f95a1]">跳跃风险（年化）</div>
          <div class="text-[18px] font-semibold" :style="{ color: cur.jumpRate > 0.04 ? C_UP : '#5f6672' }">{{ fmt(cur.jumpRate * 100, 1) }}%</div>
          <div class="text-[11px] text-[#8f95a1]">过去 {{ fmt(cur.jumpDays, 0) }} 个跳跃日</div>
        </div>
      </div>

      <!-- 预测路径 + 区间带 -->
      <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">未来一年隐波预测路径（OU 均值回复 + 分位区间）</div>
      <VChart :option="fcOpt" autoresize class="chart" />

      <!-- 多维度分析 -->
      <div class="mb-1 mt-3 text-[12.5px] font-medium text-[#3a3f47]">维度一 · 季节性（近 5 年月度均值隐波{{ sel === 'ALL' ? ' · 各标的分组' : '' }}）</div>
      <VChart :option="seasonOpt" autoresize class="chart-sm" />

      <div class="mb-1 mt-3 text-[12.5px] font-medium text-[#3a3f47]">维度二 · 波动率聚类（近 60 日滚动自相关）</div>
      <VChart :option="acfOpt" autoresize class="chart-sm" />

      <!-- 维度结论 -->
      <div class="mt-3 rounded-[8px] border border-[#eee6fb] bg-[#faf7ff] p-3 text-[12px] leading-[1.7] text-[#4a4458]">
        <b class="text-[#7a5af8]">多维度结论：</b>{{ conclusion }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_DN, C_ACC, C_PUR, fmt } from './lib'

/* ============ 数据来源：vixs.csv（全样本，不随策略筛选变化） ============ */
const loading = ref(true)
const err = ref('')
const allSeries = ref([]) // [{date:Date, v:Number, code:String, month:Number}]
const sel = ref(null)

const SHORT = { '510050': '上证50ETF', '510300': '沪深300ETF', '510500': '沪500ETF', '159922': '深500ETF', '159915': '创业板ETF', '588000': '科创50ETF' }

const selOpts = computed(() => {
  const seen = {}
  const out = []
  for (const p of allSeries.value) if (!seen[p.code]) { seen[p.code] = 1; out.push({ code: p.code, short: SHORT[p.code] || p.code }) }
  out.sort((a, b) => Object.keys(SHORT).indexOf(a.code) - Object.keys(SHORT).indexOf(b.code))
  return [{ code: 'ALL', short: '全部' }, ...out]
})

/* ---------- CSV 解析 ---------- */
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
    if (!code || !t || isNaN(v)) continue
    const dt = new Date(t.replace(/\//g, '-'))
    if (isNaN(dt.getTime())) continue
    out.push({ date: dt, v, code, month: dt.getMonth() })
  }
  return out
}

/* ---------- 统计工具 ---------- */
function quant(sorted, q) {
  if (!sorted.length) return NaN
  const pos = (sorted.length - 1) * q, lo = Math.floor(pos), hi = Math.min(lo + 1, sorted.length - 1)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}
function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN }
function stdev(a) { const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length) }

/* 单标的 / 全部分析：返回 OU 参数、预测路径、季节性、自相关、跳跃
   code === 'ALL' 时，按日期对齐取当日各标的隐波中位数，得到"总体隐波"序列 */
function analyze(code) {
  let pts
  if (code === 'ALL') {
    const byDate = {}
    for (const p of allSeries.value) if (p.v >= 5 && p.v <= 200) (byDate[p.date.getTime()] = byDate[p.date.getTime()] || []).push(p.v)
    pts = Object.keys(byDate).map(t => {
      const vs = byDate[t].slice().sort((a, b) => a - b)
      const med = vs[Math.floor(vs.length / 2)]
      return { date: new Date(+t), v: med, code: 'ALL', month: new Date(+t).getMonth() }
    }).sort((a, b) => a.date - b.date)
  } else {
    pts = allSeries.value.filter(p => p.code === code).sort((a, b) => a.date - b.date)
  }
  const clean = pts.filter(p => p.v >= 5 && p.v <= 200).map(p => p.v)
  if (clean.length < 30) return null
  const n = clean.length
  const m = mean(clean)
  const s = stdev(clean)
  // 对数隐波（更稳定的均值回复建模）
  const lv = clean.map(v => Math.log(v))
  const lm = mean(lv)
  // OU：dX_t = -κ (X_t - μ) dt + σ dW；用日变化回归估计 κ
  const dev = lv.slice(0, -1).map(v => v - lm)
  const dV = lv.slice(1).map((v, i) => v - lv[i])
  const md = mean(dev), mdx = mean(dV)
  let num = 0, den = 0
  for (let i = 0; i < dev.length; i++) { num += (dev[i] - md) * (dV[i] - mdx); den += (dev[i] - md) ** 2 }
  const kappa = den === 0 ? 0.05 : -num / den
  const k = Math.max(0.005, Math.min(kappa, 0.5)) // 限制合理范围
  const half = k > 0 ? Math.log(2) / k : NaN
  // 残差标准差 → 年化预测噪声
  const resid = []
  for (let i = 0; i < dev.length; i++) resid.push(dV[i] - mdx - k * (dev[i] - md))
  const sigma = stdev(resid)
  const center = Math.exp(lm) // OU 长期中枢（百分比）

  // 当前值
  const curIV = clean[n - 1]
  const sorted = clean.slice().sort((a, b) => a - b)
  const pct = sorted.filter(x => x <= curIV).length / n

  // 未来一年预测路径（252 个交易日）：OU 均值回复 + 围绕中枢的分位带
  const H = 252
  const x0 = Math.log(curIV)
  const path = [], lo = [], hi = [], p10 = [], p90 = []
  // 确定性均值回复轨迹
  const mu = lm
  const xMean = mu + (x0 - mu) * Math.exp(-k * H)
  for (let t = 0; t <= H; t++) {
    const xt = mu + (x0 - mu) * Math.exp(-k * t)
    path.push(+Math.exp(xt).toFixed(2))
    // 条件标准差：随 t 收敛到 sigma/sqrt(2k)
    const cond = sigma * Math.sqrt((1 - Math.exp(-2 * k * t)) / (2 * k))
    lo.push(+Math.exp(xt - 1.28 * cond).toFixed(2))
    hi.push(+Math.exp(xt + 1.28 * cond).toFixed(2))
    p10.push(+Math.exp(xt - 0.524 * cond).toFixed(2))
    p90.push(+Math.exp(xt + 0.524 * cond).toFixed(2))
  }
  const fcCenter = path[H]
  const fcLo = Math.min(...lo.slice(H - 21)) // 末 1 个月区间下沿
  const fcHi = Math.max(...hi.slice(H - 21))

  // 跳跃风险：日变化绝对值 > 1.5 个残差标准差视为跳跃
  const jumpThr = 1.5 * sigma
  const jumps = dV.filter(d => Math.abs(d) > jumpThr)
  const jumpRate = jumps.length / dV.length
  const jumpDays = jumps.length

  // 季节性：最近 5 年各月均值（对数隐波 → 指数）
  const yrMax = pts[pts.length - 1].date.getFullYear()
  const yrMin = yrMax - 4
  const season = []
  for (let mo = 0; mo < 12; mo++) {
    const vs = allSeries.value
      .filter(p => (code === 'ALL' || p.code === code) && p.month === mo && p.date.getFullYear() >= yrMin)
      .map(p => p.v).filter(v => v >= 5 && v <= 200)
    season.push(vs.length ? +mean(vs).toFixed(1) : null)
  }
  // 全部视角：额外给出每个标的各自的各月值，供分组柱状图展示
  const seasons = code === 'ALL'
    ? Object.keys(SHORT).filter(c => allSeries.value.some(p => p.code === c)).map(c => ({
        code: c, short: SHORT[c],
        data: Array.from({ length: 12 }, (_, mo) => {
          const vs = allSeries.value.filter(p => p.code === c && p.month === mo && p.date.getFullYear() >= yrMin).map(p => p.v).filter(v => v >= 5 && v <= 200)
          return vs.length ? +mean(vs).toFixed(1) : null
        }),
      }))
    : null

  // 自相关：滚动 60 日，lag 1..12
  const acf = []
  const win = lv.slice(-60)
  const wm = mean(win)
  for (let lag = 1; lag <= 12; lag++) {
    let num2 = 0, den2 = 0
    for (let i = lag; i < win.length; i++) num2 += (win[i] - wm) * (win[i - lag] - wm)
    for (let i = 0; i < win.length; i++) den2 += (win[i] - wm) ** 2
    acf.push(+((den2 === 0 ? 0 : num2 / den2)).toFixed(3))
  }

  return { code, pts, clean, curIV, pct, center, half, fcCenter, fcLo, fcHi, jumpRate, jumpDays,
    path, lo, hi, p10, p90, H, season, seasons, acf, k, sigma }
}

const analyses = computed(() => selOpts.value.map(o => analyze(o.code)).filter(Boolean))
function nameOf(code) { return code === 'ALL' ? '六标的（总体）' : (SHORT[code] || code) }
const cur = computed(() => {
  const a = analyses.value.find(x => x.code === sel.value) || analyses.value[0]
  if (!a) return { iv: NaN, pct: 0, center: NaN, half: NaN, fcCenter: NaN, fcLo: NaN, fcHi: NaN, jumpRate: 0, jumpDays: 0 }
  return { iv: a.curIV, pct: a.pct, center: a.center, half: a.half, fcCenter: a.fcCenter, fcLo: a.fcLo, fcHi: a.fcHi, jumpRate: a.jumpRate, jumpDays: a.jumpDays }
})

function qColor(p) { return p >= 0.75 ? C_UP : p <= 0.25 ? C_DN : C_PUR }

/* ---------- 预测路径图 ---------- */
const fcOpt = computed(() => {
  const a = analyses.value.find(x => x.code === sel.value) || analyses.value[0]
  if (!a) return Object.assign({}, BASE_OPT)
  const cats = []
  for (let t = 0; t <= a.H; t++) {
    if (t % 21 === 0) cats.push('T+' + t + (t === 252 ? 'd' : 'd'))
    else cats.push('')
  }
  return Object.assign({}, BASE_OPT, {
    grid: { left: 48, right: 20, top: 30, bottom: 34 }, legend: { show: true, data: ['预测中枢', '90% 区间', '10% 区间'] },
    tooltip: { trigger: 'axis', valueFormatter: v => (v == null ? '—' : v + '%') },
    xAxis: Object.assign({ type: 'category', data: cats, axisLabel: { color: '#8f95a1', fontSize: 10, interval: 0 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true }, AXIS),
    series: [
      { name: '90% 区间', type: 'line', data: a.hi, symbol: 'none', lineStyle: { opacity: 0 }, stack: 'band', areaStyle: { color: 'rgba(122,90,248,.10)' }, tooltip: { show: false }, silent: true },
      { name: '10% 区间', type: 'line', data: a.lo.map((v, i) => +(a.hi[i] - v).toFixed(2)), symbol: 'none', lineStyle: { opacity: 0 }, stack: 'band', areaStyle: { color: '#fff' }, tooltip: { show: false }, silent: true },
      { name: '预测中枢', type: 'line', data: a.path, symbolSize: 4, lineStyle: { width: 2, color: C_PUR }, itemStyle: { color: C_PUR },
        markLine: { silent: true, symbol: 'none', data: [{ yAxis: +a.center.toFixed(1), label: { formatter: 'OU中枢 ' + a.center.toFixed(1) + '%', color: C_ACC, fontSize: 10 }, lineStyle: { color: C_ACC, type: 'dashed', width: 1 } }] } },
    ],
  })
})

/* ---------- 季节性图 ---------- */
const seasonOpt = computed(() => {
  const a = analyses.value.find(x => x.code === sel.value) || analyses.value[0]
  if (!a) return Object.assign({}, BASE_OPT)
  const cats = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  // 全部视角：分组柱状图，展示每个标的各自的各月值
  if (a.code === 'ALL' && a.seasons && a.seasons.length) {
    const palette = ['#7a5af8', '#2f6feb', '#19b36b', '#e6a23c', '#eb4d6a', '#13c2c2']
    return Object.assign({}, BASE_OPT, {
      grid: { left: 46, right: 18, top: 34, bottom: 28 },
      legend: { show: true, type: 'scroll', top: 4, textStyle: { fontSize: 10, color: '#5f6672' } },
      tooltip: { trigger: 'axis', valueFormatter: v => (v == null ? '—' : v + '%') },
      xAxis: Object.assign({ type: 'category', data: cats, axisLabel: { color: '#8f95a1', fontSize: 10 } }, AXIS),
      yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true }, AXIS),
      series: a.seasons.map((s, i) => ({
        name: s.short, type: 'bar', data: s.data,
        itemStyle: { color: palette[i % palette.length], opacity: .85, borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 14,
      })),
    })
  }
  // 单标的视角：单条柱状图
  return Object.assign({}, BASE_OPT, {
    grid: { left: 46, right: 18, top: 24, bottom: 28 }, legend: { show: false },
    tooltip: { trigger: 'axis', valueFormatter: v => (v == null ? '—' : v + '%') },
    xAxis: Object.assign({ type: 'category', data: cats }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true }, AXIS),
    series: [{ type: 'bar', data: a.season, itemStyle: { color: C_PUR, opacity: .8, borderRadius: [3, 3, 0, 0] }, barWidth: '55%' }],
  })
})

/* ---------- 自相关图 ---------- */
const acfOpt = computed(() => {
  const a = analyses.value.find(x => x.code === sel.value) || analyses.value[0]
  if (!a) return Object.assign({}, BASE_OPT)
  const cats = a.acf.map((_, i) => 'lag' + (i + 1))
  return Object.assign({}, BASE_OPT, {
    grid: { left: 46, right: 18, top: 24, bottom: 28 }, legend: { show: false },
    tooltip: { trigger: 'axis', valueFormatter: v => (v == null ? '—' : v.toFixed(3)) },
    xAxis: Object.assign({ type: 'category', data: cats, axisLabel: { color: '#8f95a1', fontSize: 10, interval: 1 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'ACF', scale: true }, AXIS),
    series: [{ type: 'bar', data: a.acf, itemStyle: { color: p => p.value > 0.1 ? C_UP : '#c8cdd6', opacity: .85, borderRadius: [2, 2, 0, 0] }, barWidth: '55%',
      markLine: { silent: true, symbol: 'none', data: [{ yAxis: 0, lineStyle: { color: '#e3e6ea' } }] } }],
  })
})

const conclusion = computed(() => {
  const a = analyses.value.find(x => x.code === sel.value) || analyses.value[0]
  if (!a) return '暂无数据。'
  const nm = nameOf(a.code)
  const parts = []
  parts.push(`【${nm}】当前隐波 ${fmt(a.curIV, 1)}%（历史分位 ${fmt(a.pct * 100, 0)}%），OU 长期中枢 ${fmt(a.center, 1)}%`)
  parts.push(a.pct > 0.66 ? '处于历史偏高区，均值回复压力下未来一年大概率向中枢收敛下行'
    : a.pct < 0.34 ? '处于历史偏低区，事件驱动下易向上跳升，回复中枢意愿强'
    : '处于历史中性区，围绕中枢窄幅波动')
  parts.push(`半衰期约 ${fmt(a.half, 1)} 天，回复速度${a.k > 0.02 ? '较快' : '较慢'}`)
  const maxS = Math.max(...a.season.filter(v => v != null)), minS = Math.min(...a.season.filter(v => v != null))
  parts.push(`季节性上 ${maxS} 月（${fmt(maxS, 0)}%）为年内高点、${minS} 月（${fmt(minS, 0)}%）为低点`)
  parts.push(`近 60 日自相关 lag1=${fmt(a.acf[0], 2)}，${a.acf[0] > 0.3 ? '波动率聚类明显，短期隐波惯性延续' : '聚类较弱，短期动量不显著'}`)
  parts.push(`年化跳跃概率约 ${fmt(a.jumpRate * 100, 1)}%，${a.jumpRate > 0.04 ? '尾部风险偏高，需为突发事件预留 Vega 敞口' : '尾部相对平稳'}`)
  return parts.join('；') + '。'
})

onMounted(async () => {
  try {
    const text = await $fetch('/vixs.csv', { responseType: 'text' })
    allSeries.value = parseCsv(text)
    if (!allSeries.value.length) err.value = 'vixs.csv 无有效隐波数据'
    else sel.value = 'ALL'
  } catch (e) {
    err.value = '读取 vixs.csv 失败：' + (e && e.message ? e.message : e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.chart { width: 100%; height: 300px }
.chart-sm { width: 100%; height: 200px }
</style>
