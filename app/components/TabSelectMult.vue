<template>
  <div class="w-full flex">
    <div class="flex-1 border-[1px] leading-1 text-center mx-[10px] cursor-pointer h-[25px] flex items-center justify-center" v-for="item in props.options" :class="{ active: modelValue.includes(item.value) }" @click="() => change(item.value)">
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
function change(val) {
  if (modelValue.value.includes(val)) {
    modelValue.value = modelValue.value.filter((el) => el !== val);
  } else {
    modelValue.value = [...modelValue.value, val];
  }
}
</script>
<style scoped>
.active {
  color: white;
  background-color: #576A8F;
}
</style>
