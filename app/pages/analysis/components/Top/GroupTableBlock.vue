<template>
  <div class="grid max-md:grid-cols-4 grid-cols-4 gap-1 mt-1 bg-gray-200" v-if="tablePrefix">
    <!-- 持仓量 -->
    <div class="bg-white shadow p-1">
      <h3 class="text-lg font-semibold mb-1 text-orange-400 border-b pb-2">持仓量{{ orderArrowText }}</h3>
      <div class="overflow-auto">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-[#c8c9cc]">
            <tr class="text-left">
              <th class="py-2 px-1 border w-[10px]">序</th>
              <th class="py-2 px-1 border">合约分组</th>
              <th class="py-2 px-1 border">合计持仓量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in holdCountList" :key="`${tablePrefix}-hc-${idx}`">
              <td class="py-1 px-1 border text-center text-[0.7em]">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border font-mono text-[0.85em]">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border">
                <div class="flex items-center justify-between gap-2">
                  <!-- 进度条固定90px宽度 -->
                  <div class="w-[90px] flex-shrink-0">
                    <ProgressBar :value="item.total" :full-data="allHoldCountList" />
                  </div>
                  <span class="font-mono whitespace-nowrap">
                    {{ formatNumberToWan(item.total) }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 持仓额 -->
    <div class="bg-white shadow p-1">
      <h3 class="text-lg font-semibold mb-1 text-orange-400 border-b pb-2">持仓额{{ orderArrowText }}</h3>
      <div class="overflow-auto">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-[#c8c9cc]">
            <tr class="text-left">
              <th class="py-2 px-1 border w-[10px]">序</th>
              <th class="py-2 px-1 border">合约分组</th>
              <th class="py-2 px-1 border">合计持仓额</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in holdAmountList" :key="`${tablePrefix}-ha-${idx}`">
              <td class="py-1 px-1 border text-center text-[0.7em]">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border font-mono text-[0.85em]">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border">
                <div class="flex items-center justify-between gap-2">
                  <div class="w-[90px] flex-shrink-0">
                    <ProgressBar :value="item.total" :full-data="allHoldAmountList" />
                  </div>
                  <span class="font-mono whitespace-nowrap">
                    {{ formatNumberToWan(item.total) }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 日增额 -->
    <div class="bg-white shadow p-1">
      <h3 class="text-lg font-semibold mb-1 text-orange-800 border-b pb-2">日增额{{ orderArrowText }}</h3>
      <div class="overflow-auto">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-[#c8c9cc]">
            <tr class="text-left">
              <th class="py-2 px-1 border w-[10px]">序</th>
              <th class="py-2 px-1 border">合约分组</th>
              <th class="py-2 px-1 border">合计日增额</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in dayAddAmountList" :key="`${tablePrefix}-da-${idx}`">
              <td class="py-1 px-1 border text-center text-[0.7em]">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border font-mono text-[0.85em]">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border">
                <div class="flex items-center justify-between gap-2">
                  <div class="w-[90px] flex-shrink-0">
                    <ProgressBar :value="item.total" :full-data="allDayAddAmountList" />
                  </div>
                  <span class="font-mono whitespace-nowrap">
                    {{ formatNumberToWan(item.total) }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 日增量 -->
    <div class="bg-white shadow p-1">
      <h3 class="text-lg font-semibold mb-1 text-blue-400 border-b pb-2">日增量{{ orderArrowText }}</h3>
      <div class="overflow-auto">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-[#c8c9cc]">
            <tr class="text-left">
              <th class="py-2 px-1 border w-[10px]">序</th>
              <th class="py-2 px-1 border">合约分组</th>
              <th class="py-2 px-1 border">合计日增量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in dayAddCountList" :key="`${tablePrefix}-dc-${idx}`">
              <td class="py-1 px-1 border text-center text-[0.7em]">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border font-mono text-[0.85em]">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border">
                <div class="flex items-center justify-between gap-2">
                  <div class="w-[90px] flex-shrink-0">
                    <ProgressBar :value="item.total" :full-data="allDayAddCountList" />
                  </div>
                  <span class="font-mono whitespace-nowrap">
                    {{ formatNumberToWan(item.total) }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import ProgressBar from "./ProgressBar.vue";

const props = defineProps({
  // 区块唯一前缀：2 / 3 / 4
  tablePrefix: {
    type: String,
    required: true,
    validator: (val) => ["2", "3", "4"].includes(val),
  },
  // 升降序箭头文本
  orderArrowText: String,
  // // 数字格式化函数 由父组件传入
  // formatNumberToWan: Function,

  // 完整聚合数据集（用于计算百分比、进度条）
  allHoldCountList: Array,
  allHoldAmountList: Array,
  allDayAddAmountList: Array,
  allDayAddCountList: Array,

  // 截取前20条渲染列表
  holdCountList: Array,
  holdAmountList: Array,
  dayAddAmountList: Array,
  dayAddCountList: Array,
});
</script>

<style scoped>
:deep(table) {
  border-collapse: collapse;
  width: 100%;
}
:deep(td, th) {
  border: 1px solid #e5e7eb;
}
</style>
