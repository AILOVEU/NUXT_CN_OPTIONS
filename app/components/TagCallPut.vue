<template>
  <span v-if="props.value === '沽'" class="rounded-[4px] bg-[#70c646] px-[2px] pb-[4px] text-white font-semibold">沽</span>
  <span v-if="props.value === '购'" class="rounded-[4px] bg-[#f57171] px-[2px] pb-[4px] text-white font-semibold">购</span>
  <!-- <el-tag v-if="props.value === '沽'" type="success">
        <span>沽</span>
    </el-tag>
    <el-tag v-if="props.value === '购'" type="danger">
        <span>购</span>
    </el-tag> -->
</template>
<script setup>
const props = defineProps(["value"]);
</script>
