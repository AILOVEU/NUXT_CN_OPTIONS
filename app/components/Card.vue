<template>
  <el-card>
    <template #header>
      <div class="font-semibold text-[20px] text-[#4a9cd6]">
        <span>{{ props.header }}</span>
      </div>
    </template>
    <slot></slot>
  </el-card>
</template>
<script setup>
const props = defineProps(["header"]);
</script>
