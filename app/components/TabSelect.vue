<template>
  <div class="w-full flex">
    <div class="flex-1 border-[1px] leading-1 text-center mx-[10px] cursor-pointer h-[25px] flex items-center justify-center" v-for="item in props.options" :class="{ active: item.value === modelValue }" @click="modelValue = item.value">
      {{ item.label }}
    </div>
  </div>
</template>
<script setup>
const props = defineProps(["options", "modelValue"]);
const emits = defineEmits(["update:modelValue", "click"]);
const modelValue = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emits("update:modelValue", val);
    emits("click", val);
  },
});
</script>
<style scoped>
.active {
  color: white;
  background-color: #409eff;
}
</style>
