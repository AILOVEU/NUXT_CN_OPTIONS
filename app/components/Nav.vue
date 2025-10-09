<template>
  <div class="flex items-center flex-1 justify-between px-[50px] bg-[#fafafa]">
    <a
      :href="item.href"
      :class="{ active: activePath === item.href }"
      v-for="item in navList"
      >{{ item.name }}</a
    >
  </div>
</template>

<script setup>
const route = useRoute();
const navList = [
  {
    href: "/",
    name: "T型",
  },
  {
    href: "/hold",
    name: "持仓",
  },
  {
    href: "/analysis",
    name: "分析",
  },
  {
    href: "/filter",
    name: "过滤",
  },
];
const activePath = computed(() => {
  const path = route.path;
  if (path === "") return "/";
  return route.path;
});
</script>
<style scoped>
.active {
  color: #409eff;
  font-weight: 800;
}
</style>
