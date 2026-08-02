<template>
  <div class="mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
    <div class="mb-2 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#8f95a1]"></span>指标口径与风险提示</div>
    <div class="text-[11.5px] leading-[1.7] text-[#8f95a1]">
      <div class="grid grid-cols-2 gap-[18px]">
        <div>
          <b class="text-[#5f6672]">波动率口径</b><br />
          · <b class="text-[#5f6672]">预期实现波动率</b> = 0.6 × 近5日已实现波动率 + 0.4 × 综合HV（Parkinson 50% / 收盘 20%），当前 {{ fmt(hf, 2) }}。<br />
          · <b class="text-[#5f6672]">VRP</b> = 平值 IV － 预期实现波动率。为正说明期权卖方收到的溢价高于标的实际波动，是卖波动率的安全垫。<br />
          · <b class="text-[#5f6672]">IV 历史分位</b> 取自 vixs.csv 近 3 年分布（序列截至 {{ maxVixDate || '—' }}）。<br />
          · <b class="text-[#5f6672]">波动率锥</b> 用标的日线（截至 {{ maxTradeDate || '—' }}）近 3 年滚动 HV 的分位数绘制。<br /><br />
          <b class="text-[#5f6672]">希腊字母口径</b><br />
          · Vega 为 IV 变动 100% 的价格变化，图表中 <b class="text-[#5f6672]">Vega×100</b> 即 IV 每上升 1 个点每张合约的盈亏（元）。<br />
          · Theta 原始值为年化，表中已换算为 <b class="text-[#5f6672]">每张每日</b>（÷365×10000）。<br />
          · Gamma 为标的每变动 1 元 Delta 的变化量。
        </div>
        <div>
          <b class="text-[#5f6672]">结构指标</b><br />
          · <b class="text-[#5f6672]">最大痛点</b>：使全体期权买方到期总内在价值最小的行权价，常被视为到期日的“引力位”。<br />
          · <b class="text-[#5f6672]">GEX</b>：Σ(Γ<sub>认购</sub>×持仓 － Γ<sub>认沽</sub>×持仓)×10000×S²×1%，采用“做市商多认购、空认沽”的常规假设。<br />
          · <b class="text-[#5f6672]">25Δ 风险逆转</b>：|Δ|=0.25 处认购 IV － 认沽 IV，用 Delta 线性插值得到。股指期权常态在 ATM 的 −10% 左右。<br /><br />
          <b style="color: #e02020">风险提示</b><br />
          本页所有评分为基于单日快照的量化打分，不构成投资建议。缺失历史数据的标的，相关波动率图表会显示“无历史数据”。卖出波动率策略存在无限风险，务必使用价差结构或严格止损。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fmt, hvFair } from './lib'

const props = defineProps({
  u: { type: Object, default: null },
  maxVixDate: { type: String, default: '' },
  maxTradeDate: { type: String, default: '' },
})
const hf = computed(() => props.u ? hvFair(props.u) : 0)
</script>
