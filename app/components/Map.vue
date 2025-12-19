<template>
  <div class="mx-[10px]">
    <Card header="中证500价格映射">
      <div class="overflow-x-auto py-[10px]">
        <div class="w-full flex items-center justify-between gap-[10px]">
          <div>510500</div>
          <div v-for="value in new Array(17).fill(5).map((item, index) => item + index * 0.25)">
            {{ formatDecimal(value, 2) }}
          </div>
        </div>
        <div class="w-full flex items-center justify-between gap-[10px]">
          <div>159922</div>
          <div v-for="value in new Array(17).fill(2).map((item, index) => item + index * 0.1)">
            {{ formatDecimal(value, 2) }}
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
<script setup>
import { formatDecimal } from "~/utils/utils";
</script>
