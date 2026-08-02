<template>
  <div class="rounded-[12px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-2 text-[14px] font-[700] text-[#1f2329]">指标口径与风险提示</div>
    <div class="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11.5px] leading-relaxed text-[#5f6672]">
      <div v-for="(t,i) in items" :key="i">· {{ t }}</div>
    </div>
    <div class="mt-3 rounded-[8px] border border-dashed border-[#dfe3e8] bg-[#fafbfc] px-3 py-2 text-[11px] text-[#8f95a1]">
      风险提示：本页所有信号均基于公开期权与价格数据自动计算，仅供研究与学习，不构成任何投资建议。期权具有杠杆与到期归零风险，请结合自身风险承受能力谨慎决策。
    </div>
  </div>
</template>
<script setup>
const items = [
  'HV：基于日对数收益的已实现波动率（年化＝σ×√242），含 rv5/hv20/hv60 等窗口。',
  'IV 分位：将该标的近1年每日 ATM IV 排序后的历史分位（样本量见卡片标注）。',
  '期限结构斜率：（远月 ATM IV − 近月 ATM IV）/ 近月 ATM IV，倒挂(负)代表近月更贵。',
  'PCR：认沽/认购成交量或持仓量之比；ΔPCR 为虚值期权 delta 加权偏度。',
  '最大痛点：使全体期权卖方理论亏损最小的行权价，常被视作到期引力位。',
  'GEX：按 Black-Scholes 计算的 Gamma 美元暴露，零界点附近常形成支撑/阻力。',
  '评分引擎：方向/波动率各由 5 个维度加权合成，权重与判读见对应分解表。',
  '策略回测未含交易成本与滑点；实际建仓请以券商报价与保证金规则为准。',
]
</script>
