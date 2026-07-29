<template>
  <div class="p-6 mx-auto" v-loading="tableData.loading">
    <el-input v-model="formData.top" />
    <!-- 筛选分组区域 -->
    <div class="border rounded-lg p-2 mb-1 bg-gray-50">
      <div class="flex justify-between items-center mb-4">
        <span class="font-medium">筛选条件分组</span>
        <div class="flex gap-3">
          <button @click="addGroup" class="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">+ 新增条件组</button>
          <button @click="resetAll" class="px-3 py-1.5 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">重置全部筛选</button>
        </div>
      </div>
      <!-- 遍历每一个条件组 -->
      <div v-for="(group, groupIdx) in groupList" :key="groupIdx" class="border border-blue-200 rounded-md p-2 mb-2 bg-white">
        <div class="flex justify-between items-center mb-3">
          <span class="text-sm font-semibold text-blue-600"> 第{{ groupIdx + 1 }}组（组内条件全部满足） </span>
          <div class="flex gap-2">
            <button @click="addRule(groupIdx)" class="px-2 py-1 bg-green-500 text-white rounded text-xs">添加本组条件</button>
            <button v-if="groupList.length > 1" @click="delGroup(groupIdx)" class="px-2 py-1 bg-red-400 text-white rounded text-xs">删除整组</button>
          </div>
        </div>

        <!-- 组内多条且条件 -->
        <div class="flex flex-col gap-3">
          <div v-for="(rule, ruleIdx) in group.rules" :key="ruleIdx" class="flex flex-nowrap items-center gap-3 relative">
            <div v-if="ruleIdx > 0" class="text-gray-400 text-[12px] font-bold absolute left-[-15px]">且</div>

            <!-- 筛选字段选择 -->
            <select v-model="rule.field" class="border px-2 py-1 rounded text-sm w-36">
              <option value="正股代码">期权标的（多选）</option>
              <option value="到期日">期权到期日（多选）</option>
              <option value="沽购">期权沽购（单选）</option>
            </select>

            <div class="basis-[80%]">
              <!-- 多选 期权标的 -->
              <TabSelectMult v-if="rule.field === '正股代码'" :options="filter1Opts" v-model="rule.value" />

              <!-- 多选 期权到期日 -->
              <TabSelectMult v-if="rule.field === '到期日'" :options="filter2Opts.map((el) => ({ label: el, value: el }))" v-model="rule.value" />

              <!-- 单选 期权沽购 -->
              <TabSelect v-if="rule.field === '沽购'" :options="filter3Opts.map((el) => ({ label: el, value: el }))" v-model="rule.value" />
            </div>

            <!-- 删除单条条件 -->
            <button @click="delRule(groupIdx, ruleIdx)" class="px-2 py-1 bg-red-400 text-white rounded text-xs">删除</button>
          </div>
        </div>

        <!-- 组之间分隔提示：组1 或者 组2 -->
        <!-- <div v-if="groupIdx !== groupList.length - 1" class="text-center my-3 text-lg font-bold text-gray-500">｜ 或者 ｜</div> -->
      </div>

      <div class="mt-2 text-sm text-gray-500">规则：任意一组内所有条件都满足，数据就会被筛选出来</div>
    </div>
    <!-- 筛选结果表格 -->
    <div>
      <h3 class="font-medium mb-2">筛选结果：共 {{ filterData.length }} 条数据</h3>
      <FilterList :checkIsChance="() => true" :data="filterData.slice(0, formData.top)" :showHold="false" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps } from "vue";
import { OPTIONS_MAP, deadline_list } from "~/data";

const formData = reactive({
  top: 20,
});
const tableData = reactive({
  tiledData: [],
  loading: false,
});
async function handleQuery() {
  tableData.loading = true;
  const [tiledData] = await get_http_data(OPTIONS_MAP.map((el) => el.code));
  tableData.tiledData = tiledData;
  tableData.loading = false;
}
handleQuery();

// 筛选下拉选项配置
const filter1Opts = ref(
  OPTIONS_MAP.map((el) => ({
    value: el.code,
    label: el.showName,
  }))
);
const filter2Opts = ref([...deadline_list]);
const filter3Opts = ref(["沽", "购"]);

/**
   * 数据结构定义
   * groupList: 条件组数组，组间 OR
   * 每一组：{ rules: [规则数组] }
   * 每条规则：
      { field: 'filter1'|'filter2'|'filter3', value: 多选[] / 单选字符串 }
   * 组内所有规则：AND 并且关系
   */
const groupList = ref([
  // 默认初始化一组空条件，可自行删除
  { rules: [] },
]);

// 新增一个条件组
const addGroup = () => {
  groupList.value.push({ rules: [] });
};

// 删除整个条件组
const delGroup = (gIdx) => {
  groupList.value.splice(gIdx, 1);
};

// 给指定组内添加一条筛选规则
const addRule = (gIdx) => {
  groupList.value[gIdx].rules.push({
    field: "正股代码",
    value: [],
  });
};

// 删除组内单条规则
const delRule = (gIdx, rIdx) => {
  groupList.value[gIdx].rules.splice(rIdx, 1);
};

// 重置所有筛选
const resetAll = () => {
  groupList.value = [{ rules: [] }];
};

// 核心计算属性：过滤数据
const filterData = computed(() => {
  const source = tableData.tiledData;
  // 无任何筛选条件，返回全部数据
  const totalRules = groupList.value.reduce((sum, g) => sum + g.rules.length, 0);
  if (totalRules === 0) return source;

  return source.filter((row) => {
    // 只要任意一个组完全满足，数据就通过（组之间 OR）
    return groupList.value.some((group) => {
      // 组内所有规则必须全部满足（组内 AND）
      return group.rules.every((rule) => {
        const { field, value } = rule;
        // 未选择筛选值，本条规则直接放行
        if (Array.isArray(value) && value.length === 0) return true;
        if (!Array.isArray(value) && !value) return true;

        switch (field) {
          case "正股代码":
            // 多选：数据包含任意勾选项即匹配
            return value.some((v) => row.正股代码.includes(v));
          case "到期日":
            return value.some((v) => row.到期日.includes(v));
          case "沽购":
            // 单选：精准相等
            return row.沽购 === value;
          default:
            return true;
        }
      });
    });
  });
});
</script>
