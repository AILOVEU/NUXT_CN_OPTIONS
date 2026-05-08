<template>
  <el-card style="width: 100%">
    <template #header>
      <div class="flex justify-between">
        <div class="font-semibold text-[20px] text-[#4a9cd6]">
          <span>{{ props.header }}{{ todayStr }}</span>
        </div>
        <!-- <el-icon><Bottom /></el-icon> -->
        <el-button @click="() => captureRef.download()" link>⬇</el-button>
      </div>
    </template>
    <Capture :title="props.header" ref="captureRef">
      <slot> </slot>
    </Capture>
    <!-- <div ref="captureRef"><slot> </slot></div> -->
  </el-card>
</template>
<script setup>
const props = defineProps(["header"]);
import dayjs from "dayjs";
const todayStr = computed(() => `(${dayjs().format("YYYY-MM-DD")})`);
const captureRef = ref(null);
</script>
