<template>
  <el-affix :offset="0">
    <div class="flex justify-between text-[12px] mb-[12px] gap-[20px] bg-white">
      <div class="flex gap-[12px] items-center">
        <el-button @click="() => handleDownload()" class="flex-1" type="primary"> 批量下载 </el-button>
        <!-- <el-button @click="() => handleQuery(false)" class="flex-1" type="primary" :disabled="isMobile"> 刷新持仓 </el-button> -->
        <el-button v-if="CAN_REFRES_NAV_LIST.includes(activePath)" @click="() => handleQuery(true)" class="flex-1" :disabled="isMobile"> 全部刷新 </el-button>
        <el-button v-else-if="CUSTOM_QUERY_NAV_LIST.includes(activePath)" @click="handleEmitQuery" class="flex-1" :disabled="isMobile"> 全部刷新 </el-button>
        <div v-if="CAN_REFRES_NAV_LIST.includes(activePath)">更新时间<br />{{ updateTime }}</div>
      </div>
      {{activePath}}
      <div class="flex items-center flex-1 justify-between px-[50px] bg-[#fafafa]">
        <div :class="{ navActive: activePath === item.href }" v-for="item in navList" @click="() => handleClick(item.href)" class="cursor-pointer">
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
import dayjs from "dayjs";
const emits = defineEmits(["download", "query"]);
const { setGlobalLoading, isMobile } = useGlobal();
const route = useRoute();
const router = useRouter();
const updateTime = ref(localStorage.getItem("updateTime"));
const CAN_REFRES_NAV_LIST = ["/hold", "/filter", "/spread", "/analysis"];
const CUSTOM_QUERY_NAV_LIST = ["/stockindex"];
const navList = [
  {
    href: "/hold",
    name: "总览",
  },
  {
    href: "/stockindex",
    name: "股指",
  },
  {
    href: "/filter",
    name: "筛选",
  },
  {
    href: "/spread",
    name: "价差",
  },
  // {
  //   href: "/t",
  //   name: "T型",
  // },
  {
    href: "/analysis",
    name: "★分析",
  },

  {
    href: "/vixs",
    name: "Vixs",
  },
  {
    href: "/etf",
    name: "ETF",
  },
  {
    href: "/minutes",
    name: "分钟",
  },
  {
    href: "/futures",
    name: "期货",
  },
  {
    href: "/calendar2",
    name: "日历",
  },
  {
    href: "/timeline",
    name: "事件",
  },
];

const activePath = ref(route.path || "/");

function handleClick(href) {
  setGlobalLoading(true);
  setTimeout(() => {
    setGlobalLoading(false);
  });
  activePath.value = href;
  router.push(href);
}

function handleQuery(catchAll = false) {
  setGlobalLoading(true);
  const useCatch = false;
  get_http_data(
    OPTIONS_MAP.map((el) => el.code),
    useCatch,
    catchAll
  )
    .then(([tiledData]) => {
      if (tiledData.length) {
        localStorage.setItem("updateTime", dayjs().format("YYYY-MM-DD HH:mm:ss"));
        window.location.reload();
      }
    })
    .finally(() => {
      setGlobalLoading(false);
    });
}
function handleDownload() {
  emits("download");
}
function handleEmitQuery() {
  emits("query");
}
</script>
<style scoped>
.navActive {
  color: #409eff;
  font-weight: 800;
}
</style>
