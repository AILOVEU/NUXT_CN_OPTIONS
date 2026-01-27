<template>
  <div v-loading="globalLoading.value" class="max-md:w-[255%]">
    <Nav />
    <div>
      <el-form size="small" :model="formData" label-width="auto" label-suffix=":">
        <div>
          <el-form-item label="正股">
            <el-select v-model="formData.正股List" multiple allowClear clearable>
              <el-option v-for="item in stockOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="到期日" clearable>
            <el-select v-model="formData.到期日List" multiple>
              <el-option v-for="date in deadline_list" :key="date" :label="date" :value="date" />
            </el-select>
          </el-form-item>
          <el-form-item label="沽购" clearable>
            <el-select v-model="formData.沽购List" multiple>
              <el-option v-for="call in ['沽', '购']" :key="call" :label="call" :value="call" />
            </el-select>
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
            <el-form-item label="一手价范围">
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
            <el-form-item label="一手时间价范围">
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
            <el-form-item label="Delta范围">
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
            <el-form-item label="隐波范围">
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
            <el-form-item label="Gamma范围">
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
            <el-form-item label="溢价范围">
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
    <FilterList v-if="showType === 'list'" :checkIsChance="checkIsChance" />
    <FilterSymmetric v-else-if="showType === 'symmetric'" :checkIsChance="checkIsChance" />
  </div>
</template>
<script setup>
import _ from "lodash";
import { useGlobal } from "~/stores/useGlobal.js";
import FilterList from "./components/FilterList.vue";
import FilterSymmetric from "./components/FilterSymmetric.vue";
import { deadline_list, OPTIONS_MAP, 建议买入价, 最大建议买入时间价 } from "~/data";

const { globalLoading } = useGlobal();

const showType = ref("list");
const stockOptions = OPTIONS_MAP.map((el) => ({
  label: el.name,
  value: el.code,
}));
const formData = reactive({
  溢价Range: [-100, 15],
  一手价Range: [0, 建议买入价],
  一手价时间价Range: [0, 最大建议买入时间价],
  DeltaRange: [0.15, 1],
  隐波Range: [0, 23],
  GammaRange: [0.5, 9999],
  正股List: [...OPTIONS_MAP.map((el) => el.code)],
  到期日List: [...deadline_list],
  沽购List: ["沽", "购"],
  过滤持有: false,
});

function checkIsChance(target) {
  if (target["is旧期权"]) return false;
  if (!formData.沽购List.includes(target["沽购"])) return false;
  if (!formData.正股List.includes(target["正股代码"])) return false;
  if (!formData.到期日List.includes(target["到期日"])) return false;
  if (formData.过滤持有 === "权利" && !(target["持仓"] > 0)) return false;
  if (formData.过滤持有 === "义务" && !(target["持仓"] < 0)) return false;
  if (formData.过滤持有 === "持有" && !target["持仓"]) return false;
  if (!(target["一手价"] <= formData.一手价Range[1] && target["一手价"] >= formData.一手价Range[0])) return false;
  if (!(target["一手时间价"] <= formData.一手价时间价Range[1] && target["一手时间价"] >= formData.一手价时间价Range[0])) return false;
  if (!(Math.abs(target["Delta"]) <= formData.DeltaRange[1] && Math.abs(target["Delta"]) >= formData.DeltaRange[0])) return false;
  if (!(target["隐波"] <= formData.隐波Range[1] && target["隐波"] >= formData.隐波Range[0])) return false;
  if (!(Math.abs(target["Gamma"]) <= formData.GammaRange[1] && Math.abs(target["Gamma"]) >= formData.GammaRange[0])) return false;
  if (!(target["溢价率"] <= formData.溢价Range[1] && target["溢价率"] >= formData.溢价Range[0])) return false;
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
  padding: 0 6px 0 0 !important;
}
</style>
