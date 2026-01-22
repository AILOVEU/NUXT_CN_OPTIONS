<template>
  <el-affix :offset="0">
    <div class="flex justify-between text-[12px] mb-[12px]">
      <el-button @click="handleQuery" class="flex-1" type="primary" :disabled="isMobile"> 刷新 </el-button>
      <div class="flex items-center flex-1 justify-between px-[50px] bg-[#fafafa]">
        <div :class="{ active: activePath === item.href }" v-for="item in navList" @click="() => handleClick(item.href)" class="cursor-pointer">
          {{ item.name }}
        </div>
      </div>
    </div>
  </el-affix>
</template>

<script setup>
import { get_http_data } from "~/utils/options";
import { OPTIONS_MAP } from "~/data";
import { useGlobal } from "~/stores/useGlobal.js";
const { setGlobalLoading, isMobile } = useGlobal();
const route = useRoute();
const router = useRouter();
const navList = [
  {
    href: "/hold",
    name: "持仓",
  },  
  {
    href: "/spread",
    name: "价差",
  },
  {
    href: "/t",
    name: "T型",
  },
  {
    href: "/analysis",
    name: "分析",
  },
  {
    href: "/filter",
    name: "过滤",
  },

  {
    href: "/vixs",
    name: "Vixs",
  },
  {
    href: "/fund",
    name: "ETF",
  },
  {
    href: "/futures",
    name: "期货",
  },
  {
    href: "/calendar",
    name: "日历",
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

function handleQuery() {
  setGlobalLoading(true);
  get_http_data(
    OPTIONS_MAP.map((el) => el.code),
    false
  )
    .then(([all_data]) => {
      if (all_data.length) {
        window.location.reload();
      }
    })
    .finally(() => {
      setGlobalLoading(false);
    });
}
</script>
<style scoped>
.active {
  color: #409eff;
  font-weight: 800;
}
</style>
