<template>
  <div
    class="fixed z-50 flex flex-col rounded-xl border border-[#e5e8ef] bg-white/95 shadow-lg backdrop-blur-sm"
    style="bottom: 24px; left: 4px"
    :class="collapsed ? 'w-[130px]' : 'w-[220px]'"
  >
    <!-- 标题栏（含折叠按钮） -->
    <div
      class="flex cursor-pointer items-center justify-between px-3.5 py-2.5 select-none"
      :class="{ 'border-b border-[#f0f2f5]': !collapsed }"
      @click="collapsed = !collapsed"
    >
      <span class="text-[11.5px] font-semibold text-[#3a3f47] tracking-[.2px]">
        {{ collapsed ? '导航' : '页面导航' }}
      </span>
      <svg
        class="h-3.5 w-3.5 text-[#8f95a1] transition-transform duration-200"
        :class="{ 'rotate-180': !collapsed }"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round"
      >
        <polyline points="6 15 12 9 18 15" />
      </svg>
    </div>

    <!-- 导航列表 -->
    <div v-show="!collapsed" class="max-h-[50vh] overflow-y-auto px-1.5 py-1.5">
      <div v-for="(section, si) in sections" :key="si">
        <!-- 一级：区块标题 -->
        <div
          class="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-[11.5px] font-medium transition-colors"
          :class="activeAnchor === section.anchor
            ? 'text-[#2f6feb] bg-[#f0f4ff]'
            : 'text-[#3a3f47] hover:bg-[#f6f7f9]'"
          @click.stop="scrollTo(section.anchor)"
        >
          <span class="truncate">{{ section.label }}</span>
        </div>

        <!-- 二级：模块列表 -->
        <div v-if="section.items?.length" class="ml-4 border-l border-[#eef0f3] pl-2">
          <div
            v-for="(item, ii) in section.items"
            :key="ii"
            class="cursor-pointer truncate rounded-md px-2 py-1 text-[11px] transition-colors"
            :class="activeAnchor === item.anchor
              ? 'text-[#2f6feb] bg-[#f0f4ff] font-medium'
              : 'text-[#6b7280] hover:bg-[#f6f7f9] hover:text-[#2f6feb]'"
            @click.stop="scrollTo(item.anchor)"
          >{{ item.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  ready: { type: Boolean, default: true },
  scrollOffset: { type: Number, default: 0 },
  sections: { type: Array, required: true },
})

const collapsed = ref(true)
const activeAnchor = ref('')

// 收集所有锚点 ID
const allAnchors = computed(() => {
  const anchors = []
  for (const section of props.sections) {
    anchors.push(section.anchor)
    if (section.items) {
      for (const item of section.items) {
        anchors.push(item.anchor)
      }
    }
  }
  return anchors
})

let observer = null

function setupObserver() {
  // 清理旧 observer
  if (observer) {
    observer.disconnect()
    observer = null
  }

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible.length > 0) {
        activeAnchor.value = visible[0].target.id
      }
    },
    { rootMargin: '-10% 0px -70% 0px', threshold: 0 },
  )

  for (const anchor of allAnchors.value) {
    const el = document.getElementById(anchor)
    if (el) observer.observe(el)
  }
}

// ready 变为 true 时（DOM 已就绪），初始化 observer
watch(() => props.ready, (val) => {
  if (val) {
    // 使用 nextTick 确保 v-if 内的 DOM 已渲染
    nextTick(() => setupObserver())
  }
}, { immediate: true })

onUnmounted(() => {
  if (observer) observer.disconnect()
})

function scrollTo(anchor) {
  activeAnchor.value = anchor
  const el = document.getElementById(anchor)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - props.scrollOffset
    window.scrollTo({ top, behavior: 'smooth' })
  }
}
</script>