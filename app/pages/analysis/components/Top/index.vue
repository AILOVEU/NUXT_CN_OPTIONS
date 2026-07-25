<template>
  <div>
    <!-- 筛选表单区域 -->
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

    <div class="bg-[gray]">
      <!-- 2分组维度 -->
      <GroupTableBlock
        table-prefix="2"
        :order-arrow-text="orderArrowText"
        :all-hold-count-list="allHoldCount_2"
        :all-hold-amount-list="allHoldAmount_2"
        :all-day-add-amount-list="allDayAddAmount_2"
        :all-day-add-count-list="allDayAddCount_2"
        :hold-count-list="holdCountTop20_2"
        :hold-amount-list="holdAmountTop20_2"
        :day-add-amount-list="dayAddAmountTop20_2"
        :day-add-count-list="dayAddCountTop20_2"
      />

      <!-- 3分组维度 -->
      <GroupTableBlock
        table-prefix="3"
        :order-arrow-text="orderArrowText"
        :all-hold-count-list="allHoldCount_3"
        :all-hold-amount-list="allHoldAmount_3"
        :all-day-add-amount-list="allDayAddAmount_3"
        :all-day-add-count-list="allDayAddCount_3"
        :hold-count-list="holdCountTop20_3"
        :hold-amount-list="holdAmountTop20_3"
        :day-add-amount-list="dayAddAmountTop20_3"
        :day-add-count-list="dayAddCountTop20_3"
      />

      <!-- 4分组维度 -->
      <GroupTableBlock
        table-prefix="4"
        :order-arrow-text="orderArrowText"
        :all-hold-count-list="allHoldCount_4"
        :all-hold-amount-list="allHoldAmount_4"
        :all-day-add-amount-list="allDayAddAmount_4"
        :all-day-add-count-list="allDayAddCount_4"
        :hold-count-list="holdCountTop20_4"
        :hold-amount-list="holdAmountTop20_4"
        :day-add-amount-list="dayAddAmountTop20_4"
        :day-add-count-list="dayAddCountTop20_4"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from "vue";
import { deadline_list, OPTIONS_MAP } from "~/data";
import _ from "lodash";
// 引入子组件
import GroupTableBlock from "./GroupTableBlock.vue";

// ========== 表单基础配置 ==========
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

// 升降序箭头
const orderArrowText = computed(() => {
  return formData.orderByRank === "desc" ? "↘" : "↗";
});

// 接收父页面传入原始数据
const props = defineProps({
  tiledData: {
    type: Array,
    default: () => [],
  },
});

// ========== 数据筛选 ==========
const filterTableData = computed(() => {
  return props.tiledData
    .filter((el) => formData.正股List.includes(el["正股代码"]))
    .filter((el) => formData.到期日List.includes(el["到期日"]))
    .filter((el) => formData.沽购List.includes(el["沽购"]));
});

// ========== 分组求和工厂函数（核心聚合逻辑） ==========
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
  return list;
};

// 三种分组key规则
const groupSum2 = createGroupAllList((item) => `${item.展示正股名称}_${item.沽购 === "沽" ? "🟢" : "🔴"}`);
const groupSum3 = createGroupAllList((item) => `${item.展示正股名称}_${item.沽购 === "沽" ? "🟢" : "🔴"}_${item.千行权价}(${item.档位名称})`);
const groupSum4 = createGroupAllList((item) => `${item.展示正股名称}_${item.沽购 === "沽" ? "🟢" : "🔴"}_${item.千行权价}(${item.档位名称})_${item.到期月份icon}`);

// ========== 完整聚合数据集合 ==========
// 2维度
const allHoldCount_2 = computed(() => groupSum2("持仓量"));
const allHoldAmount_2 = computed(() => groupSum2("持仓额"));
const allDayAddAmount_2 = computed(() => groupSum2("日增额"));
const allDayAddCount_2 = computed(() => groupSum2("日增量"));

// 3维度
const allHoldCount_3 = computed(() => groupSum3("持仓量"));

const allHoldAmount_3 = computed(() => groupSum3("持仓额"));
const allDayAddAmount_3 = computed(() => groupSum3("日增额"));
const allDayAddCount_3 = computed(() => groupSum3("日增量"));

// 4维度
const allHoldCount_4 = computed(() => groupSum4("持仓量"));

const allHoldAmount_4 = computed(() => groupSum4("持仓额"));
const allDayAddAmount_4 = computed(() => groupSum4("日增额"));
const allDayAddCount_4 = computed(() => groupSum4("日增量"));

// ========== 截取前20条渲染列表 ==========
// 2维
const holdCountTop20_2 = computed(() => allHoldCount_2.value.slice(0, 20));
const holdAmountTop20_2 = computed(() => allHoldAmount_2.value.slice(0, 20));
const dayAddAmountTop20_2 = computed(() => allDayAddAmount_2.value.slice(0, 20));
const dayAddCountTop20_2 = computed(() => allDayAddCount_2.value.slice(0, 20));

//3维
const holdCountTop20_3 = computed(() => allHoldCount_3.value.slice(0, 20));
const holdAmountTop20_3 = computed(() => allHoldAmount_3.value.slice(0, 20));
const dayAddAmountTop20_3 = computed(() => allDayAddAmount_3.value.slice(0, 20));
const dayAddCountTop20_3 = computed(() => allDayAddCount_3.value.slice(0, 20));

//4维
const holdCountTop20_4 = computed(() => allHoldCount_4.value.slice(0, 20));
const holdAmountTop20_4 = computed(() => allHoldAmount_4.value.slice(0, 20));
const dayAddAmountTop20_4 = computed(() => allDayAddAmount_4.value.slice(0, 20));
const dayAddCountTop20_4 = computed(() => allDayAddCount_4.value.slice(0, 20));
</script>
