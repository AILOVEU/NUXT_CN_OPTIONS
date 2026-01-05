<template>
  <div>
    <el-form :model="formData" label-width="auto" label-suffix=":">
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
  <div class="w-full flex mb-[12px]">
    <div
      class="flex-1 border-[1px] leading-1 text-center mx-[10px]"
      v-for="item in [
        { label: '列表', value: 'list' },
        { label: 'T型', value: 't' },
      ]"
      :class="{ active: item.value === showType }"
      @click="showType = item.value"
    >
      {{ item.label }}
    </div>
  </div>

  <div v-if="showType === 'list'" class="h-[calc(100vh-168px)] max-md:h-[calc(200vh-300px)] mb-[100px] flex justify-center">
    <div class="mx-auto overflow-x-auto">
      <el-table :data="filteredTableData" size="small" border stripe height="100%" :highlight-current-row="false" ref="tableRef">
        <el-table-column label="序" width="40" align="center" fixed="left" #default="{ $index }">
          <div class="text-[10px]">{{ $index + 1 }}</div>
        </el-table-column>
        <el-table-column label="期权名称" prop="期权名称" width="150" sortable align="left" fixed="left" />

        <el-table-column #default="{ row }" label="一手价" prop="一手价" width="70" sortable align="right" />
        <el-table-column #default="{ row }" label="一手涨跌价" prop="一手涨跌价" width="90" sortable align="right" />

        <el-table-column label="基本信息" align="center">
          <el-table-column #default="{ row }" label="正股" prop="正股" width="90" sortable align="right" />
          <el-table-column #default="{ row }" label="沽购" prop="沽购" width="60" sortable align="right">
            <TagCallPut :沽购="row['沽购']" />
          </el-table-column>
          <el-table-column label="到期天数" prop="到期天数" width="80" sortable align="right" />
        </el-table-column>

        <el-table-column label="溢价信息" align="center">
          <el-table-column #default="{ row }" label="打和点" prop="打和点" width="70" sortable align="right">
            {{ row["打和点"].toFixed(4) }}
          </el-table-column>

          <el-table-column label="正股价格" prop="正股价格" width="80" sortable align="right" />
          <el-table-column label="行权价" prop="千行权价" width="80" sortable align="right" />
          <el-table-column #default="{ row }" label="溢价率" prop="溢价率" width="75" sortable align="right"> <TagPremium :溢价率="row['溢价率']" /> </el-table-column>
          <el-table-column #default="{ row }" label="杠杆" prop="杠杆" width="75" sortable align="right"><TagLeverage :杠杆="row['杠杆']" /> </el-table-column>
        </el-table-column>

        <el-table-column label="希腊字母" align="center">
          <el-table-column #default="{ row }" label="隐波" prop="隐波" width="75" sortable align="right">
            <TagIv :隐波="row['隐波']" />
          </el-table-column>
          <el-table-column #default="{ row }" label="Delta" prop="Delta" width="85" sortable align="right">
            <TagDelta :Delta="row['Delta']" />
          </el-table-column>

          <el-table-column #default="{ row }" label="Gamma" prop="Gamma" width="90" sortable align="right">
            <TagGamma :Gamma="row['Gamma']" />
          </el-table-column>
        </el-table-column>

        <el-table-column label="持仓信息" align="center">
          <el-table-column #default="{ row }" label="持仓" prop="持仓" width="60" sortable align="right">
            {{ row["持仓"] || "" }}
          </el-table-column>
          <el-table-column #default="{ row }" label="组合" prop="组合" width="60" sortable align="left">
            {{ row["组合"] ? "是" : "" }}
          </el-table-column>
        </el-table-column>
      </el-table>
    </div>
  </div>
  <Hold v-else-if="showType === 't'" mode="chance" :formData="formData" />
</template>
<script setup>
import Hold from "~/pages/hold/index.vue";
import { deadline_list, OPTIONS_MAP, 最大建议买入价 } from "~/data";
import _ from "lodash";
const props = defineProps(["all_data"]);
const showType = ref("list");
const stockOptions = OPTIONS_MAP.map((el) => ({
  label: el.name,
  value: el.code,
}));
const formData = reactive({
  溢价Range: [-100, 15],
  一手价Range: [0, 最大建议买入价],
  DeltaRange: [0.15, 1],
  隐波Range: [0, 23],
  GammaRange: [0.5, 9999],
  正股List: [...OPTIONS_MAP.map((el) => el.code)],
  到期日List: [...deadline_list],
  沽购List: ["沽", "购"],
  过滤持有: false,
});
const filteredTableData = computed(() => {
  let filtered =
    props.all_data
      ?.filter((el) => {
        return !el["is旧期权"];
      })
      ?.filter((el) => {
        return formData.沽购List.includes(el["沽购"]);
      })
      ?.filter((el) => {
        return formData.正股List.includes(el["正股代码"]);
      })
      ?.filter((el) => {
        return formData.到期日List.includes(el["到期日"]);
      }) || [];
  if (formData.过滤持有)
    return filtered.filter((el) => {
      if (formData.过滤持有 === "权利") return el["持仓"] > 0;
      if (formData.过滤持有 === "义务") return el["持仓"] < 0;
      if (formData.过滤持有 === "持有") return el["持仓"];
    });
  filtered = filtered
    .filter((el) => {
      return el["一手价"] <= formData.一手价Range[1] && el["一手价"] >= formData.一手价Range[0];
    })
    .filter((el) => {
      return Math.abs(el["Delta"]) <= formData.DeltaRange[1] && Math.abs(el["Delta"]) >= formData.DeltaRange[0];
    })
    .filter((el) => {
      return el["隐波"] <= formData.隐波Range[1] && el["隐波"] >= formData.隐波Range[0];
    })
    .filter((el) => {
      return Math.abs(el["Gamma"]) <= formData.GammaRange[1] && Math.abs(el["Gamma"]) >= formData.GammaRange[0];
    })
    .filter((el) => {
      return el["溢价率"] <= formData.溢价Range[1] && el["溢价率"] >= formData.溢价Range[0];
    });
  // 越大越好：Gamma、Delta（Gamma不会骗人）
  // 越小越好：一手价、隐波（价格是隐波的反应）
  filtered = _.sortBy(filtered, (row) => Math.abs(row["一手价"] / (row["Gamme"] * row["Delta"])));
  return filtered;
});
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
</style>
