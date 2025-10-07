<template>
  <div>
    <el-form
      :model="formData"
      label-width="auto"
      style="max-width: 600px"
      label-suffix=":"
    >
      <el-form-item label="到期日">
        <el-select v-model="formData.到期日List" multiple>
          <el-option
            v-for="date in deadline_list"
            :key="date"
            :label="date"
            :value="date"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="最新价范围">
        <el-col :span="11">
          <span class="text-gray-500">最小值</span>
          <el-input placeholder="最小值" v-model="formData.最新价Range[0]" />
        </el-col>
        <el-col :span="2" class="text-center">
          <span class="text-gray-500">-</span>
        </el-col>
        <el-col :span="11">
          <span class="text-gray-500">最大值</span>
          <el-input placeholder="最大值" v-model="formData.最新价Range[1]" />
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
      <!-- <el-form-item label="过滤当月期权">
        <el-radio-group v-model="formData.过滤当月">
          <el-radio :value="true">是</el-radio>
          <el-radio :value="false">否</el-radio>
        </el-radio-group>
      </el-form-item> -->
    </el-form>
  </div>
  <div class="w-full h-[calc(100vh-400px)]">
    <el-table
      :data="filteredTableData"
      style="width: 100%"
      size="small"
      border
      height="100%"
      :highlight-current-row="false"
      ref="tableRef"
    >
      <el-table-column
        v-for="{ label, width } in tableColumns"
        :key="label"
        :prop="label"
        :width="width"
        align="center"
        sortable
      >
        <template #header>
          {{ label }}
        </template>
        <template #default="{ row }" v-if="label === '最新价'">
          {{ Math.floor(row[label] * UNIT) }}
        </template>
        <template #default="{ row }" v-else>
          {{ row[label] }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script setup>
import dayjs from "dayjs";
import { UNIT, deadline_list } from "~/data";
const props = defineProps(["all_data"]);
const formData = reactive({
  最新价Range: [0, 400],
  DeltaRange: [0, 1],
  隐波Range: [0, 23],
  GammaRange: [1, 9999],
  到期日List: [...deadline_list].filter((el, index) => index),
});
const tableColumns = [
  {
    label: "期权名称",
  },
  {
    label: "最新价",
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
  return (
    props.all_data
      ?.filter((el) => {
        return (
          el["最新价"] * UNIT <= formData.最新价Range[1] &&
          el["最新价"] * UNIT >= formData.最新价Range[0]
        );
      })
      ?.filter((el) => {
        return (
          Math.abs(el["Delta"]) <= formData.DeltaRange[1] &&
          Math.abs(el["Delta"]) >= formData.DeltaRange[0]
        );
      })
      ?.filter((el) => {
        return (
          el["隐波"] <= formData.隐波Range[1] &&
          el["隐波"] >= formData.隐波Range[0]
        );
      })
      ?.filter((el) => {
        return (
          Math.abs(el["Gamma"]) <= formData.GammaRange[1] &&
          Math.abs(el["Gamma"]) >= formData.GammaRange[0]
        );
      })
      ?.filter((el) => {
        return formData.到期日List.includes(el["到期日"]);
      }) || []
  );
});
</script>
