<template>
  <el-affix :offset="0">
    <div class="flex text-[12px] mb-[12px] gap-[20px] bg-white">
      <div class="flex gap-[12px] items-center basis-[400px] bg-gray-200 rounded px-[10px]">
        <el-button @click="() => handleDownload()" class="flex-1" type="primary"> 批量下载 </el-button>
        <!-- <el-button @click="() => handleQuery(false)" class="flex-1" type="primary" :disabled="isMobile"> 刷新持仓 </el-button> -->
        <el-button v-if="CAN_REFRES_NAV_LIST.includes(activePath)" @click="() => handleQuery(true)" class="flex-1"
          :disabled="isMobile"> 全部刷新 </el-button>
        <el-button v-else-if="CUSTOM_QUERY_NAV_LIST.includes(activePath)" @click="handleEmitQuery" class="flex-1"
          :disabled="isMobile"> 全部刷新 </el-button>
        <div v-if="CAN_REFRES_NAV_LIST.includes(activePath)">更新时间<br />{{ updateTime }}</div>
        <div v-if="CAN_REFRES_STOCKINDEX_NAV_LIST.includes(activePath)">更新时间<br />{{ stockIndexUpdateTime }}</div>
      </div>
      <div class="flex flex-col flex-1 px-[20px] gap-[6px] justify-center">
        <!-- 一级分类 -->
        <div class="flex gap-[8px]">
          <button v-for="group in navGroups" :key="group.name" :class="[
            'flex-1 px-3 py-[3px] rounded text-xs cursor-pointer border-none transition-all duration-200',
            activeGroup === group.name
              ? 'bg-blue-100 text-blue-600 font-semibold'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
          ]" @click="switchGroup(group)">
            {{ group.name }}
          </button>
        </div>
        <!-- 二级子项 -->
        <div class="flex gap-[6px] flex-wrap">
          <button v-for="item in activeGroupItems" :key="item.href" :class="[
            'flex-1 px-2 py-[3px] rounded text-xs cursor-pointer border-none transition-all duration-200',
            activePath === item.href
              ? 'bg-blue-500 text-white font-bold'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100',
          ]" @click="() => handleClick(item.href)">
            {{ item.name }}
          </button>
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
const stockIndexUpdateTime = ref(localStorage.getItem("STOCKINDEX_updateTime"));

const CAN_REFRES_NAV_LIST = ["/hold", "/filter", "/spread", "/analysis"];
const CAN_REFRES_STOCKINDEX_NAV_LIST = ["/stockindex"];

const CUSTOM_QUERY_NAV_LIST = ["/stockindex", '/tstockindex'];
const isTrueData = !!localStorage.getItem("TRUE_DATA");
const navGroups = [
  {
    name: "期权",
    items: [
      { href: "/hold", name: "总览" },
      { href: "/filter", name: "筛选" },
      { href: "/filter/complex", name: "筛选2" },
      { href: "/spread", name: "价差" },
    ],
  },
  {
    name: "期权分析",
    items: [
      { href: "/analysis", name: "★分析" },
      { href: "/strategy", name: "策略" },
      { href: "/t", name: "T型" },
    ],
  },
  {
    name: "股指",
    items: [
      { href: "/stockindex", name: "股指" },
      { href: "/tstockindex", name: "股指T型" },
    ],
  },
  {
    name: "其他",
    items: [
      { href: "/vixs", name: "Vixs" },
      { href: "/etf", name: "ETF" },
      { href: "/notes", name: "日记" },
      { href: "/futures", name: "期货" },
    ],
  },
  {
    name: "工具",
    items: [
      { href: "/calendar2", name: "日历" },
      isTrueData && { href: "/timeline", name: "事件" },
    ],
  },
].map(el => ({
  name: el.name,
  items: el.items.filter(itemEl => !!itemEl)
}));

const activePath = ref(route.path || "/");

const activeGroup = computed(() => {
  for (const group of navGroups) {
    if (group.items.some((item) => item.href === activePath.value)) {
      return group.name;
    }
  }
  return navGroups[0].name;
});

const activeGroupItems = computed(() => {
  const group = navGroups.find((g) => g.name === activeGroup.value);
  return group ? group.items : [];
});

function switchGroup(group) {
  if (group.items.length > 0) {
    handleClick(group.items[0].href);
  }
}

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
    { useCatch, catchAll }
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
<style scoped></style>
