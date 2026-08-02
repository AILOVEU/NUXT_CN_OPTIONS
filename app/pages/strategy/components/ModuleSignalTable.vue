<template>
  <div v-if="u && e" class="rounded-[12px] border border-[#e3e6ea] bg-white">
    <div class="flex items-center justify-between border-b border-[#eef0f3] px-3.5 py-2">
      <div class="text-[13px] font-[650] text-[#1f2329]">{{ title }}</div>
      <div class="text-[11px] text-[#8f95a1]">综合评分 <span class="font-[700]" :class="score>0?'text-[#e02020]':score<0?'text-[#12a05c]':'text-[#5f6672]'">{{ sign(score) }}{{ fmt(score,0) }}</span></div>
    </div>
    <table class="w-full text-[12px]">
      <thead>
        <tr class="text-[11px] text-[#8f95a1]">
          <th class="px-3 py-1.5 text-left font-[500]">维度</th>
          <th class="px-3 py-1.5 text-left font-[500]">当前读数</th>
          <th class="px-3 py-1.5 text-left font-[500]">权重</th>
          <th class="px-3 py-1.5 text-left font-[500]">贡献</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(x,i) in rows" :key="i" class="sigrow border-t border-[#f3f4f6]">
          <td class="px-3 py-1.5">{{ x.n }}<span class="ml-1 cursor-help text-[#b8bdc7]" :title="x.tip">?</span></td>
          <td class="px-3 py-1.5 tabular-nums">{{ x.v }}</td>
          <td class="px-3 py-1.5 tabular-nums">{{ fmt(x.w*100,0) }}%</td>
          <td class="px-3 py-1.5"><div class="flex items-center gap-1.5">
            <span class="bar" :style="{width: x.barW+'%', background: x.color}"></span>
            <span class="tabular-nums" :style="{color: x.color}">{{ x.sLabel }}</span>
          </div></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { scoreDir, scoreVol, sigRow, sign, fmt } from './lib'
const props = defineProps({
  kind: { type: String, required: true }, // 'dir' | 'vol'
  u: { type: Object, default: null },
  e: { type: Object, default: null },
})
const title = computed(() => props.kind === 'dir' ? '方向信号分解' : '波动率信号分解')
const rows = computed(() => {
  const sc = props.kind === 'dir' ? scoreDir(props.u, props.e) : scoreVol(props.u, props.e)
  return sc.items.map(x => sigRow(x, props.kind))
})
const score = computed(() => {
  const sc = props.kind === 'dir' ? scoreDir(props.u, props.e) : scoreVol(props.u, props.e)
  return sc.score
})
</script>
<style scoped>
.sigrow td:first-child { text-align: left; color: #5f6672 }
.bar { display: inline-block; height: 9px; border-radius: 2px; vertical-align: middle }
</style>
