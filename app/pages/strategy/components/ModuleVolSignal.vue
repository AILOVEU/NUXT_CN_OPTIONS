<template>
  <div v-if="U && E" class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold">
      <span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>波动率信号分解
    </div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">负分＝卖波动率占优，正分＝买波动率占优</div>
    <table>
      <thead><tr><th style="text-align: left">信号</th><th>取值</th><th>权重</th><th>得分</th><th style="width: 120px">强度</th></tr></thead>
      <tbody>
        <tr class="sigrow" v-for="(r, i) in volRows" :key="i">
          <td :title="r.tip">{{ r.n }}</td><td>{{ r.v }}</td><td>{{ (r.w * 100).toFixed(0) }}%</td>
          <td :style="{ color: r.color, fontWeight: 600 }">{{ r.sLabel }}</td>
          <td><div style="display: flex; justify-content: center"><span class="bar" :style="{ width: r.barW + '%', background: r.color }"></span></div></td>
        </tr>
        <tr style="font-weight: 700">
          <td>加权波动率评分</td><td colspan="2"></td>
          <td :style="{ color: volColor }">{{ sign(volScore.score) }}{{ fmt(volScore.score, 1) }}</td><td></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fmt, sign, C_PUR, C_WARN, scoreVol, sigRow } from './lib'

const props = defineProps({
  u: { type: Object, default: null },
  e: { type: Object, default: null },
})
const U = computed(() => props.u)
const E = computed(() => props.e)

const volScore = computed(() => (U.value && E.value) ? scoreVol(U.value, E.value) : { items: [], score: 0 })
const volRows = computed(() => volScore.value.items.map(x => sigRow(x, 'vol')))
const volColor = computed(() => { const s = volScore.value.score; return s < 0 ? C_PUR : C_WARN })
</script>

<style scoped>
table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums }
th { background: #f7f8fa; color: #5f6672; font-weight: 600; padding: 7px 6px; border-bottom: 1px solid #e3e6ea; text-align: right; white-space: nowrap; font-size: 11.5px }
td { padding: 5px 6px; border-bottom: 1px solid #eef0f3; text-align: right; white-space: nowrap }
tbody tr:hover { background: #fafbfd }
.sigrow td:first-child { text-align: left; color: #5f6672 }
.bar { display: inline-block; height: 9px; border-radius: 2px; vertical-align: middle }
</style>
