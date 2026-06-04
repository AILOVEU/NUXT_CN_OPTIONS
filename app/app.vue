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
      content: "width=device-width, initial-scale=1",
    },
  ],
});

// 设置 Cookie
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
.el-tag--small {
  padding: 0 2px !important;
}
body {
  // 滚动条样式
  ::-webkit-scrollbar-thumb {
    border-radius: 0;
    background-color: rgba(204, 199, 199, 0.5);
    transition: all 0.2s;
    border-radius: 4px;
  }

  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
}
.el-table .el-table__cell {
  padding: 0px 0;
}
.el-table .cell {
  padding: 0 6px 0 2px;
}
.highlight-line {
  background-color: #fdf6ec !important;
}
.el-table {
  color: black !important;
}
.el-tag--info {
  color: black !important;
}
.el-tag {
  border-width: 0 !important;
}
// .el-table .el-table__cell {
//   box-sizing: border-content !important;
// }

/* 兼容部分场景（如果变量不生效，追加这个类名样式） */
.el-table__body tr:hover > td {
  background-color: #C4E2F5 !important;
}
</style>
