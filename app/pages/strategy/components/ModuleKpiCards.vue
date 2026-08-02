<template>
  <div v-if="u && u.expiries && u.expiries.length && e" class="grid grid-cols-4 gap-3.5">
    <div v-for="(c,i) in cards" :key="i" class="rounded-[9px] border border-[#e3e6ea] bg-white p-[11px_13px]">
      <div class="text-[11.5px] text-[#8f95a1]">{{ c[0] }}</div>
      <div class="mt-0.5 text-[20px] font-[650] tabular-nums tracking-[-.5px]" :class="c[3]">{{ c[1] }}</div>
      <div class="mt-px text-[11px] text-[#8f95a1]">{{ c[2] }}</div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { fmt, sign, wan, clamp } from './lib'
const props = defineProps({ u: { type: Object, default: null }, e: { type: Object, default: null } })
const cards = computed(() => {
  const u = props.u, e = props.e, h = u.hv || {}
  const exp = u.expiries[u.expiries.length-1]
  const termSlope = (exp.atmIV - e.atmIV) / e.atmIV
  const vrp = e.atmIV - (0.6*(h.rv5||h.hvRV||h.hvPark||0) + 0.4*(h.hvBlend||h.hvPark||0))
  return [
    ['当前价 / MA', fmt(u.spot,3), '距 MA10 ' + sign((u.spot/(h.ma10||u.spot)-1)*100) + fmt((u.spot/(h.ma10||u.spot)-1)*100,1) + '%', 'text-[#1f2329]'],
    ['HV(20) / IV(ATM)', fmt(h.hv20,1) + ' / ' + fmt(e.atmIV,1), 'IV-HV(隐含-实现) ' + sign(vrp) + fmt(vrp,1) + 'pt', vrp>0?'text-[#e02020]':'text-[#12a05c]'],
    ['IV 历史分位', (u.ivPct?fmt(u.ivPct.pct,0):'-') + '%', '近1年 ' + (u.ivPct?u.ivPct.basis:0) + ' 样本', (u.ivPct&&u.ivPct.pct>=75)?'text-[#e02020]':(u.ivPct&&u.ivPct.pct>=50)?'text-[#f5a623]':'text-[#12a05c]'],
    ['期限结构', fmt(e.atmIV,1) + '→' + fmt(exp.atmIV,1), sign(termSlope*100) + fmt(termSlope*100,1) + '%', termSlope>0?'text-[#12a05c]':'text-[#e02020]'],
    ['PCR(持仓/成交)', fmt(e.pcr,2) + ' / ' + fmt(e.volPCR,2), '看跌/看涨比', e.pcr>1?'text-[#12a05c]':'text-[#e02020]'],
    ['ΔPCR', fmt(e.deltaPCR,2), '虚值认沽偏度', 'text-[#1f2329]'],
    ['最大痛点', fmt(e.maxPain,3), '到期引力 ' + sign((e.maxPain/u.spot-1)*100) + fmt((e.maxPain/u.spot-1)*100,1) + '%', 'text-[#1f2329]'],
    ['GEX 净', wan(e.gex) + ' (×1e8)', '零界 ' + fmt(e.zeroG,3), e.gex<0?'text-[#e02020]':'text-[#12a05c]'],
  ]
})
</script>
