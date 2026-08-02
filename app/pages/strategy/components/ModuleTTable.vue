<template>
  <div v-if="e" class="rounded-[12px] border border-[#e3e6ea] bg-white">
    <div class="flex items-center justify-between border-b border-[#eef0f3] px-3.5 py-2">
      <div class="text-[13px] font-[650] text-[#1f2329]">T 型报价（到期日 {{ e.label }}）</div>
      <div class="text-[11px] text-[#8f95a1]">PCR {{ fmt(e.pcr,2) }} · ΔPCR {{ fmt(e.deltaPCR,2) }} · 最大痛点 {{ fmt(e.maxPain,3) }}</div>
    </div>
    <div class="tw">
      <table class="w-full border-collapse text-[11.5px]">
        <thead>
          <tr class="bg-[#f7f8fa] text-[#5f6672]">
            <th class="px-2 py-1.5">Δ</th><th class="px-2 py-1.5">IV</th><th class="px-2 py-1.5">权利金</th><th class="px-2 py-1.5">ΔOI</th><th class="px-2 py-1.5">OI</th>
            <th class="kcol px-2 py-1.5">行权价</th>
            <th class="px-2 py-1.5">OI</th><th class="px-2 py-1.5">ΔOI</th><th class="px-2 py-1.5">权利金</th><th class="px-2 py-1.5">IV</th><th class="px-2 py-1.5">Δ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r,i) in rows" :key="i" :class="{ atm: r.atm }" class="border-t border-[#f0f2f5]">
            <td class="cside px-2 py-1 text-right tabular-nums">{{ r.cDelta!=null?fmt(r.cDelta,2):'-' }}</td>
            <td class="cside px-2 py-1 text-right tabular-nums">{{ r.cIV!=null?fmt(r.cIV,1):'-' }}</td>
            <td class="cside px-2 py-1 text-right tabular-nums">{{ r.cLast!=null?fmt(r.cLast,4):'-' }}</td>
            <td class="cside px-2 py-1 text-right tabular-nums">{{ r.dcOI!=null?fmt(r.dcOI,0):'-' }}</td>
            <td class="cside px-2 py-1 text-right tabular-nums">{{ r.cOI!=null?fmt(r.cOI,0):'-' }}</td>
            <td class="kcol px-2 py-1 text-center font-[600] tabular-nums">{{ fmt(r.K,3) }}</td>
            <td class="pside px-2 py-1 text-right tabular-nums">{{ r.pOI!=null?fmt(r.pOI,0):'-' }}</td>
            <td class="pside px-2 py-1 text-right tabular-nums">{{ r.dpOI!=null?fmt(r.dpOI,0):'-' }}</td>
            <td class="pside px-2 py-1 text-right tabular-nums">{{ r.pLast!=null?fmt(r.pLast,4):'-' }}</td>
            <td class="pside px-2 py-1 text-right tabular-nums">{{ r.pIV!=null?fmt(r.pIV,1):'-' }}</td>
            <td class="pside px-2 py-1 text-right tabular-nums">{{ r.pDelta!=null?fmt(r.pDelta,2):'-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { fmt } from './lib'
const props = defineProps({ e: { type: Object, default: null } })
const rows = computed(() => props.e.byStrike || [])
</script>
<style scoped>
.tw { overflow: auto; border: 1px solid #e3e6ea; border-radius: 8px }
.kcol { background: #f3f5f8 !important; font-weight: 700; text-align: center }
tr.atm td { background: #fff8e6 }
tr.atm .kcol { background: #ffeec2 !important }
.cside { background: #fefafa }
.pside { background: #f9fdfb }
</style>
