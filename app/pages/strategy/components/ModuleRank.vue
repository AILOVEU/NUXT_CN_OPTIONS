<template>
  <div class="rounded-[12px] border border-[#e3e6ea] bg-white">
    <div class="flex items-center justify-between border-b border-[#eef0f3] px-3.5 py-2">
      <div class="text-[13px] font-[650] text-[#1f2329]">六标的策略排行（按综合评分）</div>
      <div class="text-[11px] text-[#8f95a1]">评分＝方向·波动率加权（越红越偏多/做多波动）</div>
    </div>
    <table class="w-full text-[12px]">
      <thead>
        <tr class="text-[11px] text-[#8f95a1]">
          <th class="px-3 py-1.5 text-left font-[500]">标的</th>
          <th class="px-3 py-1.5 text-center font-[500]">方向评分</th>
          <th class="px-3 py-1.5 text-center font-[500]">波动评分</th>
          <th class="px-3 py-1.5 text-center font-[500]">综合</th>
          <th class="px-3 py-1.5 text-left font-[500]">首选策略</th>
          <th class="px-3 py-1.5 text-center font-[500]">IV分位</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r,i) in rows" :key="i" class="border-t border-[#f3f4f6]">
          <td class="px-3 py-1.5 font-[600] text-[#1f2329]">{{ r.NAME }}</td>
          <td class="px-3 py-1.5 text-center font-[600] tabular-nums" :class="r.dir>0?'text-[#e02020]':'text-[#12a05c]'">{{ sign(r.dir) }}{{ fmt(r.dir,0) }}</td>
          <td class="px-3 py-1.5 text-center font-[600] tabular-nums" :class="r.vol<0?'text-[#7a5af8]':'text-[#f5a623]'">{{ sign(r.vol) }}{{ fmt(r.vol,0) }}</td>
          <td class="px-3 py-1.5 text-center font-[700] tabular-nums text-[#1f2329]">{{ fmt(r.composite,0) }}</td>
          <td class="px-3 py-1.5 text-[#5f6672]">{{ r.strategy }}</td>
          <td class="px-3 py-1.5 text-center tabular-nums" :class="r.pct>=75?'text-[#e02020]':r.pct>=50?'text-[#f5a623]':'text-[#12a05c]'">{{ fmt(r.pct,0) }}%</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { scoreDir, scoreVol, verdictOf, STRATEGIES, clamp, fmt, sign } from './lib'
const props = defineProps({ underlyings: { type: Array, default: () => [] } })
const rows = computed(() => {
  return (props.underlyings || [])
    .filter(u => u && u.expiries && u.expiries.length)
    .map(u => {
      const e = u.expiries[0]
      const d = scoreDir(u, e).score, v = scoreVol(u, e).score
      const composite = clamp(0.55 * d + 0.45 * v, -100, 100)
      const key = verdictOf(d, v, {}).key
      return { NAME: u.NAME, dir: d, vol: v, composite, strategy: STRATEGIES[key] ? STRATEGIES[key].n : key, pct: u.ivPct ? u.ivPct.pct : 0 }
    })
    .sort((a, b) => b.composite - a.composite)
})
</script>
