<template>
  <NuxtPage />
</template>
<script setup>
import { useHead } from "nuxt/app";
// 配置视口（确保适配准确性）
useHead({
  meta: [
    {
      name: "viewport",
      content: "width=device-width, initial-scale=0.7",
    },
  ],
});
</script>
<style lang="less">
// div{
//   color: black;
// }
* {
  line-height: 0.95;
}
// .el-tag.el-tag--info{
//   background-color: white!important;
// }
// .el-tag__content{
//   color: black;
// }
</style>
