<template>
  <div v-if="u && e" class="rounded-[12px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-1.5 flex items-center justify-between">
      <div class="text-[15px] font-[700] text-[#1f2329]">结论与推荐策略</div>
      <div class="text-[11px] text-[#8f95a1]">{{ u.NAME }} · {{ e.label }}</div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-[9px] border border-[#eef0f3] bg-[#fafbfc] p-3">
        <div class="flex items-center justify-between">
          <span class="text-[12px] text-[#8f95a1]">方向评分</span>
          <span class="text-[18px] font-[700] tabular-nums" :class="dir.s>0?'text-[#e02020]':'text-[#12a05c]'">{{ sign(dir.s) }}{{ fmt(dir.s,0) }}</span>
        </div>
        <div class="mt-1 font-[650] text-[#1f2329]">{{ dir.D }}</div>
        <div class="mt-1 h-[6px] w-full rounded bg-[#eef0f3]"><div class="h-full rounded" :class="dir.s>0?'bg-[#e02020]':'bg-[#12a05c]'" :style="{width: Math.abs(dir.s)/2+'%'}"></div></div>
        <div class="mt-1 text-[10.5px] text-[#8f95a1]">{{ dir.tip }}</div>
      </div>
      <div class="rounded-[9px] border border-[#eef0f3] bg-[#fafbfc] p-3">
        <div class="flex items-center justify-between">
          <span class="text-[12px] text-[#8f95a1]">波动率评分</span>
          <span class="text-[18px] font-[700] tabular-nums" :class="vol.s<0?'text-[#7a5af8]':'text-[#f5a623]'">{{ sign(vol.s) }}{{ fmt(vol.s,0) }}</span>
        </div>
        <div class="mt-1 font-[650] text-[#1f2329]">{{ vol.V }}</div>
        <div class="mt-1 h-[6px] w-full rounded bg-[#eef0f3]"><div class="h-full rounded" :class="vol.s<0?'bg-[#7a5af8]':'bg-[#f5a623]'" :style="{width: Math.abs(vol.s)/2+'%'}"></div></div>
        <div class="mt-1 text-[10.5px] text-[#8f95a1]">{{ vol.tip }}</div>
      </div>
    </div>
    <div class="mt-3 rounded-[9px] border-l-[3px] border-[#2f6feb] bg-[#f5f8ff] px-3 py-2 text-[12.5px] text-[#1f2329]">
      <span class="font-[700]">核心判断：</span>{{ verdict.D }} · {{ verdict.V }}
    </div>
    <div class="mt-3 grid grid-cols-3 gap-3">
      <div class="rounded-[9px] border border-[#e3e6ea] bg-white p-3">
        <div class="text-[11px] text-[#8f95a1]">首选策略</div>
        <div class="mt-1 text-[14px] font-[700] text-[#1f2329]">{{ strategies[verdict.key] ? strategies[verdict.key].n : verdict.key }}</div>
        <div class="mt-1 text-[11px] leading-snug text-[#5f6672]">{{ strategies[verdict.key] ? strategies[verdict.key].d : '' }}</div>
      </div>
      <div class="rounded-[9px] border border-[#e3e6ea] bg-white p-3">
        <div class="text-[11px] text-[#8f95a1]">备选策略</div>
        <div class="mt-1 text-[14px] font-[700] text-[#1f2329]">{{ strategies[verdict.alt] ? strategies[verdict.alt].n : verdict.alt }}</div>
        <div class="mt-1 text-[11px] leading-snug text-[#5f6672]">{{ strategies[verdict.alt] ? strategies[verdict.alt].d : '' }}</div>
      </div>
      <div class="rounded-[9px] border border-[#fdecec] bg-[#fff8f8] p-3">
        <div class="text-[11px] text-[#cf3a3a]">提醒</div>
        <div class="mt-1 text-[11.5px] leading-snug text-[#5f6672]">{{ verdict.caution || '—' }}</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { scoreDir, scoreVol, ctxOf, verdictOf, sign, fmt, STRATEGIES } from './lib'
const props = defineProps({
  u: { type: Object, default: null },
  e: { type: Object, default: null },
})
const dir = computed(() => {
  const s = scoreDir(props.u, props.e)
  const label = s.score > 45 ? '偏多' : s.score > 18 ? '略偏多' : s.score < -45 ? '偏空' : s.score < -18 ? '略偏空' : '中性'
  return { s: s.score, D: label, tip: s.items[0].t }
})
const vol = computed(() => { const s = scoreVol(props.u, props.e); return { s: s.score, V: s.score < -45 ? '强烈做空波动率' : s.score < -18 ? '做空波动率' : s.score > 45 ? '强烈做多波动率' : s.score > 18 ? '做多波动率' : '波动率中性', tip: s.items[0].t } })
const verdict = computed(() => verdictOf(dir.value.s, vol.value.s, ctxOf(props.u, props.e)))
const strategies = STRATEGIES
</script>
