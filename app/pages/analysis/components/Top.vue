<template>
  <div class="option-statistics p-6 bg-gray-50 min-h-screen">
    <h2 class="text-2xl font-bold text-gray-800 mb-8 text-center">期权持仓汇总统计</h2>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- 模块1：日增额汇总TOP20 -->
      <div class="bg-white rounded-lg shadow p-4">
        <h3 class="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">日增额汇总 TOP20</h3>
        <div class="overflow-auto max-h-[650px]">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-gray-100">
              <tr class="text-left">
                <th class="py-2 px-1 border">序号</th>
                <th class="py-2 px-1 border">合约分组</th>
                <th class="py-2 px-1 border">合计日增额</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in dayAddAmountTop20" :key="'da-' + idx">
                <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
                <td class="py-1 px-1 border">{{ item.groupKey }}</td>
                <td class="py-1 px-1 border text-right font-mono">{{ item.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 模块3：日增量汇总TOP20 -->
      <div class="bg-white rounded-lg shadow p-4">
        <h3 class="text-lg font-semibold mb-4 text-orange-600 border-b pb-2">日增量汇总 TOP20</h3>
        <div class="overflow-auto max-h-[650px]">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-gray-100">
              <tr class="text-left">
                <th class="py-2 px-1 border">序号</th>
                <th class="py-2 px-1 border">合约分组</th>
                <th class="py-2 px-1 border">合计日增量</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in dayAddCountTop20" :key="'dc-' + idx">
                <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
                <td class="py-1 px-1 border">{{ item.groupKey }}</td>
                <td class="py-1 px-1 border text-right font-mono">{{ item.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 模块2：持仓额汇总TOP20 -->
      <div class="bg-white rounded-lg shadow p-4">
        <h3 class="text-lg font-semibold mb-4 text-emerald-600 border-b pb-2">持仓额汇总 TOP20</h3>
        <div class="overflow-auto max-h-[650px]">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-gray-100">
              <tr class="text-left">
                <th class="py-2 px-1 border">序号</th>
                <th class="py-2 px-1 border">合约分组</th>
                <th class="py-2 px-1 border">合计持仓额</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in holdAmountTop20" :key="'ha-' + idx">
                <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
                <td class="py-1 px-1 border">{{ item.groupKey }}</td>
                <td class="py-1 px-1 border text-right font-mono">{{ item.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

// 接收父组件传入期权数组 props
const props = defineProps({
  tiledData: {
    type: Array,
    default: () => [],
  },
});

/**
 * 分组聚合通用方法
 * 分组key规则：正股代码_行权价_沽购
 * @param field 需要累加的字段名
 * @returns 分组后排序数组
 */
const groupAndSum = (field) => {
  const groupMap = new Map();
  console.log("props.tiledData", props.tiledData);
  props.tiledData.forEach((item) => {
    // 拼接唯一分组键：正股代码+行权价+沽购
    const key = `${item.沽购 === "沽" ? "沽" : "购"}_${item.千行权价}_${item.展示正股名称}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        groupKey: key,
        total: 0,
      });
    }
    const groupItem = groupMap.get(key);
    groupItem.total += Number(item[field]);
  });

  // map转数组、降序排序、截取前20
  let res = Array.from(groupMap.values()).filter((el) => !!el.total);
  res.sort((a, b) => b.total - a.total);
  return res.slice(0, 20);
};

// 计算三个榜单
const dayAddAmountTop20 = computed(() => groupAndSum("日增额"));
const dayAddCountTop20 = computed(() => groupAndSum("日增量"));
const holdAmountTop20 = computed(() => groupAndSum("持仓额"));
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
