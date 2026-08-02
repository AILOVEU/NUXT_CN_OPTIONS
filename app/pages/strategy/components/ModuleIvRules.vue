<template>
  <ChartCard title="隐波规律总结（基于 vixs.csv 价格序列动态计算 HV）" :desc="descText">
    <div v-if="r.loading" class="py-4 text-center text-[12px] text-[#8f95a1]">计算中…</div>
    <div v-else-if="!r.monthlySvg || !r.yearlySvg" class="py-4 text-center text-[12px] text-[#8f95a1]">样本不足（需 ≥30 个交易日历史 IV），暂无法生成规律{{ r.code ? '（' + r.code + '）' : '' }}。</div>
    <div v-else>
      <div class="mb-2 grid grid-cols-6 gap-1.5">
        <div v-for="(k,i) in kpis" :key="i" class="rounded-[7px] border border-[#e3e6ea] bg-white px-2 py-1.5">
          <div class="text-[10.5px] text-[#8f95a1]">{{ k[0] }}</div>
          <div class="mt-px text-[14px] font-[650] tabular-nums" :class="k[3]">{{ k[1] }}</div>
          <div class="text-[10px] text-[#8f95a1]">{{ k[2] }}</div>
        </div>
      </div>
      <div class="mb-1 text-[12px] font-[600] text-[#1f2329]">月度年化 HV 序列（红虚线＝全样本均值，可观察均值回复 / 季节性 / 波动聚集）</div>
      <svg class="w-full rounded-[8px] border border-[#e3e6ea] bg-white" :viewBox="r.monthlySvg.viewBox" preserveAspectRatio="xMidYMid meet">{{ r.monthlySvg.svg }}</svg>
      <div class="mb-1 mt-2 text-[12px] font-[600] text-[#1f2329]">年度平均 HV（红≥70 / 橙≥40 / 绿＜40）</div>
      <svg class="w-full rounded-[8px] border border-[#e3e6ea] bg-white" :viewBox="r.yearlySvg.viewBox" preserveAspectRatio="xMidYMid meet">{{ r.yearlySvg.svg }}</svg>
      <ul class="iv-list mt-2.5 space-y-1.5">
        <li v-for="(t,i) in rules" :key="i"><span class="iv-dot" :class="'iv-dot-'+(i%3)"></span>{{ t }}</li>
      </ul>
      <div class="iv-method mt-2 rounded-[7px] border border-dashed border-[#dfe3e8] px-2.5 py-1.5 text-[11px] text-[#8f95a1]">
        计算方法：取 vixs.csv 中该标的历史收盘（缺失则回退到期权隐含 IV 序列）→ 对数收益 → 日 HV＝|收益|×√242 → 滚动分位/ACF/月度与年度聚合。HV 以“已实现”口径计算，与期权 IV 无直接关系，仅作绝对水平与规律参考。
      </div>
    </div>
  </ChartCard>
</template>
<script setup>
import { computed } from 'vue'
import ChartCard from './ChartCard.vue'
import { computeIVRules, fmt, clamp } from './lib'
const props = defineProps({ ivHistStore: { type: Object, default: () => ({}) }, selU: { type: String, default: '' } })
const r = computed(() => computeIVRules(props.ivHistStore, props.selU))
const descText = computed(() => r.value.loading ? '基于 vixs.csv 动态计算' : `标的 ${r.value.code}｜样本 ${r.value.nDays} 个交易日`)
const kpis = computed(() => {
  const k = r.value.kpi || {}
  return [
    ['当前 HV(均值)', fmt(k.meanHV,1), '日序列均值', k.meanHV>=70?'text-[#e02020]':k.meanHV>=40?'text-[#f5a623]':'text-[#12a05c]'],
    ['中位 HV', fmt(k.medHV,1), '样本中位数', 'text-[#1f2329]'],
    ['自相关 L1', fmt(k.lag1,2), '波动聚集', k.lag1>0.5?'text-[#e02020]':'text-[#1f2329]'],
    ['L5 / L20', fmt(k.lag5,2)+' / '+fmt(k.lag20,2), '中期记忆', 'text-[#1f2329]'],
    ['月度 φ(滞后1)', fmt(k.phi,2), '均值回复速度', k.phi<0.8?'text-[#12a05c]':'text-[#e02020]'],
    ['半衰期(月)', fmt(k.halfLife,1), '回复一半所需', 'text-[#1f2329]'],
  ]
})
const rules = computed(() => {
  const k = r.value.kpi || {}, d = r.value.dist || {}
  const f = (v) => v==null?null:fmt(v,1)
  return [
    `当前实现波动率约 ${fmt(k.meanHV,1)}%（中位 ${fmt(k.medHV,1)}%），处于近3年【${d.p50!=null?fmt(d.p50,0):'-'}】分位附近——${k.meanHV>=50?'处于偏高区，适合卖波动率':'处于中低位，卖波动率安全垫偏薄'}。`,
    `波动聚集明显：日收益绝对值的自相关 L1=${fmt(k.lag1,2)}、L5=${fmt(k.lag5,2)}、L20=${fmt(k.lag20,2)}——${k.lag1>0.5?'高波动后大概率延续高波动，趋势行情中不宜逆势抄底波动率':'记忆性较弱，波动更接近随机'}。`,
    `月度 HV 序列的一阶自相关 φ=${fmt(k.phi,2)}，约 ${fmt(k.halfLife,1)} 个月回复到长期均值一半——${k.phi<0.8?'均值回复较快，HV 偏离均值后会被较快拉回，利于“卖高买低”':'回复慢，HV 易在高位黏滞'}。`,
    `样本内最大单日冲击（前 30 大涨跌日均值）约 ${fmt(k.topRet,1)}%——做卖权对冲需预留至少该量级尾部空间。`,
    `上涨月份平均 HV=${fmt(k.upHV,1)}% vs 下跌月份 ${fmt(k.dnHV,1)}%——${k.upHV>k.dnHV?'该标的“涨时更波动”（杠杆/情绪驱动），下跌反而相对平稳，与典型权益相反，卖购需更谨慎':'下跌伴随更高波动，恐慌盘明显'}。`,
    `HV 分布：P10=${f(d.p10)} / P25=${f(d.p25)} / P50=${f(d.p50)} / P75=${f(d.p75)} / P90=${f(d.p90)} / P99=${f(d.p99)}%——卖波动率建议选 HV 高于 P75(${f(d.p75)}%) 时段，买突破则等 HV 跌至 P25(${f(d.p25)}%) 以下。`,
    `季节性：参考年度柱状图，HV 高峰多在【${peakYears.value}】——这些年份前后倾向高波动环境，事件驱动型卖权需提防。`,
  ]
})
const peakYears = computed(() => {
  const m = r.value.monthlySvg; if (!m) return ''
  return ''
})
</script>
<style scoped>
.iv-list { list-style: none; padding: 0; font-size: 11.5px; color: #5f6672; line-height: 1.5 }
.iv-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 7px; vertical-align: middle }
.iv-dot-0 { background: #e02020 }.iv-dot-1 { background: #7a5af8 }.iv-dot-2 { background: #2f6feb }
.iv-method { background: #fafbfc }
</style>
