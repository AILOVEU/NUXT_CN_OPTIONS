<template>
  <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>隐波规律（当前标的 · 实时计算）</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">基于 public/vixs.csv 中当前标的隐波序列，全部统计在浏览器端实时计算，切换标的或数据更新即自动反映</div>

    <div v-if="loading" class="py-8 text-center text-[12px] text-[#8f95a1]">加载隐波数据中…</div>
    <div v-else-if="err" class="py-8 text-center text-[12px] text-[#e02020]">{{ err }}</div>
    <div v-else-if="!series.length" class="py-8 text-center text-[12px] text-[#8f95a1]">当前标的（{{ curCode }}）无隐波历史数据</div>
    <div v-else>
      <!-- 当前值与分位 -->
      <div class="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div class="rounded-[8px] border border-[#eef0f3] bg-[#f8fafc] p-2.5">
          <div class="text-[11px] text-[#8f95a1]">最新隐波</div>
          <div class="text-[18px] font-semibold" :style="{ color: quantileColor(curPct) }">{{ fmt(curIV, 1) }}%</div>
          <div class="text-[11px] text-[#8f95a1]">历史分位 {{ fmt(curPct * 100, 0) }}%</div>
        </div>
        <div class="rounded-[8px] border border-[#eef0f3] bg-[#f8fafc] p-2.5">
          <div class="text-[11px] text-[#8f95a1]">均值 / 中位数</div>
          <div class="text-[15px] font-semibold">{{ fmt(meanV, 1) }} / {{ fmt(median, 1) }}%</div>
          <div class="text-[11px] text-[#8f95a1]">样本 {{ n }} 日</div>
        </div>
        <div class="rounded-[8px] border border-[#eef0f3] bg-[#f8fafc] p-2.5">
          <div class="text-[11px] text-[#8f95a1]">自相关 lag1</div>
          <div class="text-[15px] font-semibold">{{ fmt(acf1, 2) }}</div>
          <div class="text-[11px] text-[#8f95a1]">OU 半衰期 {{ fmt(halfLife, 1) }} 天</div>
        </div>
        <div class="rounded-[8px] border border-[#eef0f3] bg-[#f8fafc] p-2.5">
          <div class="text-[11px] text-[#8f95a1]">跳跃日（±15pp / ±25pp）</div>
          <div class="text-[15px] font-semibold">{{ ju15 }} / {{ ju25 }}</div>
          <div class="text-[11px] text-[#8f95a1]">涨/跌日均值 dIV {{ fmt(upMean, 1) }} / {{ fmt(dnMean, 1) }}</div>
        </div>
      </div>

      <!-- 分位参考条 -->
      <div class="mb-3">
        <div class="mb-1 text-[11.5px] text-[#8f95a1] pl-[1px]">历史分位刻度（最新值 {{ fmt(curIV, 1) }}% 处于 {{ fmt(curPct * 100, 0) }}%）</div>
        <div class="relative h-[22px] w-full rounded-[5px]" style="background:linear-gradient(90deg,#12a05c 0%,#f5a623 50%,#e02020 100%)">
          <div class="absolute top-[-3px] h-[28px] w-[2px] bg-[#1f2329]" :style="{ left: (curPct * 100) + '%' }"></div>
        </div>
        <div class="flex justify-between text-[10.5px] text-[#8f95a1]">
          <span>p5 {{ fmt(p05, 0) }}</span><span>p25 {{ fmt(p25, 0) }}</span><span>p50 {{ fmt(p50, 0) }}</span><span>p75 {{ fmt(p75, 0) }}</span><span>p95 {{ fmt(p95, 0) }}</span>
        </div>
      </div>

      <!-- 月度走势 -->
      <div class="mb-1 text-[12.5px] font-medium text-[#3a3f47]">隐波月度均值走势</div>
      <VChart :option="monthOpt" autoresize class="chart" />

      <!-- 年度均值柱状 -->
      <div class="mb-1 mt-3 text-[12.5px] font-medium text-[#3a3f47]">各年度均值</div>
      <VChart :option="yearOpt" autoresize class="chart-sm" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { AXIS, BASE_OPT, C_UP, C_DN, C_ACC, C_WARN, fmt } from './lib'

const props = defineProps({
  u: { type: Object, default: null },
})

const loading = ref(true)
const err = ref('')
const allSeries = ref([]) // 全量 [{date:Date, v:Number, code:String}]
const curCode = computed(() => props.u && props.u.code ? String(props.u.code) : null)
// 仅取当前标的序列，标的切换时自动响应（不重新 fetch）
const series = computed(() => curCode.value ? allSeries.value.filter(p => p.code === curCode.value) : [])

/* ---------- CSV 解析（轻量，不依赖第三方库） ---------- */
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
    out.push({ date: dt, v, code })
  }
  return out
}

/* ---------- 统计工具（运行时计算，不固化） ---------- */
function quantile(sorted, q) {
  if (!sorted.length) return NaN
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos), hi = Math.min(lo + 1, sorted.length - 1)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}
function mean(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN }
function stdev(a) { return a.length ? Math.sqrt(a.reduce((x, y) => x + (y - mean(a)) ** 2, 0) / a.length) : NaN }
function acf(x, lag) {
  const n = x.length
  if (n <= lag) return NaN
  const m = mean(x)
  let num = 0, den = 0
  for (let i = lag; i < n; i++) num += (x[i] - m) * (x[i - lag] - m)
  for (let i = 0; i < n; i++) den += (x[i] - m) ** 2
  return den === 0 ? NaN : num / den
}

const clean = computed(() => series.value.filter(p => p.v >= 5 && p.v <= 200)) // 防御脏值（百分比口径 5%~200%）
const vals = computed(() => clean.value.map(p => p.v).sort((a, b) => a - b))
const n = computed(() => vals.value.length)
const meanV = computed(() => mean(vals.value))
const median = computed(() => quantile(vals.value, 0.5))
const p05 = computed(() => quantile(vals.value, 0.05))
const p10 = computed(() => quantile(vals.value, 0.10))
const p25 = computed(() => quantile(vals.value, 0.25))
const p50 = computed(() => quantile(vals.value, 0.50))
const p75 = computed(() => quantile(vals.value, 0.75))
const p90 = computed(() => quantile(vals.value, 0.90))
const p95 = computed(() => quantile(vals.value, 0.95))
const p99 = computed(() => quantile(vals.value, 0.99))

const curIV = computed(() => clean.value.length ? clean.value[clean.value.length - 1].v : NaN)
const curPct = computed(() => {
  const v = curIV.value
  if (isNaN(v) || !n.value) return 0
  const below = vals.value.filter(x => x <= v).length
  return below / n.value
})

const acf1 = computed(() => acf(vals.value, 1))
const acf5 = computed(() => acf(vals.value, 5))
const acf20 = computed(() => acf(vals.value, 20))
// OU 半衰期：对日变化 dV 关于偏离(dev)回归得斜率 b，halflife = -ln2 / b
const halfLife = computed(() => {
  const cv = clean.value.map(p => p.v)
  if (cv.length < 5) return NaN
  const m = mean(cv)
  const dev = cv.slice(0, -1).map(v => v - m)
  const dV = cv.slice(1).map((v, i) => v - cv[i])
  const md = mean(dev), mdx = mean(dV)
  let num = 0, den = 0
  for (let i = 0; i < dev.length; i++) { num += (dev[i] - md) * (dV[i] - mdx); den += (dev[i] - md) ** 2 }
  const b = den === 0 ? 0 : num / den
  return b < 0 ? -Math.log(2) / b : NaN
})

// 跳跃日与涨跌 dIV 关系（基于日变化）
const ju15 = computed(() => { const d = dailyChg.value; return d.filter(x => x > 15).length + d.filter(x => x < -15).length })
const ju25 = computed(() => { const d = dailyChg.value; return d.filter(x => x > 25).length + d.filter(x => x < -25).length })
const dailyChg = computed(() => {
  const cv = clean.value.map(p => p.v)
  return cv.slice(1).map((v, i) => v - cv[i])
})
// 注意：此处无标的价格序列，相关性与涨跌 dIV 均值参考整体 dIV 分布
const upMean = computed(() => { const d = dailyChg.value.filter(x => x > 0); return d.length ? mean(d) : NaN })
const dnMean = computed(() => { const d = dailyChg.value.filter(x => x < 0); return d.length ? mean(d) : NaN })

function quantileColor(p) {
  if (p >= 0.75) return C_UP
  if (p <= 0.25) return C_DN
  return C_WARN
}

/* ---------- 月度均值序列 ---------- */
const monthOpt = computed(() => {
  const ms = {}
  for (const p of clean.value) {
    const k = p.date.getFullYear() * 12 + p.date.getMonth()
    ;(ms[k] = ms[k] || []).push(p.v)
  }
  const keys = Object.keys(ms).map(Number).sort((a, b) => a - b)
  const cats = keys.map(k => `${Math.floor(k / 12)}-${String(k % 12 + 1).padStart(2, '0')}`)
  const data = keys.map(k => +mean(ms[k]).toFixed(1))
  return Object.assign({}, BASE_OPT, {
    grid: { left: 48, right: 20, top: 24, bottom: 36 }, legend: { show: false },
    tooltip: { trigger: 'axis', valueFormatter: v => v + '%' },
    xAxis: Object.assign({ type: 'category', data: cats, axisLabel: { color: '#8f95a1', fontSize: 10, interval: Math.max(0, Math.floor(cats.length / 12)) } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true }, AXIS),
    series: [{ type: 'line', data, symbolSize: 4, lineStyle: { width: 2, color: C_ACC }, itemStyle: { color: C_ACC }, areaStyle: { color: 'rgba(47,111,235,.08)' } }],
  })
})

/* ---------- 年度均值柱状 ---------- */
const yearOpt = computed(() => {
  const yr = {}
  for (const p of clean.value) {
    const y = p.date.getFullYear()
    ;(yr[y] = yr[y] || []).push(p.v)
  }
  const years = Object.keys(yr).map(Number).sort((a, b) => a - b)
  const data = years.map(y => +mean(yr[y]).toFixed(1))
  return Object.assign({}, BASE_OPT, {
    grid: { left: 48, right: 20, top: 24, bottom: 30 }, legend: { show: false },
    tooltip: { trigger: 'axis', valueFormatter: v => v + '%' },
    xAxis: Object.assign({ type: 'category', data: years.map(String) }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true }, AXIS),
    series: [{ type: 'bar', data, itemStyle: { color: C_ACC, borderRadius: [3, 3, 0, 0] }, barWidth: '55%' }],
  })
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
.chart { width: 100%; height: 260px }
.chart-sm { width: 100%; height: 200px }
</style>
