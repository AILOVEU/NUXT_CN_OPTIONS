<template>
  <div v-loading="globalLoading.value" class="max-md:w-[255%]">
    <Nav />
    <div class="px-[50px]">
      <el-form size="small" :model="formData" label-width="auto" label-suffix=":">
        <div>
          <el-form-item label="正股">
            <TabSelectMult :options="stockOptions" v-model="formData.正股List" />
          </el-form-item>
          <el-form-item label="到期日" clearable>
            <TabSelectMult :options="deadline_list.map((el) => ({ label: el, value: el }))" v-model="formData.到期日List" />
          </el-form-item>
          <el-form-item label="沽购" clearable>
            <TabSelectMult :options="['沽', '购'].map((el) => ({ label: el, value: el }))" v-model="formData.沽购List" />
          </el-form-item>
          <el-form-item label="档位" clearable>
            <TabSelectMult :options="档位名称List.map((el) => ({ label: el, value: el }))" v-model="formData.档位名称List" />
          </el-form-item>
          <el-form-item label="排序" clearable>
            <TabSelect :options="orderByList.map((el) => ({ label: el, value: el }))" v-model="formData.orderBy" />
          </el-form-item>
          <el-form-item label="增降序" clearable>
            <TabSelect :options="增降序Ops" v-model="formData.orderByRank" />
          </el-form-item>
          <el-form-item label="过滤持有">
            <el-radio-group v-model="formData.过滤持有">
              <el-radio :value="'权利'">仅权利</el-radio>
              <el-radio :value="'义务'">仅义务</el-radio>
              <el-radio :value="'持有'">持有</el-radio>
              <el-radio :value="false">不过滤</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
      </el-form>
    </div>
    <div class="w-full flex mb-[12px] gap-[20px] justify-between">
      <!-- <div
        class="flex-1 border-[1px] leading-1 text-center cursor-pointer h-[25px] flex items-center justify-center"
        v-for="item in [
          { label: '列表', value: 'list' },
          { label: 'T型', value: 'symmetric' },
        ]"
        :class="{ active: item.value === showType }"
        @click="showType = item.value"
      >
        {{ item.label }}
      </div> -->
    </div>
    <FilterList v-if="showType === 'list'" :checkIsChance="checkIsChance" :showHold="false" :filterCount="20" :orderBy="formData.orderBy" :orderByRank="formData.orderByRank" :过滤持变字段="true" />
    <!-- <FilterSymmetric v-else-if="showType === 'symmetric'" :checkIsChance="checkIsChance" :key="JSON.stringify(formData)" /> -->
  </div>
</template>

<script setup>
import _ from "lodash";
import { useGlobal } from "~/stores/useGlobal.js";
import { deadline_list, OPTIONS_MAP } from "~/data";

const { globalLoading } = useGlobal();

const showType = ref("list");
const stockOptions = OPTIONS_MAP.map((el) => ({
  label: el.name,
  value: el.code,
}));
const 档位名称List = ref(["实5档", "实4档", "实3档", "实2档", "实1档", "平值", "虚1档", "虚2档", "虚3档", "虚4档", "虚5档"]);
const orderByList = ref(["持仓额", "持仓量", "日增额", "日增量"]);
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
// 表单数据 + 启用开关
const formData = reactive({
  // 其他筛选
  正股List: [...OPTIONS_MAP.map((el) => el.code)],
  到期日List: [...deadline_list],
  沽购List: ["沽", "购"],
  档位名称List: [],
  过滤持有: false,
  orderBy: orderByList.value[0],
  orderByRank: "desc",
});

// 核心筛选逻辑
function checkIsChance(target) {
  if (target["is旧期权"]) return false;
  if (formData.沽购List.length && !formData.沽购List.includes(target["沽购"])) return false;
  if (formData.正股List.length && !formData.正股List.includes(target["正股代码"])) return false;
  if (formData.到期日List.length && !formData.到期日List.includes(target["到期日"])) return false;
  if (formData.档位名称List.length && !formData.档位名称List.includes(target["档位名称"])) return false;

  if (formData.过滤持有 === "权利" && !(target["持仓"] > 0)) return false;
  if (formData.过滤持有 === "义务" && !(target["持仓"] < 0)) return false;
  if (formData.过滤持有 === "持有" && !target["持仓"]) return false;

  return true;
}
</script>

<style scoped>
.active {
  color: white;
  background-color: #409eff;
}
::v-deep(.el-form-item) {
  margin-bottom: 6px;
}
::v-deep(.el-radio-group) {
  justify-content: flex-start;
}
::v-deep(.el-table--small .cell) {
  padding: 0 0px 0 0 !important;
}
</style>
