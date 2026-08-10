<template>
  <div v-if="verdictObj" class="relative mb-3.5 overflow-hidden rounded-[12px] border border-[#e3e6ea]"
     style="background:linear-gradient(135deg,#fff 0%,#fbfcfe 100%)">
    <div class="absolute right-3 top-3 z-10 flex gap-1.5">
      <span class="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#8f95a1]">data_etfoption.csv</span>
      <span class="rounded bg-[#fef3e2] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#b8860b]">vixs.csv</span>
      <span class="rounded bg-[#e8f5e9] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#2e7d32]">etf_qianfuquan.csv</span>
    </div>
    <div class="flex flex-wrap border-b border-[#eef0f3]">
      <div class="min-w-[180px] flex-1 border-r border-[#eef0f3] p-[16px_18px]">
        <div class="mb-1 text-[11.5px] text-[#8f95a1]">方向评分</div>
        <div class="text-[26px] font-bold tracking-[-1px]" :style="{ color: dirColor }">{{ sign(dirScore.score) }}{{ fmt(dirScore.score, 0) }}</div>
        <div class="mt-0.5 text-[12.5px] font-semibold" :style="{ color: dirColor }">{{ verdictObj.vd.D }}</div>
        <div class="relative mt-2.5 h-1.5 overflow-hidden rounded bg-[#eef0f3]">
          <i class="absolute top-0 h-full rounded" :style="{ left: dirMeter.left + '%', width: dirMeter.w + '%', background: dirColor }"></i>
        </div>
        <div class="mt-1.5 text-[11.5px] leading-[1.7] text-[#8f95a1]">－100 极空 ｜ 0 中性 ｜ +100 极多</div>
      </div>
      <div class="min-w-[180px] flex-1 border-r border-[#eef0f3] p-[16px_18px]">
        <div class="mb-1 text-[11.5px] text-[#8f95a1]">波动率评分</div>
        <div class="text-[26px] font-bold tracking-[-1px]" :style="{ color: volColor }">{{ sign(volScore.score) }}{{ fmt(volScore.score, 0) }}</div>
        <div class="mt-0.5 text-[12.5px] font-semibold" :style="{ color: volColor }">{{ verdictObj.vd.V }}</div>
        <div class="relative mt-2.5 h-1.5 overflow-hidden rounded bg-[#eef0f3]">
          <i class="absolute top-0 h-full rounded" :style="{ left: volMeter.left + '%', width: volMeter.w + '%', background: volColor }"></i>
        </div>
        <div class="mt-1.5 text-[11.5px] leading-[1.7] text-[#8f95a1]">－100 卖波动率 ｜ 0 中性 ｜ +100 买波动率</div>
      </div>
      <div class="min-w-[200px] flex-[1.6] p-[16px_18px]">
        <div class="mb-1 text-[11.5px] text-[#8f95a1]">核心判断</div>
        <div class="mt-0.5 text-[13px] leading-[1.75]">
          IV 历史分位 <b class="font-semibold">{{ ivPct ? fmt(ivPct.pct, 0) + '%' : '—' }}</b>，
          当前 ATM IV <b class="font-semibold">{{ fmt(e.atmIV, 2) }}</b> vs 预期实现波动率 <b class="font-semibold">{{ fmt(verdictObj.hf, 2) }}</b>，
          风险溢价 <b :style="{ color: (verdictObj.vrp == null || verdictObj.vrp > 0) ? C_UP : C_DN }">{{ verdictObj.vrp == null ? '—（平值 IV 缺失）' : sign(verdictObj.vrp) + fmt(verdictObj.vrp, 2) }}</b> 点；
          期限结构 <b class="font-semibold">{{ (e.atmIV == null || verdictObj.far.atmIV == null) ? '数据不足' : (verdictObj.far.atmIV < e.atmIV ? '倒挂' : '正向') }}</b>（{{ fmt(e.atmIV, 1) }}→{{ fmt(verdictObj.far.atmIV, 1) }}）；
          实现波动率近5日较17日 <b :style="{ color: ((hv && hv.rvTrend) || 0) < 0 ? C_DN : C_UP }">{{ sign(((hv && hv.rvTrend) || 0) * 100) }}{{ fmt(((hv && hv.rvTrend) || 0) * 100, 1) }}%</b>。
        </div>
      </div>
    </div>
    <div class="p-[16px_18px]">
      <div class="mb-2 flex gap-2.5 rounded-[9px] border border-[#eef0f3] bg-[#f8f9fb] p-[11px_13px]">
        <div class="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px] bg-[#2f6feb] text-[11.5px] font-bold text-white">1</div>
        <div>
          <div class="text-[13px] font-semibold">首选：{{ STRATEGIES[verdictObj.vd.key].n }}</div>
          <div class="mt-0.5 text-[12px] text-[#5f6672]">{{ STRATEGIES[verdictObj.vd.key].d }}</div>
          <div class="mt-1 text-[12px] text-[#2f6feb]">建议腿：{{ verdictObj.legs1.map(legLabel).join('　｜　') }}</div>
        </div>
      </div>
      <div class="mb-2 flex gap-2.5 rounded-[9px] border border-[#eef0f3] bg-[#f8f9fb] p-[11px_13px]">
        <div class="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px] bg-[#8f95a1] text-[11.5px] font-bold text-white">2</div>
        <div>
          <div class="text-[13px] font-semibold">备选：{{ STRATEGIES[verdictObj.vd.alt].n }}</div>
          <div class="mt-0.5 text-[12px] text-[#5f6672]">{{ STRATEGIES[verdictObj.vd.alt].d }}</div>
        </div>
      </div>
      <div v-if="verdictObj.vd.caution" class="flex gap-2.5 rounded-[9px] border border-[#f6e2bd] p-[11px_13px]" style="background:#fffaf0">
        <div class="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px] bg-[#f5a623] text-[11.5px] font-bold text-white">!</div>
        <div>
          <div class="text-[13px] font-semibold">执行提醒</div>
          <div class="mt-0.5 text-[12px] text-[#5f6672]">{{ verdictObj.vd.caution }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fmt, sign, C_UP, C_DN, C_PUR, C_WARN, hvFair, scoreDir, scoreVol, ctxOf, verdictOf, buildLegs, legLabel, STRATEGIES } from './lib'

const props = defineProps({
  spot: { type: Number, default: null },
  hv: { type: Object, default: null },
  ivPct: { type: Object, default: null },
  expiries: { type: Array, default: null },
  atmIV: { type: Number, default: null },
  days: { type: Number, default: null },
  byStrike: { type: Array, default: null },
  maxPain: { type: Number, default: null },
  rr25: { type: Number, default: null },
  doiPCR: { type: Number, default: null },
  netDelta: { type: Number, default: null },
  totalOI: { type: Number, default: null },
})
const u = computed(() => ({ spot: props.spot, hv: props.hv || {}, ivPct: props.ivPct, expiries: props.expiries || [] }))
const e = computed(() => props.byStrike ? {
  atmIV: props.atmIV, days: props.days, byStrike: props.byStrike,
  maxPain: props.maxPain, rr25: props.rr25, doiPCR: props.doiPCR,
  netDelta: props.netDelta, totalOI: props.totalOI,
} : null)

const dirScore = computed(() => (props.spot != null && e.value) ? scoreDir(u.value, e.value) : { items: [], score: 0 })
const volScore = computed(() => (props.spot != null && e.value) ? scoreVol(u.value, e.value) : { items: [], score: 0 })
const verdictObj = computed(() => {
  if (props.spot == null || !e.value) return null
  const ctx = ctxOf(u.value, e.value)
  const vd = verdictOf(dirScore.value.score, volScore.value.score, ctx)
  const hf = hvFair(u.value)
  const vrp = (e.value.atmIV != null) ? e.value.atmIV - hf : null
  const exps = (props.expiries || []).filter(x => x && x.atmIV != null)
  const far = exps.length ? exps[exps.length - 1] : e.value
  const legs1 = buildLegs(u.value, e.value, vd.key)
  return { vd, hf, vrp, far, legs1, dirScore: dirScore.value.score, volScore: volScore.value.score }
})
const dirColor = computed(() => { const s = dirScore.value.score; return s > 0 ? C_UP : s < 0 ? C_DN : '#8f95a1' })
const volColor = computed(() => { const s = volScore.value.score; return s < 0 ? C_PUR : C_WARN })
const dirMeter = computed(() => { const v = dirScore.value.score; return { w: Math.abs(v) / 2, left: v >= 0 ? 50 : 50 - Math.abs(v) / 2 } })
const volMeter = computed(() => { const v = volScore.value.score; return { w: Math.abs(v) / 2, left: v >= 0 ? 50 : 50 - Math.abs(v) / 2 } })
</script>
