<template>
  <div v-if="E" class="mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>T 型报价表</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">左侧认购 / 右侧认沽，黄色行为平值。杠杆＝真实杠杆，Theta 为每张每日时间价值损耗（元）</div>
    <div class="tw">
    <table>
      <thead>
        <tr>
          <th colspan="8" style="text-align: center; background: #fdeeee; color: #e02020">认购 CALL</th>
          <th style="text-align: center; background: #eef0f3">行权价</th>
          <th colspan="8" style="text-align: center; background: #eaf7f1; color: #12a05c">认沽 PUT</th>
        </tr>
        <tr>
          <th>Θ元/日</th><th>Vega</th><th>Γ</th><th>Δ</th><th>杠杆</th><th>日增仓</th><th>持仓量</th><th>最新/IV</th>
          <th class="kcol">K</th>
          <th>最新/IV</th><th>持仓量</th><th>日增仓</th><th>杠杆</th><th>Δ</th><th>Γ</th><th>Vega</th><th>Θ元/日</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in tRows" :key="b.K" :class="{ atm: b.K === E.atmK }">
          <td class="cside">{{ fmt(b.cTheta, 1) }}</td><td class="cside">{{ fmt(b.cVega, 3) }}</td>
          <td class="cside">{{ fmt(b.cGamma, 2) }}</td><td class="cside">{{ fmt(b.cDelta, 3) }}</td>
          <td class="cside">{{ fmt(b.cLev, 1) }}</td>
          <td class="cside" :class="b.cDOI >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ b.cDOI ? sign(b.cDOI) + b.cDOI : '—' }}</td>
          <td class="cside">{{ b.cOI || '—' }}</td>
          <td class="cside"><b :class="b.cChg >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ fmt(b.cLast, 4) }}</b> <span class="text-[#8f95a1]">{{ fmt(b.cIV, 1) }}</span></td>
          <td class="kcol">{{ fmt(b.K, 3) }}</td>
          <td class="pside"><b :class="b.pChg >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ fmt(b.pLast, 4) }}</b> <span class="text-[#8f95a1]">{{ fmt(b.pIV, 1) }}</span></td>
          <td class="pside">{{ b.pOI || '—' }}</td>
          <td class="pside" :class="b.pDOI >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ b.pDOI ? sign(b.pDOI) + b.pDOI : '—' }}</td>
          <td class="pside">{{ fmt(b.pLev, 1) }}</td><td class="pside">{{ fmt(b.pDelta, 3) }}</td>
          <td class="pside">{{ fmt(b.pGamma, 2) }}</td><td class="pside">{{ fmt(b.pVega, 3) }}</td>
          <td class="pside">{{ fmt(b.pTheta, 1) }}</td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fmt, sign } from './lib'

const props = defineProps({
  e: { type: Object, default: null },
})
const E = computed(() => props.e)
const tRows = computed(() => E.value ? E.value.byStrike : [])
</script>

<style scoped>
table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums }
th { background: #f7f8fa; color: #5f6672; font-weight: 600; padding: 7px 6px; border-bottom: 1px solid #e3e6ea; text-align: right; white-space: nowrap; font-size: 11.5px }
td { padding: 5px 6px; border-bottom: 1px solid #eef0f3; text-align: right; white-space: nowrap }
tbody tr:hover { background: #fafbfd }
.kcol { background: #f3f5f8 !important; font-weight: 700; text-align: center }
tr.atm td { background: #fff8e6 }
tr.atm .kcol { background: #ffeec2 !important }
.cside { background: #fefafa }
.pside { background: #f9fdfb }
.tw { overflow: auto; border: 1px solid #e3e6ea; border-radius: 8px }
</style>
