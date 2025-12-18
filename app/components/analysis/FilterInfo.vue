<template>
  <div>
    <el-form :model="formData" label-width="auto" style="max-width: 600px" label-suffix=":">
      <div>
        <el-form-item label="正股">
          <el-select v-model="formData.正股List" multiple>
            <el-option v-for="item in stockOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="到期日">
          <el-select v-model="formData.到期日List" multiple>
            <el-option v-for="date in deadline_list" :key="date" :label="date" :value="date" />
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
  <div class="w-full flex">
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

  <div v-if="showType === 'list'" class="w-full min-h-[calc(100vh-400px)] mb-[100px]">
    <el-table :data="filteredTableData" style="width: 100%" size="small" border stripe height="100%" :highlight-current-row="false" ref="tableRef">
      <el-table-column label="序" width="40" align="center" fixed="left">
        <template #default="{ $index }">
          <div class="text-[10px]">{{ $index + 1 }}</div>
        </template>
      </el-table-column>
      <el-table-column v-for="{ label, width, fixed } in tableColumns" :key="label" :prop="label" :width="width" :minWidth="100" align="center" sortable :fixed="fixed">
        <template #header>
          {{ label }}
        </template>

        <template #default="{ row }" v-if="label === '一手涨跌价'">
          {{ row["一手涨跌价"] }}
        </template>
        <template #default="{ row }" v-else-if="label === '沽购'">
          <CallPutTag :沽购="row[label]" />
        </template>
        <template #default="{ row }" v-else-if="label === '隐波'">
          <IvTag :隐波="row[label]" />
        </template>
        <template #default="{ row }" v-else-if="label === '组合'">
          {{ row["组合"] ? "是" : "" }}
        </template>
        <template #default="{ row }" v-else-if="label === '持仓'">
          {{ row["持仓"] || "" }}
        </template>
        <template #default="{ row }" v-else>
          {{ row[label] }}
        </template>
      </el-table-column>
    </el-table>
  </div>
  <Hold v-else-if="showType === 't'" mode="chance" :formData="formData" />
</template>
<script setup>
import IvTag from "~/components/tag/IvTag.vue";
import CallPutTag from "~/components/tag/CallPutTag.vue";
import Hold from "~/pages/hold.vue";
import { deadline_list, stock_sorted_list, stock_code_map, 最大建议买入价 } from "~/data";
import _ from "lodash";
const props = defineProps(["all_data"]);
const showType = ref("list");
const stockOptions = stock_sorted_list.map((el) => ({
  label: stock_code_map[el],
  value: el,
}));
const formData = reactive({
  溢价Range: [-100, 15],
  一手价Range: [0, 最大建议买入价],
  DeltaRange: [0.15, 1],
  隐波Range: [0, 23],
  GammaRange: [0.5, 9999],
  正股List: [...stock_sorted_list],
  到期日List: [...deadline_list].filter((el, index) => index),
  过滤持有: false,
});
const tableColumns = [
  {
    width: "170px",
    label: "期权名称",
    fixed: "left",
  },
  {
    label: "一手价",
  },
  {
    label: "一手涨跌价",
  },
  {
    label: "Delta",
  },
  {
    label: "隐波",
  },
  {
    label: "Gamma",
  },
  {
    label: "持仓",
  },
  {
    label: "杠杆",
  },
  {
    label: "溢价率",
  },
  {
    label: "沽购",
  },
  {
    label: "组合",
  },
  {
    label: "行权价",
  },
  {
    label: "正股",
  },
  {
    label: "正股价格",
  },
  {
    label: "到期天数",
  },
];
const filteredTableData = computed(() => {
  let filtered =
    props.all_data
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
