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
          <el-form-item label="过滤持有">
            <el-radio-group v-model="formData.过滤持有">
              <el-radio :value="'权利'">仅权利</el-radio>
              <el-radio :value="'义务'">仅义务</el-radio>
              <el-radio :value="'持有'">持有</el-radio>
              <el-radio :value="false">不过滤</el-radio>
            </el-radio-group>
          </el-form-item>
          <template v-if="!formData.过滤持有">
            <!-- 一手价范围 + 勾选框 -->
            <el-form-item>
              <template #label>
                <el-checkbox v-model="formData.enable.一手价Range" label="一手价范围" />
              </template>
              <el-col :span="11">
                <span class="text-gray-500">最小值</span>
                <el-input placeholder="最小值" v-model="formData.一手价Range[0]" />
              </el-col>
              <el-col :span="2" class="text-center">
                <span class="text-gray-500">-</span>
              </el-col>
              <el-col :span="11">
                <span class="text-gray-500">最大值</span>
                <el-input placeholder="最大值" v-model="formData.一手价Range[1]" />
              </el-col>
            </el-form-item>

            <!-- 一手时间价范围 + 勾选框 -->
            <el-form-item>
              <template #label>
                <el-checkbox v-model="formData.enable.一手价时间价Range" label="一手时间价范围" />
              </template>
              <el-col :span="11">
                <span class="text-gray-500">最小值</span>
                <el-input placeholder="最小值" v-model="formData.一手价时间价Range[0]" />
              </el-col>
              <el-col :span="2" class="text-center">
                <span class="text-gray-500">-</span>
              </el-col>
              <el-col :span="11">
                <span class="text-gray-500">最大值</span>
                <el-input placeholder="最大值" v-model="formData.一手价时间价Range[1]" />
              </el-col>
            </el-form-item>

            <!-- 杠杆范围 + 勾选框 -->
            <el-form-item>
              <template #label>
                <el-checkbox v-model="formData.enable.杠杆Range" label="杠杆范围" />
              </template>
              <el-col :span="11">
                <span class="text-gray-500">最小值</span>
                <el-input placeholder="最小值" v-model="formData.杠杆Range[0]" />
              </el-col>
              <el-col :span="2" class="text-center">
                <span class="text-gray-500">-</span>
              </el-col>
              <el-col :span="11">
                <span class="text-gray-500">最大值</span>
                <el-input placeholder="最大值" v-model="formData.杠杆Range[1]" />
              </el-col>
            </el-form-item>

            <!-- Delta范围 + 勾选框 -->
            <el-form-item>
              <template #label>
                <el-checkbox v-model="formData.enable.DeltaRange" label="Delta范围" />
              </template>
              <el-col :span="11">
                <span class="text-gray-500">最小值</span>
                <el-input placeholder="最小值" v-model="formData.DeltaRange[0]" />
              </el-col>
              <el-col :span="2" class="text-center">
                <span class="text-gray-500">-</span>
              </el-col>
              <el-col :span="11">
                <span class="text-gray-500">最大值</span>
                <el-input placeholder="最大值" v-model="formData.DeltaRange[1]" />
              </el-col>
            </el-form-item>

            <!-- 隐波范围 + 勾选框 -->
            <el-form-item>
              <template #label>
                <el-checkbox v-model="formData.enable.隐波Range" label="隐波范围" />
              </template>
              <el-col :span="11">
                <span class="text-gray-500">最小值</span>
                <el-input placeholder="最小值" v-model="formData.隐波Range[0]" />
              </el-col>
              <el-col :span="2" class="text-center">
                <span class="text-gray-500">-</span>
              </el-col>
              <el-col :span="11">
                <span class="text-gray-500">最大值</span>
                <el-input placeholder="最大值" v-model="formData.隐波Range[1]" />
              </el-col>
            </el-form-item>

            <!-- Gamma范围 + 勾选框 -->
            <el-form-item>
              <template #label>
                <el-checkbox v-model="formData.enable.GammaRange" label="Gamma范围" />
              </template>
              <el-col :span="11">
                <span class="text-gray-500">最小值</span>
                <el-input placeholder="最小值" v-model="formData.GammaRange[0]" />
              </el-col>
              <el-col :span="2" class="text-center">
                <span class="text-gray-500">-</span>
              </el-col>
              <el-col :span="11">
                <span class="text-gray-500">最大值</span>
                <el-input placeholder="最大值" v-model="formData.GammaRange[1]" />
              </el-col>
            </el-form-item>

            <!-- 溢价范围 + 勾选框 -->
            <el-form-item>
              <template #label>
                <el-checkbox v-model="formData.enable.溢价Range" label="溢价范围" />
              </template>
              <el-col :span="11">
                <span class="text-gray-500">最小值</span>
                <el-input placeholder="最小值" v-model="formData.溢价Range[0]" />
              </el-col>
              <el-col :span="2" class="text-center">
                <span class="text-gray-500">-</span>
              </el-col>
              <el-col :span="11">
                <span class="text-gray-500">最大值</span>
                <el-input placeholder="最大值" v-model="formData.溢价Range[1]" />
              </el-col>
            </el-form-item>
          </template>
        </div>
      </el-form>
    </div>
    <div class="w-full flex mb-[12px] gap-[20px] justify-between">
      <div
        class="flex-1 border-[1px] leading-1 text-center cursor-pointer h-[25px] flex items-center justify-center"
        v-for="item in [
          { label: '列表', value: 'list' },
          { label: 'T型', value: 'symmetric' },
        ]"
        :class="{ active: item.value === showType }"
        @click="showType = item.value"
      >
        {{ item.label }}
      </div>
    </div>
    <FilterList v-if="showType === 'list'" :checkIsChance="checkIsChance" :showHold="false" />
    <FilterSymmetric v-else-if="showType === 'symmetric'" :checkIsChance="checkIsChance" :key="JSON.stringify(formData)" />
  </div>
</template>

<script setup>
import _ from "lodash";
import { useGlobal } from "~/stores/useGlobal.js";
import FilterSymmetric from "./components/FilterSymmetric.vue";
import { deadline_list, OPTIONS_MAP } from "~/data";

const { globalLoading } = useGlobal();

const showType = ref("list");
const stockOptions = OPTIONS_MAP.map((el) => ({
  label: el.name,
  value: el.code,
}));

// 表单数据 + 启用开关
const formData = reactive({
  // 启用开关（6个范围）
  enable: {
    一手价Range: true,
    一手价时间价Range: true,
    杠杆Range: true,
    DeltaRange: false,
    隐波Range: false,
    GammaRange: false,
    溢价Range: false,
  },
  // 范围值
  杠杆Range: [20, 9999],
  溢价Range: [-100, 10],
  一手价Range: [0, 3000],
  一手价时间价Range: [0, 3000],
  DeltaRange: [0.25, 1],
  隐波Range: [0, 20],
  GammaRange: [0.5, 9999],
  // 其他筛选
  正股List: [...OPTIONS_MAP.map((el) => el.code)],
  到期日List: [...deadline_list],
  沽购List: ["沽", "购"],
  过滤持有: false,
});

// 核心筛选逻辑
function checkIsChance(target) {
  if (target["is旧期权"]) return false;
  if (!formData.沽购List.includes(target["沽购"])) return false;
  if (!formData.正股List.includes(target["正股代码"])) return false;
  if (!formData.到期日List.includes(target["到期日"])) return false;

  if (formData.过滤持有 === "权利" && !(target["持仓"] > 0)) return false;
  if (formData.过滤持有 === "义务" && !(target["持仓"] < 0)) return false;
  if (formData.过滤持有 === "持有" && !target["持仓"]) return false;

  // 一手价范围（勾选才生效）
  if (formData.enable.一手价Range) {
    if (!(target["一手价"] <= formData.一手价Range[1] && target["一手价"] >= formData.一手价Range[0])) return false;
  }

  // 一手时间价范围（勾选才生效）
  if (formData.enable.一手价时间价Range) {
    if (!(target["一手时间价"] <= formData.一手价时间价Range[1] && target["一手时间价"] >= formData.一手价时间价Range[0])) return false;
  }

  // 杠杆范围（勾选才生效）
  if (formData.enable.杠杆Range) {
    if (!(Math.abs(target["杠杆"]) <= formData.杠杆Range[1] && Math.abs(target["杠杆"]) >= formData.杠杆Range[0])) return false;
  }

  // Delta范围（勾选才生效）
  if (formData.enable.DeltaRange) {
    if (!(Math.abs(target["Delta"]) <= formData.DeltaRange[1] && Math.abs(target["Delta"]) >= formData.DeltaRange[0])) return false;
  }

  // 隐波范围（勾选才生效）
  if (formData.enable.隐波Range) {
    if (!(target["隐波"] <= formData.隐波Range[1] && target["隐波"] >= formData.隐波Range[0])) return false;
  }

  // Gamma范围（勾选才生效）
  if (formData.enable.GammaRange) {
    if (!(Math.abs(target["Gamma"]) <= formData.GammaRange[1] && Math.abs(target["Gamma"]) >= formData.GammaRange[0])) return false;
  }

  // 溢价范围（勾选才生效）
  if (formData.enable.溢价Range) {
    if (!(target["溢价率"] <= formData.溢价Range[1] && target["溢价率"] >= formData.溢价Range[0])) return false;
  }

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
