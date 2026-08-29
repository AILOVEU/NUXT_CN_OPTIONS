<template>
  <div v-if="props.row._split" class="bg-[#576a8f] h-[10px] text-[white] flex items-center justify-center">&nbsp;</div>
  <div v-else-if="props.row._current" :style="props.isCall
    ? 'background: linear-gradient(rgb(255, 240, 240), rgb(225, 240, 225)); height: 22px'
    : 'background: linear-gradient(rgb(225, 240, 225), rgb(255, 240, 240)); height: 22px'">
    &nbsp;
  </div>
  <div class="flex flex-col justify-between flex-1" v-else-if="info">
    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-1">
        <div :class="[props.isCall ? 'text-right' : 'w-[40px]']">持仓额</div>
        <div :class="[props.isCall ? 'text-left relative overflow-hidden' : 'text-right relative overflow-hidden']">
          <div class="absolute inset-y-0 z-0" :style="getBgStyle('持仓额', info.持仓额)"></div>
          <span class="relative z-10">{{ formatNumberToWan(info.持仓额) }}</span>
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <div :class="[props.isCall ? 'text-right' : 'w-[40px]']">持仓量</div>
        <div :class="[props.isCall ? 'text-left relative overflow-hidden' : 'text-right relative overflow-hidden']">
          <div class="absolute inset-y-0 z-0" :style="getBgStyle('持仓量', info.持仓量)"></div>
          <span class="relative z-10">{{ formatNumberToWan(info.持仓量) }}</span>
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-2 mt-4">
      <div class="flex flex-col gap-1 mt-1">
        <div :class="[props.isCall ? 'text-right' : 'w-[40px]']">日增额</div>
        <div :class="[props.isCall ? 'text-left relative overflow-hidden' : 'text-right relative overflow-hidden']">
          <div class="absolute inset-y-0 z-0" :style="getBgStyle('日增额', info.日增额)"></div>
          <span class="relative z-10">{{ formatNumberToWan(info.日增额) }}</span>
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <div :class="[props.isCall ? 'text-right' : 'w-[40px]']">日增量</div>
        <div :class="[props.isCall ? 'text-left relative overflow-hidden' : 'text-right relative overflow-hidden']">
          <div class="absolute inset-y-0 z-0" :style="getBgStyle('日增量', info.日增量)"></div>
          <span class="relative z-10">{{ formatNumberToWan(info.日增量) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { OPTIONS_MAP } from "~/data";
import { formatDecimal, formatNumberToWan } from "~/utils/utils";
import dayjs from "dayjs";

const props = defineProps(["row", "isCall", 'minMaxData']);
const info = computed(() => {
  return props.row[(props.isCall ? "C" : "P") + "市场数据"];
});

/**
 * 获取进度背景样式
 * @param {string} field 字段名
 * @param {number} val 当前数值
 * @returns {Object} style对象
 */
const getBgStyle = (field, val) => {
  const num = Number(val)
  const meta = props.minMaxData?.[field]
  if (!meta || meta.max == null || meta.min == null || num === 0) {
    return { width: '0%' }
  }

  let bgColor = ''
  let percent = 0

  if (num > 0) {
    bgColor = 'rgba(135, 206, 235, 0.85)' // 浅蓝
    percent = num / meta.max
  } else if (num < 0) {
    bgColor = 'rgba(144, 238, 144, 0.85)' // 浅绿
    percent = num / meta.min
  }

  percent = Math.min(Math.abs(percent), 1)
  const widthVal = `${percent * 100}%`

  // isCall = true：进度条从右向左，right:0
  if (props.isCall) {
    return {
      width: widthVal,
      backgroundColor: bgColor,
      right: 0,
      left: 'auto'
    }
  } else {
    // 默认：进度条从左向右，left:0
    return {
      width: widthVal,
      backgroundColor: bgColor,
      left: 0,
      right: 'auto'
    }
  }
}
</script>

<style scoped lang="scss">
.relative {
  position: relative;
}
</style>