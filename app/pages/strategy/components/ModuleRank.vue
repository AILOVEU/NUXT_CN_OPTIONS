<template>
  <div class="relative mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="absolute right-3 top-3 z-10 flex gap-1.5">
      <span class="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#8f95a1]">data_etfoption.csv</span>
      <span class="rounded bg-[#fef3e2] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#b8860b]">vixs.csv</span>
      <span class="rounded bg-[#e8f5e9] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#2e7d32]">etf_qianfuquan.csv</span>
    </div>
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>六标的策略排行（近月合约）</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">按波动率评分绝对值排序，越靠前越适合执行对应的波动率策略</div>
    <table>
      <thead><tr>
        <th style="text-align: left">标的</th><th>现价</th><th>近17日</th><th>平值IV</th><th>预期HV</th>
        <th>风险溢价</th><th>IV分位</th><th>期限结构</th><th>PCR</th><th>方向分</th><th>波动率分</th>
        <th style="text-align: left">建议策略</th>
      </tr></thead>
      <tbody>
        <tr v-for="r in rankRows" :key="r.u.code" :style="r.u.code === selU ? 'background:#f2f6ff;font-weight:600' : ''">
          <td style="text-align: left">{{ r.u.code === selU ? '▶ ' : '' }}{{ r.u.short }}</td>
          <td>{{ fmt(r.u.spot, 3) }}</td>
          <td :class="((r.u.hv && r.u.hv.ret17) || 0) >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ sign((r.u.hv && r.u.hv.ret17) || 0) }}{{ fmt((r.u.hv && r.u.hv.ret17) || 0, 1) }}%</td>
          <td>{{ fmt(r.e.atmIV, 2) }}</td>
          <td>{{ fmt(r.hf, 2) }}</td>
          <td :class="r.vrp > 0 ? 'text-[#e02020]' : 'text-[#12a05c]'"><b>{{ sign(r.vrp) }}{{ fmt(r.vrp, 2) }}</b></td>
          <td>{{ r.u.ivPct ? fmt(r.u.ivPct.pct, 0) + '%' : '—' }}</td>
          <td :class="r.slope < 0 ? 'text-[#12a05c]' : 'text-[#e02020]'">{{ sign(r.slope * 100) }}{{ fmt(r.slope * 100, 1) }}%</td>
          <td>{{ fmt(r.e.oiPCR, 2) }}</td>
          <td :class="r.d > 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ sign(r.d) }}{{ fmt(r.d, 0) }}</td>
          <td :style="{ color: r.v < 0 ? C_PUR : C_WARN, fontWeight: 700 }">{{ sign(r.v) }}{{ fmt(r.v, 0) }}</td>
          <td style="text-align: left">{{ STRATEGIES[r.vd.key].n }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fmt, sign, C_PUR, C_WARN, hvFair, scoreDir, scoreVol, ctxOf, verdictOf, STRATEGIES } from './lib'

const props = defineProps({
  underlyings: { type: Array, default: () => [] },
  selU: { type: String, default: null },
})

const rankRows = computed(() => {
  return props.underlyings.map((u) => {
    const e = u.expiries && u.expiries[0]
    if (!e) return null
    const far = (u.expiries || []).filter(x => x && x.atmIV != null)
    const farE = far.length ? far[far.length - 1] : null
    const d = scoreDir(u, e).score, v = scoreVol(u, e).score, vd = verdictOf(d, v, ctxOf(u, e))
    const hf = hvFair(u)
    const vrp = (e.atmIV != null) ? e.atmIV - hf : 0
    const slope = (farE && e.atmIV != null) ? (farE.atmIV - e.atmIV) / e.atmIV : 0
    return { u, e, d, v, vd, hf, vrp, slope }
  }).filter(Boolean).sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
})
</script>

<style scoped>
table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums }
th { background: #f7f8fa; color: #5f6672; font-weight: 600; padding: 7px 6px; border-bottom: 1px solid #e3e6ea; text-align: right; white-space: nowrap; font-size: 11.5px }
td { padding: 5px 6px; border-bottom: 1px solid #eef0f3; text-align: right; white-space: nowrap }
tbody tr:hover { background: #fafbfd }
</style>
