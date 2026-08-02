<template>
  <div class="mt-3.5 grid grid-cols-4 gap-3.5" v-if="kpiCards.length">
    <div v-for="(c, i) in kpiCards" :key="i" class="rounded-[9px] border border-[#e3e6ea] bg-white p-[11px_13px]">
      <div class="flex items-center justify-between text-[11.5px] text-[#8f95a1]"><span>{{ c[0] }}</span></div>
      <div class="mt-0.5 text-[20px] font-[650] tabular-nums tracking-[-.5px]" :style="{color: c[3]==='up'?C_UP:(c[3]==='dn'?C_DN:'')}">{{ c[1] }}</div>
      <div class="mt-px text-[11px] text-[#8f95a1]">{{ c[2] }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fmt, sign, wan, hvFair, C_UP, C_DN } from './lib'

const props = defineProps({
  u: { type: Object, default: null },
  e: { type: Object, default: null },
})
const U = computed(() => props.u)
const E = computed(() => props.e)

const kpiCards = computed(() => {
  const u = U.value, e = E.value; if (!u || !e) return []
  const h = u.hv || {}, hf = hvFair(u)
  const vrp = (e.atmIV != null) ? e.atmIV - hf : null
  const mpDev = (u.spot > 0 && e.maxPain != null) ? (e.maxPain / u.spot - 1) * 100 : null
  return [
    ['标的现价', fmt(u.spot, 3), `近17日 ${sign(h.ret17 || 0)}${fmt(h.ret17 || 0, 2)}%`, (h.ret17 || 0) >= 0 ? 'up' : 'dn'],
    ['平值 IV', fmt(e.atmIV, 2), `平值行权价 ${fmt(e.atmK, 3)}`, ''],
    ['IV 历史分位', u.ivPct ? fmt(u.ivPct.pct, 0) + '%' : '—', u.ivPct ? `中位 ${fmt(u.ivPct.median, 1)} / 区间 ${fmt(u.ivPct.min, 0)}~${fmt(u.ivPct.max, 0)}` : '该标的无 IV 历史', u.ivPct && u.ivPct.pct > 80 ? 'up' : ''],
    ['预期实现波动率', fmt(hf, 2), `近5日RV ${fmt(h.rv5 || 0, 1)} · 17日综合 ${fmt(h.hvBlend || 0, 1)}`, ''],
    ['波动率风险溢价', vrp == null ? '—' : sign(vrp) + fmt(vrp, 2), vrp == null ? '平值 IV 缺失' : (vrp > 0 ? 'IV 贵于实现波动率，利于卖方' : 'IV 低于实现波动率，卖方无安全垫'), vrp == null ? '' : (vrp > 0 ? 'up' : 'dn')],
    ['持仓量 PCR', fmt(e.oiPCR, 2), `认购 ${wan(e.callOI)} / 认沽 ${wan(e.putOI)}`, ''],
    ['最大痛点', fmt(e.maxPain, 3), mpDev == null ? '—' : `偏离现价 ${sign(mpDev)}${fmt(mpDev, 2)}%`, mpDev == null ? '' : (e.maxPain > u.spot ? 'up' : 'dn')],
    ['净 Gamma 敞口', wan(e.netGex), e.netGex > 0 ? '做市商多 Gamma → 抑制波动' : '做市商空 Gamma → 放大波动', e.netGex > 0 ? 'dn' : 'up'],
  ]
})
</script>
