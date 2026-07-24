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

  <!-- 2分组维度 -->
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
                  <div class="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gray-300 z-10"></div>
                  <!-- 负数绿色条：白色文字 -->
                  <div v-if="item.total < 0" class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allHoldAmount_2) + '%' }">
                    {{ getPercentText(item.total, allHoldAmount_2) }}
                  </div>
                  <!-- 正数蓝色条：白色文字 -->
                  <div v-if="item.total > 0" class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allHoldAmount_2) + '%' }">
                    {{ getPercentText(item.total, allHoldAmount_2) }}
                  </div>
                  <!-- 0值灰色条：深色文字 -->
                  <div v-if="item.total === 0" class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-gray-800 font-medium">0%</div>
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
                  <div v-if="item.total < 0" class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allDayAddAmount_2) + '%' }">
                    {{ getPercentText(item.total, allDayAddAmount_2) }}
                  </div>
                  <div v-if="item.total > 0" class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allDayAddAmount_2) + '%' }">
                    {{ getPercentText(item.total, allDayAddAmount_2) }}
                  </div>
                  <div v-if="item.total === 0" class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-gray-800 font-medium">0%</div>
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
                  <div v-if="item.total < 0" class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allDayAddCount_2) + '%' }">
                    {{ getPercentText(item.total, allDayAddCount_2) }}
                  </div>
                  <div v-if="item.total > 0" class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allDayAddCount_2) + '%' }">
                    {{ getPercentText(item.total, allDayAddCount_2) }}
                  </div>
                  <div v-if="item.total === 0" class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-gray-800 font-medium">0%</div>
                </div>
              </td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- 3分组维度 -->
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
                  <div v-if="item.total < 0" class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allHoldAmount_3) + '%' }">
                    {{ getPercentText(item.total, allHoldAmount_3) }}
                  </div>
                  <div v-if="item.total > 0" class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allHoldAmount_3) + '%' }">
                    {{ getPercentText(item.total, allHoldAmount_3) }}
                  </div>
                  <div v-if="item.total === 0" class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-gray-800 font-medium">0%</div>
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
                  <div v-if="item.total < 0" class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allDayAddAmount_3) + '%' }">
                    {{ getPercentText(item.total, allDayAddAmount_3) }}
                  </div>
                  <div v-if="item.total > 0" class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allDayAddAmount_3) + '%' }">
                    {{ getPercentText(item.total, allDayAddAmount_3) }}
                  </div>
                  <div v-if="item.total === 0" class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-gray-800 font-medium">0%</div>
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
                  <div v-if="item.total < 0" class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allDayAddCount_3) + '%' }">
                    {{ getPercentText(item.total, allDayAddCount_3) }}
                  </div>
                  <div v-if="item.total > 0" class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allDayAddCount_3) + '%' }">
                    {{ getPercentText(item.total, allDayAddCount_3) }}
                  </div>
                  <div v-if="item.total === 0" class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-gray-800 font-medium">0%</div>
                </div>
              </td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- 4分组维度 -->
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
                  <div v-if="item.total < 0" class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allHoldAmount_4) + '%' }">
                    {{ getPercentText(item.total, allHoldAmount_4) }}
                  </div>
                  <div v-if="item.total > 0" class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allHoldAmount_4) + '%' }">
                    {{ getPercentText(item.total, allHoldAmount_4) }}
                  </div>
                  <div v-if="item.total === 0" class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-gray-800 font-medium">0%</div>
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
                  <div v-if="item.total < 0" class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allDayAddAmount_4) + '%' }">
                    {{ getPercentText(item.total, allDayAddAmount_4) }}
                  </div>
                  <div v-if="item.total > 0" class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allDayAddAmount_4) + '%' }">
                    {{ getPercentText(item.total, allDayAddAmount_4) }}
                  </div>
                  <div v-if="item.total === 0" class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-gray-800 font-medium">0%</div>
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
                  <div v-if="item.total < 0" class="h-full rounded absolute right-1/2 bg-green-500 flex items-center justify-end pr-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allDayAddCount_4) + '%' }">
                    {{ getPercentText(item.total, allDayAddCount_4) }}
                  </div>
                  <div v-if="item.total > 0" class="h-full rounded absolute left-1/2 bg-blue-500 flex items-center pl-1 text-white font-medium" :style="{ width: getBarWidth(item.total, allDayAddCount_4) + '%' }">
                    {{ getPercentText(item.total, allDayAddCount_4) }}
                  </div>
                  <div v-if="item.total === 0" class="h-full w-[10%] rounded absolute left-1/2 -translate-x-1/2 bg-gray-300 flex items-center justify-center text-gray-800 font-medium">0%</div>
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

// 筛选后原始明细数据
const filterTableData = computed(() => {
  return props.tiledData
    .filter((el) => formData.正股List.includes(el["正股代码"]))
    .filter((el) => formData.到期日List.includes(el["到期日"]))
    .filter((el) => formData.沽购List.includes(el["沽购"]));
});

// 分组求和工厂：返回【完整未截取数组】
const createGroupAllList = (getKeyFn) => (field) => {
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
    Array.from(groupMap.values()).filter((el) => !!el.total),
    ["total"],
    [formData.orderByRank]
  );
  // 返回全部数据，不slice
  return list;
};

// 三种分组规则
const groupSum2 = createGroupAllList((item) => `${item.展示正股名称}_${item.沽购 === "沽" ? "🟢" : "🔴"}`);
const groupSum3 = createGroupAllList((item) => `${item.展示正股名称}_${item.沽购 === "沽" ? "🟢" : "🔴"}_${item.千行权价}`);
const groupSum4 = createGroupAllList((item) => `${item.展示正股名称}_${item.沽购 === "沽" ? "🟢" : "🔴"}_${item.千行权价}_${item.到期月份icon}`);

// ========== 全部完整聚合数据（用来计算最大最小值）==========
// 2维度 全部数据
const allHoldAmount_2 = computed(() => groupSum2("持仓额"));
const allDayAddAmount_2 = computed(() => groupSum2("日增额"));
const allDayAddCount_2 = computed(() => groupSum2("日增量"));

// 3维度 全部数据
const allHoldAmount_3 = computed(() => groupSum3("持仓额"));
const allDayAddAmount_3 = computed(() => groupSum3("日增额"));
const allDayAddCount_3 = computed(() => groupSum3("日增量"));

// 4维度 全部数据
const allHoldAmount_4 = computed(() => groupSum4("持仓额"));
const allDayAddAmount_4 = computed(() => groupSum4("日增额"));
const allDayAddCount_4 = computed(() => groupSum4("日增量"));

// ========== 截取前20条用于页面渲染 ==========
const holdAmountTop20_2 = computed(() => allHoldAmount_2.value.slice(0, 20));
const dayAddAmountTop20_2 = computed(() => allDayAddAmount_2.value.slice(0, 20));
const dayAddCountTop20_2 = computed(() => allDayAddCount_2.value.slice(0, 20));

const holdAmountTop20_3 = computed(() => allHoldAmount_3.value.slice(0, 20));
const dayAddAmountTop20_3 = computed(() => allDayAddAmount_3.value.slice(0, 20));
const dayAddCountTop20_3 = computed(() => allDayAddCount_3.value.slice(0, 20));

const holdAmountTop20_4 = computed(() => allHoldAmount_4.value.slice(0, 20));
const dayAddAmountTop20_4 = computed(() => allDayAddAmount_4.value.slice(0, 20));
const dayAddCountTop20_4 = computed(() => allDayAddCount_4.value.slice(0, 20));

/**
 * 获取值域区间
 */
const getTableFullRange = (fullList) => {
  if (!fullList || fullList.length === 0) return { min: 0, max: 0 };
  const nums = fullList.map((item) => item.total);
  return {
    min: Math.min(...nums),
    max: Math.max(...nums),
  };
};

/**
 * 计算进度条宽度（左右单侧最大50%）
 */
const getBarWidth = (value, fullList) => {
  const { min, max } = getTableFullRange(fullList);
  if (min === max) return 0;

  let widthRatio = 0;
  if (value > 0) {
    // 正数：0 ~ max 映射 0~50%宽度
    widthRatio = (value / max) * 50;
  } else if (value < 0) {
    // 负数：min ~ 0 映射 0~50%宽度
    widthRatio = (Math.abs(value) / Math.abs(min)) * 50;
  }
  return Number(Math.min(50, widthRatio).toFixed(1));
};

/**
 * 正确正负百分比文本
 * 正数：0 ~ 100%
 * 负数：-100% ~ 0
 */
const getPercentText = (value, fullList) => {
  const { min, max } = getTableFullRange(fullList);
  if (min === max) return "0%";

  let percent = 0;
  if (value > 0) {
    percent = (value / max) * 100;
  } else if (value < 0) {
    percent = -((Math.abs(value) / Math.abs(min)) * 100);
  }

  const num = Number(Math.max(-100, Math.min(100, percent)).toFixed(1));
  return `${num}%`;
};

// 数字转万
// const formatNumberToWan = (num) => {
//   if (num == null) return "0.00";
//   return (Number(num) / 10000).toFixed(2);
// };
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
