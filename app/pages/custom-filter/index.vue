<template>
  <div v-loading="globalLoading.value" class="max-md:w-[255%]">
    <Nav />
    <div class="mx-[20px]">
      <el-form size="small" :model="formData" label-width="auto" label-suffix=":">
        <div>
          <el-form-item label="正股">
            <TabSelectMult :options="stockOptions" v-model="formData.正股List" />
          </el-form-item>
          <!-- 
          <el-form-item label="到期日" clearable>
            <el-select v-model="formData.到期日List" multiple>
              <el-option v-for="date in deadline_list" :key="date" :label="date" :value="date" />
            </el-select>
          </el-form-item> -->
          <el-form-item label="沽购" clearable>
            <TabSelectMult :options="['沽', '购'].map((el) => ({ label: el, value: el }))" v-model="formData.沽购List" />
            <!-- <el-select v-model="formData.沽购List" multiple>
              <el-option v-for="call in ['沽', '购']" :key="call" :label="call" :value="call" />
            </el-select> -->
          </el-form-item>
          <!-- <el-form-item label="过滤持有">
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
          </template> -->
        </div>
      </el-form>
    </div>
    <div class="w-full flex mb-[12px] gap-[20px] justify-between mx-[20px]">
      <div
        class="flex-1 border-[1px] leading-1 text-center cursor-pointer h-[25px] flex items-center justify-center"
        v-for="item in [
          { label: '列表', value: 'list' },
          { label: 'T型', value: 'symmetric' },
          // { label: '全部', value: 'all' },
        ]"
        :class="{ active: item.value === showType }"
        @click="showType = item.value"
      >
        {{ item.label }}
      </div>
    </div>
    <div v-if="showType === 'list'" class="h-[calc(100vh-250px)] max-md:h-[calc(200vh-300px)] mb-[100px] overflow-auto gap-[20px] flex flex-col">
      <div class="flex justify-center">彩票</div>
      <FilterList :checkIsChance="checkIsChance彩票" />
      <div class="flex justify-center">短期</div>
      <FilterList :checkIsChance="checkIsChance短期" />
      <div class="flex justify-center">中期</div>
      <FilterList :checkIsChance="checkIsChance中期" />
      <div class="flex justify-center">远期</div>
      <FilterList :checkIsChance="checkIsChance远期" />
    </div>
    <FilterSymmetric v-else-if="showType === 'symmetric'" :checkIsChance="checkIsChance" :key="JSON.stringify(formData)" />
    <FilterList v-else-if="showType === 'all'" :checkIsChance="() => true" />
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
  沽购List: ["购",'沽'],
  过滤持有: false,
});
function checkIsChance彩票(target) {
  if (target["is旧期权"]) return false;
  if (!formData.沽购List.includes(target["沽购"])) return false;
  if (!formData.正股List.includes(target["正股代码"])) return false;

  // if (target["到期天数"] > 10) return false;
  if (target["一手价"] >= 200) return false;
  if (target["溢价率"] >= 1.5) return false;
  return true;
}
// 短期不关注隐波，只关注溢价率和价格
function checkIsChance短期(target) {
  if (target["is旧期权"]) return false;
  if (!formData.沽购List.includes(target["沽购"])) return false;
  if (!formData.正股List.includes(target["正股代码"])) return false;

  if (target["到期天数"] > 45 || target["到期天数"] <= 10) return false;
  if (target["一手价"] >= 500) return false;
  if (target["一手时间价"] >= 400) return false;
  if (target["一手内在价"] >= 400) return false;
  if (target["溢价率"] >= 3 && Math.abs(target["Delta"]) < 0.2) return false;
  return true;
}
function checkIsChance中期(target) {
  const OpsItem = OPTIONS_MAP.find((item) => item.code === target["正股代码"]);
  if (target["is旧期权"]) return false;
  if (!formData.沽购List.includes(target["沽购"])) return false;
  if (!formData.正股List.includes(target["正股代码"])) return false;
  // if (target["沽购"] === "购") {
  //   if (target["千行权价"] >= OpsItem.行权价Range[1]) return false;
  // }

  if (target["到期天数"] <= 45 || target["到期天数"] >= 90) return false;
  if (target["一手价"] >= 1000) return false;
  if (target["一手时间价"] >= 500) return false;
  if (target["溢价率"] >= 10) return false;
  // 实值不关注隐波
  if (target["隐波"] >= OpsItem.隐波Max && target["一手时间价"] >= 500 && target["一手内在价"] > 0) return false;
  return true;
}
function checkIsChance远期(target) {
  const OpsItem = OPTIONS_MAP.find((item) => item.code === target["正股代码"]);
  if (target["is旧期权"]) return false;
  if (!formData.沽购List.includes(target["沽购"])) return false;
  if (!formData.正股List.includes(target["正股代码"])) return false;
  // if (target["沽购"] === "购") {
  //   if (target["千行权价"] >= OpsItem.行权价Range[1]) return false;
  // }

  if (target["到期天数"] < 90) return false;
  if (target["一手价"] >= 1500) return false;
  if (target["一手时间价"] >= 1000) return false;
  if (target["溢价率"] >= 20) return false;
  // 实值不关注隐波
  if (target["隐波"] >= OpsItem.隐波Max && target["一手时间价"] >= 500 && target["一手内在价"] > 0) return false;
  return true;
}

function checkIsChance(target) {
  if (checkIsChance彩票(target)) return true;
  if (checkIsChance短期(target)) return true;
  if (checkIsChance中期(target)) return true;
  if (checkIsChance远期(target)) return true;
  return false;
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
