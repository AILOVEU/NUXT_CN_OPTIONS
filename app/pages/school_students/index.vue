<template>
  <div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-8 px-4">
    <!-- 顶部图标+标题区域 -->
    <div class="flex flex-col items-center mb-8">
      <!-- 蓝色圆形图标 -->
      <div class="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center mb-4">
        <svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h4l3 -8l4 16l3 -8h4" />
        </svg>
      </div>
      <h1 class="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">肩周炎虚拟病人教学系统</h1>
      <p class="text-gray-500 mt-2 text-lg">物理治疗临床技能训练平台</p>
    </div>

    <!-- 登录卡片 -->
    <div class="w-full max-w-lg bg-white rounded-lg p-8 shadow-sm">
      <h2 class="text-2xl font-semibold text-gray-800 mb-6">学生登录</h2>

      <!-- 登录表单 -->
      <el-form ref="loginFormRef" :model="loginForm" label-width="0" @submit.prevent="handleLogin">
        <el-form-item prop="studentId" :rules="[{ required: true, message: '请输入学号', trigger: 'blur' }]">
          <el-input v-model="loginForm.studentId" placeholder="学号" size="large" prefix-icon="User" />
        </el-form-item>

        <el-form-item prop="password" :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]">
          <el-input v-model="loginForm.password" placeholder="密码" size="large" prefix-icon="Lock" show-password />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" class="w-full h-12 text-lg" native-type="submit"> 登录 </el-button>
        </el-form-item>
      </el-form>

      <!-- 管理员入口 -->
      <div class="text-center mt-4">
        <el-link type="primary" @click="goAdmin">管理员入口</el-link>
      </div>
    </div>

    <!-- 底部默认账号提示 -->
    <p class="text-gray-500 mt-8 text-sm">默认学号: 2024001 密码: 123456</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
// 表单实例
const loginFormRef = ref(null);
// 表单数据
const loginForm = ref({
  studentId: "",
  password: "",
});

// 写死的正确账号密码
const ACCOUNT_CONFIG = {
  studentId: "2024001",
  password: "123456",
};

// 登录校验逻辑
const handleLogin = async () => {
  await loginFormRef.value.validate();
  // 前端比对账号密码
  if (loginForm.value.studentId === ACCOUNT_CONFIG.studentId && loginForm.value.password === ACCOUNT_CONFIG.password) {
    ElMessage.success("登录成功！");
    // 此处替换为你的页面跳转逻辑，例如 navigateTo('/home')
    navigateTo("/school_students/dashboard");
  } else {
    ElMessage.error("学号或密码错误，请重新输入");
  }
};

// 跳转管理员页面
const goAdmin = () => {
  navigateTo("/school_teacher/login");
};
</script>

<style scoped>
/* 去除Element Plus按钮默认圆角，贴合原图矩形蓝色按钮 */
:deep(.el-button--primary) {
  border-radius: 6px;
  background-color: #1677ff;
  border-color: #1677ff;
}
:deep(.el-input__wrapper) {
  border-radius: 6px;
}
</style>
