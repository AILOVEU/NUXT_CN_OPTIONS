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
  <!-- 2 -->
  <div class="grid max-md:grid-cols-1 grid-cols-3 gap-6 mt-[10px]">
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
            <tr v-for="(item, idx) in holdAmountTop20_2" :key="'ha-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
            <tr v-for="(item, idx) in dayAddAmountTop20_2" :key="'da-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
            <tr v-for="(item, idx) in dayAddCountTop20_2" :key="'dc-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <!-- 3 -->
  <div class="grid max-md:grid-cols-1 grid-cols-3 gap-6">
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
            <tr v-for="(item, idx) in holdAmountTop20_3" :key="'ha-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
            <tr v-for="(item, idx) in dayAddAmountTop20_3" :key="'da-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
            <tr v-for="(item, idx) in dayAddCountTop20_3" :key="'dc-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <!-- 4 -->
  <div class="grid max-md:grid-cols-1 grid-cols-3 gap-6">
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
            <tr v-for="(item, idx) in holdAmountTop20_4" :key="'ha-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
            <tr v-for="(item, idx) in dayAddAmountTop20_4" :key="'da-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
            <tr v-for="(item, idx) in dayAddCountTop20_4" :key="'dc-' + idx">
              <td class="py-1 px-1 border text-center">{{ idx + 1 }}</td>
              <td class="py-1 px-1 border">{{ item.groupKey }}</td>
              <td class="py-1 px-1 border text-right font-mono">{{ formatNumberToWan(item.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { deadline_list, deadline_color_list, OPTIONS_MAP } from "~/data";
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
  {
    label: "增序",
    value: "asc",
  },
  {
    label: "降序",
    value: "desc",
  },
];
// 接收父组件传入期权数组 props
const props = defineProps({
  tiledData: {
    type: Array,
    default: () => [],
  },
});
// 过滤与校验
const filterTableData = computed(() => {
  return props.tiledData
    .filter((el) => formData.正股List.includes(el["正股代码"]))
    .filter((el) => formData.到期日List.includes(el["到期日"]))
    .filter((el) => formData.沽购List.includes(el["沽购"]));
});

const groupAndSum4 = (field) => {
  const groupMap = new Map();
  filterTableData.value
    .filter((el) => !!el[field])
    .forEach((item) => {
      // 拼接唯一分组键：正股代码+行权价+沽购
      const key = `${item.沽购 === "沽" ? "🟢" : "🔴"}_${item.千行权价}_${item.到期月份icon}_${item.展示正股名称}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          groupKey: key,
          total: 0,
        });
      }
      const groupItem = groupMap.get(key);
      groupItem.total += Number(item[field]);
    });

  let res = _.orderBy(
    Array.from(groupMap.values()).filter((el) => !!el.total),
    ["total"],
    [formData.orderByRank]
  );
  console.log(res)
  return res.slice(0, 20);
};

const groupAndSum3 = (field) => {
  const groupMap = new Map();
  filterTableData.value
    .filter((el) => !!el[field])
    .forEach((item) => {
      // 拼接唯一分组键：正股代码+行权价+沽购
      const key = `${item.沽购 === "沽" ? "🟢" : "🔴"}_${item.千行权价}_${item.展示正股名称}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          groupKey: key,
          total: 0,
        });
      }
      const groupItem = groupMap.get(key);
      groupItem.total += Number(item[field]);
    });

  let res = _.orderBy(
    Array.from(groupMap.values()).filter((el) => !!el.total),
    ["total"],
    [formData.orderByRank]
  );
  return res.slice(0, 20);
};

const groupAndSum2 = (field) => {
  const groupMap = new Map();
  filterTableData.value
    .filter((el) => !!el[field])
    .forEach((item) => {
      // 拼接唯一分组键：正股代码+行权价+沽购
      const key = `${item.沽购 === "沽" ? "🟢" : "🔴"}_${item.展示正股名称}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          groupKey: key,
          total: 0,
        });
      }
      const groupItem = groupMap.get(key);
      groupItem.total += Number(item[field]);
    });

  let res = _.orderBy(
    Array.from(groupMap.values()).filter((el) => !!el.total),
    ["total"],
    [formData.orderByRank]
  );
  return res.slice(0, 20);
};

const dayAddAmountTop20_4 = computed(() => groupAndSum4("日增额"));
const dayAddCountTop20_4 = computed(() => groupAndSum4("日增量"));
const holdAmountTop20_4 = computed(() => groupAndSum4("持仓额"));

const dayAddAmountTop20_3 = computed(() => groupAndSum3("日增额"));
const dayAddCountTop20_3 = computed(() => groupAndSum3("日增量"));
const holdAmountTop20_3 = computed(() => groupAndSum3("持仓额"));

const holdAmountTop20_2 = computed(() => groupAndSum2("持仓额"));
const dayAddAmountTop20_2 = computed(() => groupAndSum2("日增额"));
const dayAddCountTop20_2 = computed(() => groupAndSum2("日增量"));
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
