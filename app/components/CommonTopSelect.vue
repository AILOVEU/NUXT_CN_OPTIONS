<template>
  <el-form size="small" :model="localFormData" label-width="auto" label-suffix=":">
    <el-form-item label="正股">
      <TabSelectMult :options="stockOptions" v-model="localFormData.正股List" />
    </el-form-item>
    <el-form-item label="到期日">
      <TabSelectMult :options="deadline_list.map((el) => ({ label: el, value: el }))" v-model="localFormData.到期日List" />
    </el-form-item>
    <el-form-item label="沽购">
      <TabSelectMult :options="['沽', '购'].map((el) => ({ label: el, value: el }))" v-model="localFormData.沽购List" />
    </el-form-item>
    <el-form-item label="档位" clearable>
      <TabSelectMult :options="档位名称List.map((el) => ({ label: el, value: el }))" v-model="localFormData.档位名称List" />
    </el-form-item>
  </el-form>
</template>

<script setup>
import { reactive, watch } from "vue";
import { deadline_list, OPTIONS_MAP } from "~/data";
// 静态数据
const 档位名称List = ["实5档", "实4档", "实3档", "实2档", "实1档", "平值", "虚1档", "虚2档", "虚3档", "虚4档", "虚5档"];
const stockOptions = OPTIONS_MAP.map((el) => ({
  label: el.name,
  value: el.code,
}));
// 1. 组件内部定义所有默认值（唯一权威来源）
const DEFAULT_FORM_DATA = {
  正股List: OPTIONS_MAP.map((el) => el.code),
  到期日List: [...deadline_list],
  沽购List: ["沽", "购"],
  档位名称List: [],
};

// 2. 定义 v-model props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
});

// 3. 定义更新事件
const emit = defineEmits(["update:modelValue"]);

// 4. 本地表单数据（初始化为组件内部默认值）
const localFormData = reactive({ ...DEFAULT_FORM_DATA });
emit("update:modelValue", { ...localFormData });

// 5. 监听父组件传入的值，合并到本地（父组件传入的字段优先，缺失的保留默认值）
watch(
  () => props.modelValue,
  (parentData) => {
    if (parentData && typeof parentData === "object") {
      // 逐个字段合并，不破坏组件内部默认值结构
      Object.keys(DEFAULT_FORM_DATA).forEach((key) => {
        if (parentData[key] !== undefined) {
          localFormData[key] = parentData[key];
        }
      });
    }
  },
  { immediate: true, deep: true }
);

// 6. 监听本地数据变化，同步回父组件
watch(
  localFormData,
  (newData) => {
    emit("update:modelValue", { ...newData });
  },
  { deep: true }
);
</script>
