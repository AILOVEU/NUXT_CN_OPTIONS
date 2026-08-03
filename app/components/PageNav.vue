<template>
  <div
    class="fixed z-50 flex flex-col rounded-xl border border-[#e5e8ef] bg-white/95 shadow-lg backdrop-blur-sm transition-all duration-200"
    :class="collapsed ? 'w-10 h-10 items-center justify-center' : 'w-[220px]'"
    style="bottom: 24px; left: 24px"
  >
    <!-- 折叠按钮 -->
    <button
      v-if="collapsed"
      class="flex h-full w-full items-center justify-center text-[#5f6672] hover:text-[#2f6feb]"
      @click="collapsed = false"
      title="展开导航"
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>

    <template v-else>
      <!-- 标题栏 -->
      <div class="flex items-center justify-between px-3.5 py-2.5 border-b border-[#f0f2f5]">
        <span class="text-[11.5px] font-semibold text-[#3a3f47] tracking-[.2px]">页面导航</span>
        <button class="text-[#8f95a1] hover:text-[#5f6672]" @click="collapsed = true" title="收起">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- 导航列表 -->
      <div class="max-h-[50vh] overflow-y-auto px-1.5 py-1.5">
        <div v-for="(section, si) in sections" :key="si">
          <!-- 一级：区块标题 -->
          <div
            class="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-[11.5px] font-medium transition-colors"
            :class="expandedSections[si] ? 'text-[#2f6feb] bg-[#f0f4ff]' : 'text-[#3a3f47] hover:bg-[#f6f7f9]'"
            @click="toggleSection(si)"
          >
            <svg class="h-3 w-3 flex-none transition-transform" :class="expandedSections[si] ? 'rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            <span class="truncate" @click.stop="scrollTo(section.anchor)">{{ section.label }}</span>
          </div>

          <!-- 二级：模块列表 -->
          <div v-if="expandedSections[si]" class="ml-4 border-l border-[#eef0f3] pl-2">
            <div
              v-for="(item, ii) in section.items"
              :key="ii"
              class="cursor-pointer truncate rounded-md px-2 py-1 text-[11px] text-[#6b7280] transition-colors hover:bg-[#f6f7f9] hover:text-[#2f6feb]"
              @click="scrollTo(item.anchor)"
            >{{ item.label }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const collapsed = ref(false)
const expandedSections = reactive({})

const sections = [
  {
    label: '仅随标的切换',
    anchor: 'section-u',
    items: [
      { label: '期限结构', anchor: 'module-term-structure' },
      { label: '波动率锥', anchor: 'module-vol-cone' },
      { label: '标的趋势', anchor: 'module-spot-trend' },
      { label: '方法论', anchor: 'module-methodology' },
      { label: 'IV 状态', anchor: 'module-iv-regime' },
    ],
  },
  {
    label: '随标的与到期月',
    anchor: 'section-ue',
    items: [
      { label: '综合研判', anchor: 'module-verdict' },
      { label: 'KPI 卡片', anchor: 'module-kpi-cards' },
      { label: '方向信号', anchor: 'module-dir-signal' },
      { label: '波动率信号', anchor: 'module-vol-signal' },
      { label: 'IV 历史', anchor: 'module-iv-hist' },
      { label: '盈亏图', anchor: 'module-payoff' },
      { label: '策略 KPI', anchor: 'module-strategy-kpi' },
      { label: 'IV 微笑', anchor: 'module-iv-smile' },
      { label: '持仓量', anchor: 'module-oi' },
      { label: '日增量', anchor: 'module-doi' },
      { label: 'GEX', anchor: 'module-gex' },
      { label: '希腊字母', anchor: 'module-greeks' },
      { label: 'T 型报价', anchor: 'module-t-table' },
    ],
  },
  {
    label: '六标的横截面',
    anchor: 'section-cross',
    items: [
      { label: '横截面对比', anchor: 'module-cross-section' },
      { label: '象限分布', anchor: 'module-quadrant' },
      { label: '排名', anchor: 'module-rank' },
    ],
  },
  {
    label: 'IV 综合分析与预测',
    anchor: 'section-vix',
    items: [
      { label: '历史走势', anchor: 'module-vix-history' },
      { label: '波动率锥', anchor: 'module-vix-cone' },
      { label: '季节性', anchor: 'module-vix-season' },
      { label: '未来预测', anchor: 'module-vix-forecast' },
      { label: '当前分位', anchor: 'module-vix-rank' },
      { label: '相关性矩阵', anchor: 'module-vix-corr' },
      { label: '核心结论', anchor: 'module-vix-conclusion' },
    ],
  },
  {
    label: '股指期权全景分析',
    anchor: 'section-stock-index',
  },
]

function toggleSection(idx) {
  expandedSections[idx] = !expandedSections[idx]
}

function scrollTo(anchor) {
  const el = document.getElementById(anchor)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>
