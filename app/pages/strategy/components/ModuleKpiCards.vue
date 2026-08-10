<template>
  <div class="relative mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4" v-if="kpiCards.length">
    <div class="absolute right-3 top-3 z-10 flex gap-1.5">
      <span class="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#8f95a1]">data_etfoption.csv</span>
      <span class="rounded bg-[#fef3e2] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#b8860b]">vixs.csv</span>
      <span class="rounded bg-[#e8f5e9] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#2e7d32]">etf_qianfuquan.csv</span>
    </div>
    <div class="grid grid-cols-4 gap-3.5">
    <div v-for="(c, i) in kpiCards" :key="i" class="rounded-[9px] border border-[#e3e6ea] bg-white p-[11px_13px]">
      <div class="flex items-center justify-between text-[11.5px] text-[#8f95a1]"><span>{{ c[0] }}</span></div>
      <div class="mt-0.5 text-[20px] font-[650] tabular-nums tracking-[-.5px]" :style="{color: c[3]==='up'?C_UP:(c[3]==='dn'?C_DN:'')}">{{ c[1] }}</div>
      <div class="mt-px text-[11px] text-[#8f95a1]">{{ c[2] }}</div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fmt, sign, wan, hvFair, C_UP, C_DN } from './lib'

const props = defineProps({
  spot: { type: Number, default: null },
  hv: { type: Object, default: null },
  ivPct: { type: Object, default: null },
  atmIV: { type: Number, default: null },
  atmK: { type: Number, default: null },
  maxPain: { type: Number, default: null },
  oiPCR: { type: Number, default: null },
  callOI: { type: Number, default: null },
  putOI: { type: Number, default: null },
  netGex: { type: Number, default: null },
})

const kpiCards = computed(() => {
  const s = props.spot, h = props.hv || {}, ip = props.ivPct
  if (s == null || props.atmIV == null) return []
  const u = { spot: s, hv: h, ivPct: ip }
  const hf = hvFair(u)
  const vrp = (props.atmIV != null) ? props.atmIV - hf : null
  const mpDev = (s > 0 && props.maxPain != null) ? (props.maxPain / s - 1) * 100 : null
  return [
    ['标的现价', fmt(s, 3), `近17日 ${sign(h.ret17 || 0)}${fmt(h.ret17 || 0, 2)}%`, (h.ret17 || 0) >= 0 ? 'up' : 'dn'],
    ['平值 IV', fmt(props.atmIV, 2), `平值行权价 ${fmt(props.atmK, 3)}`, ''],
    ['IV 历史分位', ip ? fmt(ip.pct, 0) + '%' : '—', ip ? `中位 ${fmt(ip.median, 1)} / 区间 ${fmt(ip.min, 0)}~${fmt(ip.max, 0)}` : '该标的无 IV 历史', ip && ip.pct > 80 ? 'up' : ''],
    ['预期实现波动率', fmt(hf, 2), `近5日RV ${fmt(h.rv5 || 0, 1)} · 17日综合 ${fmt(h.hvBlend || 0, 1)}`, ''],
    ['波动率风险溢价', vrp == null ? '—' : sign(vrp) + fmt(vrp, 2), vrp == null ? '平值 IV 缺失' : (vrp > 0 ? 'IV 贵于实现波动率，利于卖方' : 'IV 低于实现波动率，卖方无安全垫'), vrp == null ? '' : (vrp > 0 ? 'up' : 'dn')],
    ['持仓量 PCR', fmt(props.oiPCR, 2), `认购 ${wan(props.callOI)} / 认沽 ${wan(props.putOI)}`, ''],
    ['最大痛点', fmt(props.maxPain, 3), mpDev == null ? '—' : `偏离现价 ${sign(mpDev)}${fmt(mpDev, 2)}%`, mpDev == null ? '' : (props.maxPain > s ? 'up' : 'dn')],
    ['净 Gamma 敞口', wan(props.netGex), props.netGex > 0 ? '做市商多 Gamma → 抑制波动' : '做市商空 Gamma → 放大波动', props.netGex > 0 ? 'dn' : 'up'],
  ]
})
</script>
