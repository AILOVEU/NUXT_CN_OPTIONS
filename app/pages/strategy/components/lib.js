/* strategy 页面各模块共用的常量与纯计算逻辑（不依赖 Vue 响应式，可独立测试） */

/* ============ 常量 ============ */
export const MULT = 10000
export const C_UP = '#e02020'
export const C_DN = '#12a05c'
export const C_ACC = '#2f6feb'
export const C_PUR = '#7a5af8'
export const C_WARN = '#f5a623'

/* ============ ECharts 共享配置 ============ */
export const AXIS = { axisLine: { lineStyle: { color: '#dfe3e8' } }, axisLabel: { color: '#8f95a1', fontSize: 11 },
  splitLine: { lineStyle: { color: '#f0f2f5' } }, nameTextStyle: { color: '#8f95a1', fontSize: 11 } }
export const BASE_OPT = { grid: { left: 52, right: 52, top: 34, bottom: 34 },
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#e3e6ea', borderWidth: 1,
    textStyle: { color: '#1f2329', fontSize: 12 }, extraCssText: 'box-shadow:0 4px 18px rgba(0,0,0,.09);border-radius:8px' },
  legend: { top: 2, textStyle: { color: '#5f6672', fontSize: 11 }, itemWidth: 14, itemHeight: 8, itemGap: 14 } }

/* ============ 标的代码映射 ============ */
export const NAME2CODE = {
  '上证50ETF华夏': '510050', '沪深300ETF华泰柏瑞': '510300', '中证500ETF南方': '510500',
  '中证500ETF嘉实': '159922', '创业板ETF易方达': '159915', '科创50ETF华夏': '588000',
}
export const SHORT = { '510050': '上证50ETF', '510300': '沪深300ETF', '510500': '沪500ETF', '159922': '深500ETF', '159915': '创业板ETF', '588000': '科创50ETF' }

/* ============ 通用工具 ============ */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const fmt = (v, d = 2) => (v === null || v === undefined || isNaN(v)) ? '—' : Number(v).toFixed(d)
export const wan = (v) => Math.abs(v) >= 1e8 ? (v / 1e8).toFixed(2) + '亿' : Math.abs(v) >= 1e4 ? (v / 1e4).toFixed(1) + '万' : Math.round(v)
export const sign = (v) => (v > 0 ? '+' : '')
export const pstdev = (a) => { if (!a.length) return 0; const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length) }
export const parseDate = (s) => { if (!s) return null; s = String(s).replace(/-/g, ''); if (s.length >= 8) return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)); return null }
export const daysBetween = (a, b) => { const da = parseDate(a), db = parseDate(b); if (!da || !db) return 30; return Math.round((db - da) / 86400000) }
export const fmtExp = (s) => (s && s.length >= 8) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}` : s

export function ncdf(x) {
  const a1 = .254829592, a2 = -.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = .3275911
  const s = x < 0 ? -1 : 1; x = Math.abs(x) / Math.SQRT2; const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return .5 * (1 + s * y)
}
export function bs(S, K, T, sig, type, r = 0.015) {
  if (T <= 1e-6 || sig <= 0) return type === 'C' ? Math.max(0, S - K) : Math.max(0, K - S)
  const d1 = (Math.log(S / K) + (r + sig * sig / 2) * T) / (sig * Math.sqrt(T))
  const d2 = d1 - sig * Math.sqrt(T)
  return type === 'C' ? S * ncdf(d1) - K * Math.exp(-r * T) * ncdf(d2) : K * Math.exp(-r * T) * ncdf(-d2) - S * ncdf(-d1)
}

/* ============ 评分引擎 ============ */
export function hvFair(u) { const h = u.hv || {}; const fast = h.rv5 || h.hvRV || h.hvPark || 0; const slow = h.hvBlend || h.hvPark || 0; return .6 * fast + .4 * slow }
export function scoreDir(u, e) {
  const S = u.spot, h = u.hv || {}; const S_ = []
  const trend = (S / (h.ma10 || S) - 1)
  S_.push({ n: '趋势动量（现价 / MA10）', v: sign(trend * 100) + fmt(trend * 100, 2) + '%', w: .35, s: clamp(trend * 1500, -100, 100), t: '价格在均线下方＝下行趋势' })
  const mp = (e.maxPain / S - 1)
  S_.push({ n: '最大痛点引力', v: '最大痛点 ' + fmt(e.maxPain, 3) + '（' + sign(mp * 100) + fmt(mp * 100, 2) + '%）', w: .20, s: clamp(mp * 1500, -100, 100), t: '现价低于最大痛点，到期前有向上牵引' })
  const rrn = (e.rr25 != null && e.atmIV) ? e.rr25 / e.atmIV : null
  S_.push({ n: '25Δ 风险逆转（偏斜）', v: rrn == null ? '—' : fmt(e.rr25, 2) + '（/ATM＝' + fmt(rrn * 100, 1) + '%）', w: .20, s: rrn == null ? null : clamp((rrn + 0.10) * 800, -100, 100), t: '偏斜比常态(-10%)更陡＝恐慌，更平＝乐观' })
  const dp = e.doiPCR
  S_.push({ n: '新增持仓 PCR（认沽/认购）', v: (dp == null) ? '—' : fmt(dp, 2), w: .15, s: (dp == null) ? null : clamp((1 - dp) * 150, -100, 100), t: '＜1＝当日新开仓以认购为主' })
  const nd = e.netDelta / (e.totalOI || 1)
  S_.push({ n: '持仓加权净 Delta', v: wan(e.netDelta) + '（单位持仓 ' + fmt(nd, 3) + '）', w: .10, s: clamp(nd * 300, -100, 100), t: '全市场持仓的方向暴露' })
  let tot = 0, wt = 0; S_.forEach(x => { if (x.s != null) { tot += x.s * x.w; wt += x.w } })
  return { items: S_, score: wt ? tot / wt : 0 }
}
export function scoreVol(u, e) {
  const S_ = [], far = u.expiries[u.expiries.length - 1], hf = hvFair(u)
  const p = u.ivPct ? u.ivPct.pct : null
  S_.push({ n: 'IV 历史分位（近3年）', v: p == null ? '无历史数据' : fmt(p, 0) + '%', w: .30, s: p == null ? null : -(p - 50) / 50 * 100, t: '分位越高，卖波动率越占优' })
  const vrp = e.atmIV - hf
  S_.push({ n: '波动率风险溢价 VRP', v: sign(vrp) + fmt(vrp, 2) + ' 点（IV ' + fmt(e.atmIV, 1) + ' － 预期HV ' + fmt(hf, 1) + '）', w: .30, s: -clamp(vrp / (e.atmIV || 1) * 400, -100, 100), t: 'IV 高于预期实现波动率＝卖方有安全垫' })
  const slope = (far.atmIV - e.atmIV) / e.atmIV
  S_.push({ n: '期限结构斜率', v: fmt(e.atmIV, 1) + ' → ' + fmt(far.atmIV, 1) + '（' + sign(slope * 100) + fmt(slope * 100, 1) + '%）', w: .20, s: clamp(slope * 400, -100, 100), t: '倒挂＝近月被抢，卖近月买远月占优' })
  const rt = (u.hv && u.hv.rvTrend) || 0
  S_.push({ n: '实现波动率动量（近5日 vs 17日）', v: sign(rt * 100) + fmt(rt * 100, 1) + '%', w: .20, s: clamp(rt * 500, -100, 100), t: '实现波动率回落中＝IV 后续大概率跟跌' })
  let tot = 0, wt = 0; S_.forEach(x => { if (x.s != null) { tot += x.s * x.w; wt += x.w } })
  return { items: S_, score: wt ? tot / wt : 0 }
}
export function ctxOf(u, e) { const far = u.expiries[u.expiries.length - 1]; return { vrp: e.atmIV - hvFair(u), slope: (far.atmIV - e.atmIV) / e.atmIV, days: e.days } }
export function verdictOf(d, v, ctx) {
  ctx = ctx || {}
  const D = Math.abs(d) < 18 ? '中性' : (d > 0 ? (d > 45 ? '偏多' : '略偏多') : (d < -45 ? '偏空' : '略偏空'))
  const V = Math.abs(v) < 18 ? '波动率中性' : (v < 0 ? (v < -45 ? '强烈做空波动率' : '做空波动率') : (v > 45 ? '强烈做多波动率' : '做多波动率'))
  const vrp = ctx.vrp === undefined ? 1 : ctx.vrp
  let key, alt, caution = ''
  if (Math.abs(d) < 18) {
    if (v <= -18) {
      if (vrp <= 0) { key = 'calendar'; alt = 'iron_condor'; caution = '该标的 IV 仍低于预期实现波动率，净卖出波动率没有安全垫。倒挂的期限结构才是可利用的部分，优先用卖近买远的日历结构，而不是直接卖 Gamma。' }
      else if (v <= -45) { key = 'iron_condor'; alt = 'short_strangle'; caution = '铁鹰是风险有限版本；若保证金充裕且愿意承担尾部风险，可用卖出宽跨式提高收益率，但必须设置止损。' }
      else { key = 'iron_condor'; alt = 'calendar' }
    } else if (v >= 18) { key = 'long_straddle'; alt = 'long_strangle'; caution = '买入波动率的最大敌人是时间价值损耗，需要标的在较短时间内出现方向性突破。' }
    else { key = 'iron_condor'; alt = 'calendar'; caution = '方向与波动率信号都不明确，建议轻仓或观望。' }
  } else if (d >= 18) {
    if (v <= -18) { key = 'bull_put'; alt = 'short_put'; caution = '看多且波动率贵：用卖出认沽价差同时赚方向与时间价值，比直接买认购更划算。' }
    else { key = 'long_call'; alt = 'call_spread' }
  } else {
    if (v <= -18) { key = 'bear_call'; alt = 'covered_call'; caution = '看空且波动率贵：卖出认购价差优于买入认沽。' }
    else { key = 'long_put'; alt = 'put_spread' }
  }
  return { D, V, key, alt, caution }
}
export function sigRow(x, col) {
  const s = x.s; const w = s == null ? 0 : Math.abs(s) / 2
  const c = s == null ? '#ccc' : (col === 'dir' ? (s > 0 ? C_UP : C_DN) : (s < 0 ? C_PUR : C_WARN))
  return { n: x.n, v: x.v, w: x.w, tip: x.t, sLabel: s == null ? '—' : sign(s) + fmt(s, 0), barW: w, color: c }
}

/* ============ 策略构造 ============ */
export function pickByDelta(rows, type, target) {
  let best = null, bd = 9
  rows.forEach(r => {
    const dl = type === 'C' ? r.cDelta : r.pDelta; const px = type === 'C' ? r.cLast : r.pLast
    if (dl == null || px == null || !px) return
    const a = Math.abs(Math.abs(dl) - target)
    if (a < bd) { bd = a; best = r }
  })
  return best
}
export function leg(row, type, qty, days) {
  if (!row) return null
  const px = type === 'C' ? row.cLast : row.pLast
  const iv = type === 'C' ? row.cIV : row.pIV
  const ivv = (iv != null ? iv : (type === 'C' ? row.pIV : row.cIV)) || 20
  return { type, K: row.K, px, qty, iv: ivv / 100, t: days }
}
export function underLeg(u, qty) { return { type: 'S', K: 0, px: u.spot, qty, iv: 0, t: 1e9 } }
export const STRATEGIES = {
  short_strangle: { n: '卖出宽跨式 Short Strangle', d: '同时卖出虚值认购与虚值认沽，赚取双边时间价值，需承担两侧尾部风险', build: (r, e) => [leg(pickByDelta(r, 'C', .25), 'C', -1), leg(pickByDelta(r, 'P', .25), 'P', -1)] },
  iron_condor: { n: '铁鹰式 Iron Condor', d: '卖宽跨式并买入更虚值的两翼作保护，风险有限、收益有限的做空波动率结构', build: (r, e) => [leg(pickByDelta(r, 'C', .25), 'C', -1), leg(pickByDelta(r, 'C', .10), 'C', 1), leg(pickByDelta(r, 'P', .25), 'P', -1), leg(pickByDelta(r, 'P', .10), 'P', 1)] },
  short_straddle: { n: '卖出跨式 Short Straddle', d: '卖出平值认购＋认沽，时间价值收入最大，Gamma 风险也最大', build: (r, e) => [leg(pickByDelta(r, 'C', .50), 'C', -1), leg(pickByDelta(r, 'P', .50), 'P', -1)] },
  long_straddle: { n: '买入跨式 Long Straddle', d: '买入平值认购＋认沽，做多波动率，需要标的大幅单边或波动率抬升', build: (r, e) => [leg(pickByDelta(r, 'C', .50), 'C', 1), leg(pickByDelta(r, 'P', .50), 'P', 1)] },
  long_strangle: { n: '买入宽跨式 Long Strangle', d: '买入虚值认购＋认沽，成本低于跨式，需要更大波幅', build: (r, e) => [leg(pickByDelta(r, 'C', .25), 'C', 1), leg(pickByDelta(r, 'P', .25), 'P', 1)] },
  bull_put: { n: '牛市看跌价差 Bull Put Spread', d: '卖出较高行权价认沽、买入较低行权价认沽，温和看多＋收时间价值，风险有限', build: (r, e) => [leg(pickByDelta(r, 'P', .35), 'P', -1), leg(pickByDelta(r, 'P', .15), 'P', 1)] },
  bear_call: { n: '熊市看涨价差 Bear Call Spread', d: '卖出较低行权价认购、买入较高行权价认购，温和看空＋收时间价值，风险有限', build: (r, e) => [leg(pickByDelta(r, 'C', .35), 'C', -1), leg(pickByDelta(r, 'C', .15), 'C', 1)] },
  long_call: { n: '买入认购 Long Call', d: '方向性做多，损失有限、收益无限，但需承受时间价值损耗与 IV 回落', build: (r, e) => [leg(pickByDelta(r, 'C', .45), 'C', 1)] },
  long_put: { n: '买入认沽 Long Put', d: '方向性做空 / 组合保险，损失有限', build: (r, e) => [leg(pickByDelta(r, 'P', .45), 'P', 1)] },
  call_spread: { n: '牛市看涨价差 Bull Call Spread', d: '买低卖高认购，降低权利金成本，适合 IV 偏高时的温和看多', build: (r, e) => [leg(pickByDelta(r, 'C', .45), 'C', 1), leg(pickByDelta(r, 'C', .20), 'C', -1)] },
  put_spread: { n: '熊市看跌价差 Bear Put Spread', d: '买高卖低认沽，降低成本的温和看空', build: (r, e) => [leg(pickByDelta(r, 'P', .45), 'P', 1), leg(pickByDelta(r, 'P', .20), 'P', -1)] },
  short_put: { n: '卖出认沽 Short Put', d: '看不跌，收时间价值，下方需备足资金准备接货', build: (r, e) => [leg(pickByDelta(r, 'P', .30), 'P', -1)] },
  covered_call: { n: '备兑开仓 Covered Call', d: '持有 10000 份标的＋卖出虚值认购，增强收益、降低持仓成本，放弃大涨空间', build: (r, e, u) => [underLeg(u, 1), leg(pickByDelta(r, 'C', .30), 'C', -1, e.days)] },
  butterfly: { n: '蝶式价差 Butterfly', d: '押注到期价钉在中心行权价附近，成本低、赔率高', build: (r, e) => [leg(pickByDelta(r, 'C', .35), 'C', 1), leg(pickByDelta(r, 'C', .50), 'C', -2), leg(pickByDelta(r, 'C', .65), 'C', 1)] },
  calendar: { n: '日历价差（卖近月买次月）', d: '期限结构倒挂时卖近月、买次月平值认购，赚取近月更快的时间价值衰减', build: (r, e, u) => { const nx = u.expiries.find(x => x.days > e.days); if (!nx) return []; return [leg(pickByDelta(r, 'C', .50), 'C', -1, e.days), leg(pickByDelta(nx.byStrike, 'C', .50), 'C', 1, nx.days)] } },
}
export function buildLegs(u, e, key) {
  const s = STRATEGIES[key]; if (!s) return []
  let legs = []
  try { legs = s.build(e.byStrike, e, u) || [] } catch (err) { return [] }
  legs = legs.filter(l => l && l.px)
  legs.forEach(l => { if (l.t == null) l.t = e.days })
  return legs
}
export function legLabel(l) {
  if (l.type === 'S') return (l.qty > 0 ? '买入' : '卖出') + ' 标的 ' + Math.abs(l.qty) * MULT + ' 份 @' + fmt(l.px, 3)
  return (l.qty > 0 ? '买入' : '卖出') + ' ' + Math.abs(l.qty) + ' 张 ' + (l.type === 'C' ? '认购' : '认沽') + ' ' + fmt(l.K, 3) + ' @' + fmt(l.px, 4)
}
export function legValue(l, s, tEvalDays) {
  if (l.type === 'S') return s
  const rem = (l.t - tEvalDays) / 365
  if (rem <= 1e-6) return l.type === 'C' ? Math.max(0, s - l.K) : Math.max(0, l.K - s)
  return bs(s, l.K, rem, l.iv, l.type)
}
