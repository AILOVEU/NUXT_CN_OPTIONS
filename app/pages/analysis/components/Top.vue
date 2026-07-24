<template>
  <div>
    <el-form size="small" :model="formData" label-width="auto" label-suffix=":">
      <el-form-item label="正股">
        <TabSelectMult :options="stockOptions" v-model="formData.正股List" />
      </el-form-item>
      <el-form-item label="到期日">
        <TabSelectMult :options="deadline_list.map((el) => ({ label: el, value: el }))" v-model="formData.到期日List" />
      </el-form-item>
      <el-form-item label="沽购">
        <TabSelectMult :options="['沽', '购'].map((el) => ({ label: el, value: el }))" v-model="formData.沽购List" />
      </el-form-item>
      <el-form-item label="增降序">
        <TabSelect :options="增降序Ops" v-model="formData.orderByRank" />
      </el-form-item>
    </el-form>
  </div>
  <!-- 2 分组维度 -->
  <div class="grid max-md:grid-cols-1 grid-cols-3 gap-6 mt-[10px]">
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-lg font-semibold mb-4 text-orange-400 border-b pb-2">持仓额{{ orderArrowText }}</h3>
      <div class="overflow-auto max-h-[650px]">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-100">
            <tr class="text-left">
              <th class="py-2 px-1 border">序号</th>
              <th class="py-2 px-1 border">合约分组</th>
              <th class="py-2 px-1 border w-[140px]">数值进度</th>
              <th class="py-2 px-1 border">合计持仓额</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in holdAmountTop20_2" :key="'ha2-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border font-mono">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border">
                <div class="h-5 w-full bg-gray-100 rounded overflow-hidden relative text-xs">
                  <!-- 中间0轴线 -->
                  <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-300 z-10"></div>
                  <!-- 负数 绿色条：向左延伸 -->
                  <div
                    v-if="item.total < 0"
                    class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '持仓额') + '%' }"
                  >
                    {{ getPercentText(item.total, '持仓额') }}
                  </div>
                  <!-- 正数 蓝色条：向右延伸 -->
                  <div
                    v-if="item.total > 0"
                    class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '持仓额') + '%' }"
                  >
                    {{ getPercentText(item.total, '持仓额') }}
                  </div>
                  <!-- 0值 -->
                  <div
                    v-if="item.total === 0"
                    class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-white"
                  >
                    0%
                  </div>
                </div>
              </td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-lg font-semibold mb-4 text-orange-800 border-b pb-2">日增额{{ orderArrowText }}</h3>
      <div class="overflow-auto max-h-[650px]">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-100">
            <tr class="text-left">
              <th class="py-2 px-1 border">序号</th>
              <th class="py-2 px-1 border">合约分组</th>
              <th class="py-2 px-1 border w-[140px]">数值进度</th>
              <th class="py-2 px-1 border">合计日增额</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in dayAddAmountTop20_2" :key="'da2-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border font-mono">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border">
                <div class="h-5 w-full bg-gray-100 rounded overflow-hidden relative text-xs">
                  <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-300 z-10"></div>
                  <div
                    v-if="item.total < 0"
                    class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '日增额') + '%' }"
                  >
                    {{ getPercentText(item.total, '日增额') }}
                  </div>
                  <div
                    v-if="item.total > 0"
                    class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '日增额') + '%' }"
                  >
                    {{ getPercentText(item.total, '日增额') }}
                  </div>
                  <div
                    v-if="item.total === 0"
                    class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-white"
                  >
                    0%
                  </div>
                </div>
              </td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-lg font-semibold mb-4 text-blue-400 border-b pb-2">日增量{{ orderArrowText }}</h3>
      <div class="overflow-auto max-h-[650px]">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-100">
            <tr class="text-left">
              <th class="py-2 px-1 border">序号</th>
              <th class="py-2 px-1 border">合约分组</th>
              <th class="py-2 px-1 border w-[140px]">数值进度</th>
              <th class="py-2 px-1 border">合计日增量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in dayAddCountTop20_2" :key="'dc2-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border font-mono">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border">
                <div class="h-5 w-full bg-gray-100 rounded overflow-hidden relative text-xs">
                  <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-300 z-10"></div>
                  <div
                    v-if="item.total < 0"
                    class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '日增量') + '%' }"
                  >
                    {{ getPercentText(item.total, '日增量') }}
                  </div>
                  <div
                    v-if="item.total > 0"
                    class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '日增量') + '%' }"
                  >
                    {{ getPercentText(item.total, '日增量') }}
                  </div>
                  <div
                    v-if="item.total === 0"
                    class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-white"
                  >
                    0%
                  </div>
                </div>
              </td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- 3 分组维度 -->
  <div class="grid max-md:grid-cols-1 grid-cols-3 gap-6 mt-6">
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-lg font-semibold mb-4 text-orange-400 border-b pb-2">持仓额{{ orderArrowText }}</h3>
      <div class="overflow-auto max-h-[650px]">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-100">
            <tr class="text-left">
              <th class="py-2 px-1 border">序号</th>
              <th class="py-2 px-1 border">合约分组</th>
              <th class="py-2 px-1 border w-[140px]">数值进度</th>
              <th class="py-2 px-1 border">合计持仓额</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in holdAmountTop20_3" :key="'ha3-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border font-mono">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border">
                <div class="h-5 w-full bg-gray-100 rounded overflow-hidden relative text-xs">
                  <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-300 z-10"></div>
                  <div
                    v-if="item.total < 0"
                    class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '持仓额') + '%' }"
                  >
                    {{ getPercentText(item.total, '持仓额') }}
                  </div>
                  <div
                    v-if="item.total > 0"
                    class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '持仓额') + '%' }"
                  >
                    {{ getPercentText(item.total, '持仓额') }}
                  </div>
                  <div
                    v-if="item.total === 0"
                    class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-white"
                  >
                    0%
                  </div>
                </div>
              </td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-lg font-semibold mb-4 text-orange-800 border-b pb-2">日增额{{ orderArrowText }}</h3>
      <div class="overflow-auto max-h-[650px]">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-100">
            <tr class="text-left">
              <th class="py-2 px-1 border">序号</th>
              <th class="py-2 px-1 border">合约分组</th>
              <th class="py-2 px-1 border w-[140px]">数值进度</th>
              <th class="py-2 px-1 border">合计日增额</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in dayAddAmountTop20_3" :key="'da3-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border font-mono">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border">
                <div class="h-5 w-full bg-gray-100 rounded overflow-hidden relative text-xs">
                  <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-300 z-10"></div>
                  <div
                    v-if="item.total < 0"
                    class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '日增额') + '%' }"
                  >
                    {{ getPercentText(item.total, '日增额') }}
                  </div>
                  <div
                    v-if="item.total > 0"
                    class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '日增额') + '%' }"
                  >
                    {{ getPercentText(item.total, '日增额') }}
                  </div>
                  <div
                    v-if="item.total === 0"
                    class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-white"
                  >
                    0%
                  </div>
                </div>
              </td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-lg font-semibold mb-4 text-blue-400 border-b pb-2">日增量{{ orderArrowText }}</h3>
      <div class="overflow-auto max-h-[650px]">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-100">
            <tr class="text-left">
              <th class="py-2 px-1 border">序号</th>
              <th class="py-2 px-1 border">合约分组</th>
              <th class="py-2 px-1 border w-[140px]">数值进度</th>
              <th class="py-2 px-1 border">合计日增量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in dayAddCountTop20_3" :key="'dc3-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border font-mono">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border">
                <div class="h-5 w-full bg-gray-100 rounded overflow-hidden relative text-xs">
                  <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-300 z-10"></div>
                  <div
                    v-if="item.total < 0"
                    class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '日增量') + '%' }"
                  >
                    {{ getPercentText(item.total, '日增量') }}
                  </div>
                  <div
                    v-if="item.total > 0"
                    class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '日增量') + '%' }"
                  >
                    {{ getPercentText(item.total, '日增量') }}
                  </div>
                  <div
                    v-if="item.total === 0"
                    class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-white"
                  >
                    0%
                  </div>
                </div>
              </td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- 4 分组维度 -->
  <div class="grid max-md:grid-cols-1 grid-cols-3 gap-6 mt-6">
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-lg font-semibold mb-4 text-orange-400 border-b pb-2">持仓额{{ orderArrowText }}</h3>
      <div class="overflow-auto max-h-[650px]">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-100">
            <tr class="text-left">
              <th class="py-2 px-1 border">序号</th>
              <th class="py-2 px-1 border">合约分组</th>
              <th class="py-2 px-1 border w-[140px]">数值进度</th>
              <th class="py-2 px-1 border">合计持仓额</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in holdAmountTop20_4" :key="'ha4-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border font-mono">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border">
                <div class="h-5 w-full bg-gray-100 rounded overflow-hidden relative text-xs">
                  <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-300 z-10"></div>
                  <div
                    v-if="item.total < 0"
                    class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '持仓额') + '%' }"
                  >
                    {{ getPercentText(item.total, '持仓额') }}
                  </div>
                  <div
                    v-if="item.total > 0"
                    class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '持仓额') + '%' }"
                  >
                    {{ getPercentText(item.total, '持仓额') }}
                  </div>
                  <div
                    v-if="item.total === 0"
                    class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-white"
                  >
                    0%
                  </div>
                </div>
              </td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-lg font-semibold mb-4 text-orange-800 border-b pb-2">日增额{{ orderArrowText }}</h3>
      <div class="overflow-auto max-h-[650px]">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-100">
            <tr class="text-left">
              <th class="py-2 px-1 border">序号</th>
              <th class="py-2 px-1 border">合约分组</th>
              <th class="py-2 px-1 border w-[140px]">数值进度</th>
              <th class="py-2 px-1 border">合计日增额</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in dayAddAmountTop20_4" :key="'da4-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border font-mono">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border">
                <div class="h-5 w-full bg-gray-100 rounded overflow-hidden relative text-xs">
                  <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-300 z-10"></div>
                  <div
                    v-if="item.total < 0"
                    class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '日增额') + '%' }"
                  >
                    {{ getPercentText(item.total, '日增额') }}
                  </div>
                  <div
                    v-if="item.total > 0"
                    class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '日增额') + '%' }"
                  >
                    {{ getPercentText(item.total, '日增额') }}
                  </div>
                  <div
                    v-if="item.total === 0"
                    class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-white"
                  >
                    0%
                  </div>
                </div>
              </td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <h3 class="text-lg font-semibold mb-4 text-blue-400 border-b pb-2">日增量{{ orderArrowText }}</h3>
      <div class="overflow-auto max-h-[650px]">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-100">
            <tr class="text-left">
              <th class="py-2 px-1 border">序号</th>
              <th class="py-2 px-1 border">合约分组</th>
              <th class="py-2 px-1 border w-[140px]">数值进度</th>
              <th class="py-2 px-1 border">合计日增量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in dayAddCountTop20_4" :key="'dc4-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border font-mono">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border">
                <div class="h-5 w-full bg-gray-100 rounded overflow-hidden relative text-xs">
                  <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-300 z-10"></div>
                  <div
                    v-if="item.total < 0"
                    class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '日增量') + '%' }"
                  >
                    {{ getPercentText(item.total, '日增量') }}
                  </div>
                  <div
                    v-if="item.total > 0"
                    class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium"
                    :style="{ width: getBarWidth(item.total, '日增量') + '%' }"
                  >
                    {{ getPercentText(item.total, '日增量') }}
                  </div>
                  <div
                    v-if="item.total === 0"
                    class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-white"
                  >
                    0%
                  </div>
                </div>
              </td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from "vue";
import { deadline_list, OPTIONS_MAP } from "~/data";
import _ from "lodash";

// 表单数据
const formData = reactive({
  正股List: [...OPTIONS_MAP.map((el) => el.code)],
  到期日List: [...deadline_list],
  沽购List: ["沽", "购"],
  orderByRank: "desc",
});

const stockOptions = OPTIONS_MAP.map((el) => ({
  label: el.name,
  value: el.code,
}));
const 增降序Ops = [
  { label: "升序", value: "asc" },
  { label: "降序", value: "desc" },
];

const orderArrowText = computed(() => {
  return formData.orderByRank === "desc" ? "↘" : "↗";
});

// props
const props = defineProps({
  tiledData: {
    type: Array,
    default: () => [],
  },
});

// 筛选后原始数据
const filterTableData = computed(() => {
  return props.tiledData
    .filter((el) => formData.正股List.includes(el["正股代码"]))
    .filter((el) => formData.到期日List.includes(el["到期日"]))
    .filter((el) => formData.沽购List.includes(el["沽购"]));
});

// 计算三个字段各自全局最大最小值
const fieldRange = computed(() => {
  const getDataRange = (field) => {
    const nums = filterTableData.value.map(i => Number(i[field])).filter(n => !isNaN(n));
    if (!nums.length) return { min: 0, max: 0 };
    return {
      min: Math.min(...nums),
      max: Math.max(...nums)
    };
  };
  return {
    持仓额: getDataRange("持仓额"),
    日增额: getDataRange("日增额"),
    日增量: getDataRange("日增量"),
  };
});

/**
 * 统一计算进度宽度 0~50%区间（左右各一半容器）
 * 整体总跨度 = max - min
 * 占比区间 0 ~ 100% 映射到容器整体宽度
 * 左半边(-)、右半边(+)各占50%容器宽度
 * 极值严格：最小值=-100% 最大值=100%
 */
// 进度条宽度计算
const getBarWidth = (value, fieldKey) => {
  const { min, max } = fieldRange.value[fieldKey];
  if (max === min) return 0;
  const totalRange = max - min;
  // 整体0~100%
  const totalPercent = ((value - min) / totalRange) * 100;
  // 距离中点的距离，单侧宽度最大50%
  const offset = totalPercent - 50;
  return Math.abs(offset).toFixed(1);
};

// 百分比文字
const getPercentText = (value, fieldKey) => {
  const { min, max } = fieldRange.value[fieldKey];
  if (max === min) return "0%";
  const totalRange = max - min;
  const totalPercent = ((value - min) / totalRange) * 100;
  // 换算成以0为中心 -50 ~ +50 再放大两倍
  const pct = ((totalPercent - 50) / 50) * 100;
  const num = Number(pct.toFixed(1));
  if (num > 0) return `${num}%`;
  if (num < 0) return `${num}%`;
  return "0%";
};


// 公共分组求和工厂函数
const createGroupSum = (getKeyFn) => (field) => {
  const groupMap = new Map();
  filterTableData.value
    .filter((el) => !!el[field])
    .forEach((item) => {
      const key = getKeyFn(item);
      if (!groupMap.has(key)) {
        groupMap.set(key, { groupKey: key, total: 0 });
      }
      groupMap.get(key).total += Number(item[field]);
    });

  let list = _.orderBy(
    Array.from(groupMap.values()).filter(el => !!el.total),
    ["total"],
    [formData.orderByRank]
  );
  return list.slice(0, 20);
};

// 三种分组规则
const groupSum2 = createGroupSum((item) => `${item.展示正股名称}_${item.沽购 === "沽" ? "🟢" : "🔴"}`);
const groupSum3 = createGroupSum((item) => `${item.展示正股名称}_${item.沽购 === "沽" ? "🟢" : "🔴"}_${item.千行权价}`);
const groupSum4 = createGroupSum((item) => `${item.展示正股名称}_${item.沽购 === "沽" ? "🟢" : "🔴"}_${item.千行权价}_${item.到期月份icon}`);

// 所有表格数据源
const holdAmountTop20_2 = computed(() => groupSum2("持仓额"));
const dayAddAmountTop20_2 = computed(() => groupSum2("日增额"));
const dayAddCountTop20_2 = computed(() => groupSum2("日增量"));

const holdAmountTop20_3 = computed(() => groupSum3("持仓额"));
const dayAddAmountTop20_3 = computed(() => groupSum3("日增额"));
const dayAddCountTop20_3 = computed(() => groupSum3("日增量"));

const dayAddAmountTop20_4 = computed(() => groupSum4("日增额"));
const dayAddCountTop20_4 = computed(() => groupSum4("日增量"));
const holdAmountTop20_4 = computed(() => groupSum4("持仓额"));

// 数字转万 格式化函数
const formatNumberToWan = (num) => {
  if (num == null) return "0.00";
  return (Number(num) / 10000).toFixed(2);
};
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
