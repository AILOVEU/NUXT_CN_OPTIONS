<template>
    <div class="h-5 w-full bg-[#c8c9cc] rounded overflow-hidden relative text-xs">
      <!-- 中间分割线 -->
      <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-300 z-10"></div>
  
      <!-- 负数绿色条 右侧 -->
      <div
        v-if="value < 0"
        class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium"
        :style="{ width: barWidth + '%' }"
      >
        {{ percentText }}
      </div>
  
      <!-- 正数蓝色条 左侧 -->
      <div
        v-if="value > 0"
        class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium"
        :style="{ width: barWidth + '%' }"
      >
        {{ percentText }}
      </div>
  
      <!-- 0值居中灰色条 -->
      <div
        v-if="value === 0"
        class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-gray-800 font-medium"
      >
        0%
      </div>
    </div>
  </template>
  
  <script setup>  
  const props = defineProps({
    value: {
      type: Number,
      default: 0
    },
    fullData: {
      type: Array,
      default: () => []
    }
  })
  
  // 获取最大最小值区间
  const getTableFullRange = (fullList) => {
    if (!fullList || fullList.length === 0) return { min: 0, max: 0 }
    const nums = fullList.map(item => item.total)
    return {
      min: Math.min(...nums),
      max: Math.max(...nums)
    }
  }
  
  // 进度条宽度计算
  const barWidth = computed(() => {
    const { min, max } = getTableFullRange(props.fullData)
    if (min === max) return 0
  
    let widthRatio = 0
    if (props.value > 0) {
      widthRatio = (props.value / max) * 50
    } else if (props.value < 0) {
      widthRatio = (Math.abs(props.value) / Math.abs(min)) * 50
    }
    return Number(Math.min(50, widthRatio).toFixed(1))
  })
  
  // 百分比文本
  const percentText = computed(() => {
    const { min, max } = getTableFullRange(props.fullData)
    if (min === max) return '0%'
  
    let percent = 0
    if (props.value > 0) {
      percent = (props.value / max) * 100
    } else if (props.value < 0) {
      percent = -((Math.abs(props.value) / Math.abs(min)) * 100)
    }
  
    const num = Number(Math.max(-100, Math.min(100, percent)).toFixed(0))
    return `${num}%`
  })
  </script>
  