<template>
  <el-card style="width: 100%;">
    <template #header>
      <div class="font-semibold text-[20px] text-[#4a9cd6]">
        <span>{{ props.header }}</span>
      </div>
    </template>
    <div><slot> </slot></div>
  </el-card>
</template>
<script setup>
const props = defineProps(["header"]);
</script>
