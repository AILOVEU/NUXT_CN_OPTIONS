<template>
  <div v-if="spot != null && e" class="relative rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="absolute right-3 top-3 z-10 flex gap-1.5">
      <span class="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#8f95a1]">data_etfoption.csv</span>
      <span class="rounded bg-[#e8f5e9] px-1.5 py-0.5 text-[10px] leading-[1.5] text-[#2e7d32]">etf_qianfuquan.csv</span>
    </div>
    <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold">
      <span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>方向信号分解</div>
    <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">正分看多、负分看空；加权后得到方向评分</div>
    <table>
      <thead><tr><th style="text-align: left">信号</th><th>取值</th><th>权重</th><th>得分</th><th style="width: 120px">强度</th></tr></thead>
      <tbody>
        <tr class="sigrow" v-for="(r, i) in dirRows" :key="i">
          <td :title="r.tip">{{ r.n }}</td><td>{{ r.v }}</td><td>{{ (r.w * 100).toFixed(0) }}%</td>
          <td :style="{ color: r.color, fontWeight: 600 }">{{ r.sLabel }}</td>
          <td><div style="display: flex; justify-content: center"><span class="bar" :style="{ width: r.barW + '%', background: r.color }"></span></div></td>
        </tr>
        <tr style="font-weight: 700">
          <td>加权方向评分</td><td colspan="2"></td>
          <td :style="{ color: dirColor }">{{ sign(dirScore.score) }}{{ fmt(dirScore.score, 1) }}</td><td></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fmt, sign, C_UP, C_DN, scoreDir, sigRow } from './lib'

const props = defineProps({
  spot: { type: Number, default: null },
  hv: { type: Object, default: null },
  maxPain: { type: Number, default: null },
  atmIV: { type: Number, default: null },
  rr25: { type: Number, default: null },
  doiPCR: { type: Number, default: null },
  netDelta: { type: Number, default: null },
  totalOI: { type: Number, default: null },
})

const e = computed(() => props.atmIV == null ? null : {
  maxPain: props.maxPain, atmIV: props.atmIV, rr25: props.rr25,
  doiPCR: props.doiPCR, netDelta: props.netDelta, totalOI: props.totalOI,
})

const dirScore = computed(() => {
  if (props.spot == null || !props.hv || !e.value) return { items: [], score: 0 }
  return scoreDir({ spot: props.spot, hv: props.hv }, e.value)
})
const dirRows = computed(() => dirScore.value.items.map(x => sigRow(x, 'dir')))
const dirColor = computed(() => { const s = dirScore.value.score; return s > 0 ? C_UP : s < 0 ? C_DN : '#8f95a1' })
</script>

<style scoped>
table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums }
th { background: #f7f8fa; color: #5f6672; font-weight: 600; padding: 7px 6px; border-bottom: 1px solid #e3e6ea; text-align: right; white-space: nowrap; font-size: 11.5px }
td { padding: 5px 6px; border-bottom: 1px solid #eef0f3; text-align: right; white-space: nowrap }
tbody tr:hover { background: #fafbfd }
.sigrow td:first-child { text-align: left; color: #5f6672 }
.bar { display: inline-block; height: 9px; border-radius: 2px; vertical-align: middle }
</style>
