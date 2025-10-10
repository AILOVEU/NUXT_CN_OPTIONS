<template>
  <div class="flex items-center flex-1 justify-between px-[50px] bg-[#fafafa]">
    <div
      :class="{ active: activePath === item.href }"
      v-for="item in navList"
      @click="() => handleClick(item.href)"
      class="cursor-pointer"
    >
      {{ item.name }}
    </div>
  </div>
</template>

<script setup>
// const prefix = process.env.NUXT_APP_BASE_URL
//   ? "/" + process.env.NUXT_APP_BASE_URL
//   : "";
const route = useRoute();
const router = useRouter();
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
function handleClick(href) {
  router.push(href);
}
</script>
<style scoped>
.active {
  color: #409eff;
  font-weight: 800;
}
</style>
