<!-- pages/index.vue -->
<script setup>
// 页面加载时自动重定向到 /home
navigateTo("/hold", {
  redirect: true, // 强制重定向，忽略导航守卫的默认行为
  statusCode: 301, // 可选，指定重定向状态码
});
</script>

<template>
  <!-- 该模板内容不会显示，因为会立即重定向 -->
  <div class="flex w-full h-[100vh] justify-center items-center" v-loading="true"></div>
</template>
