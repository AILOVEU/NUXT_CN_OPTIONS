<template>
  <div v-loading="globalLoading.value" class="max-md:w-[255%]">
    <Nav />
    <div class="mx-[50px]">
      <el-form size="small" :model="formData" label-width="auto" label-suffix=":">
        <div>
          <el-form-item label="正股">
            <TabSelectMult :options="stockOptions" v-model="formData.正股List" />
          </el-form-item>
          <el-form-item label="到期日" clearable>
            <TabSelectMult :options="deadline_list.map((el) => ({ label: el, value: el }))" v-model="formData.到期日List" />
          </el-form-item>
          <el-form-item label="沽购" clearable>
            <TabSelectMult :options="['沽', '购'].map((el) => ({ label: el, value: el }))" v-model="formData.沽购List" />
          </el-form-item>
          <el-form-item label="档位" clearable>
            <TabSelectMult :options="档位名称List.map((el) => ({ label: el, value: el }))" v-model="formData.档位名称List" />
          </el-form-item>
        </div>
      </el-form>
    </div>
    <div class="w-full flex mb-[12px] gap-[20px] justify-between mx-[20px]">
      <div
        class="flex-1 border-[1px] leading-1 text-center cursor-pointer h-[25px] flex items-center justify-center"
        v-for="item in [
          { label: '列表', value: 'list' },
          { label: 'T型', value: 'symmetric' },
          // { label: '全部', value: 'all' },
        ]"
        :class="{ active: item.value === showType }"
        @click="showType = item.value"
      >
        {{ item.label }}
      </div>
    </div>
    <div class="w-full flex justify-center">
      <el-button @click="() => captureRef.download()" link>⬇</el-button>
    </div>
    <div v-if="showType === 'list'" class="max-md:h-[calc(200vh-300px)] mb-[100px] gap-[10px] flex flex-col">
      <Capture title="日历" ref="captureRef" :style="{ margin: '0 auto' }">
        <div class="flex justify-center py-[5px]">彩票{{ todayStr }}</div>
        <FilterList :checkIsChance="checkIsChance彩票" :showHold="false" />
        <div class="flex justify-center py-[5px]">短期</div>
        <FilterList :checkIsChance="checkIsChance短期" :showHold="false" />
        <div class="flex justify-center py-[5px]">中期</div>
        <FilterList :checkIsChance="checkIsChance中期" :showHold="false" />
        <div class="flex justify-center py-[5px]">远期</div>
        <FilterList :checkIsChance="checkIsChance远期" :showHold="false" />
      </Capture>
      <!-- <div class="mx-auto" ref="captureRef"></div> -->
    </div>
    <FilterSymmetric v-else-if="showType === 'symmetric'" :checkIsChance="checkIsChance" :key="JSON.stringify(formData)" />
    <FilterList v-else-if="showType === 'all'" :checkIsChance="() => true" :showHold="false" />
  </div>
</template>
<script setup>
import _ from "lodash";
import { useGlobal } from "~/stores/useGlobal.js";
import FilterSymmetric from "./components/FilterSymmetric.vue";
import { deadline_list, OPTIONS_MAP, 建议买入价, 最大建议买入时间价 } from "~/data";
import dayjs from "dayjs";
const todayStr = computed(() => `(${dayjs().format("YYYY-MM-DD_HH:mm:ss")})`);

const { globalLoading } = useGlobal();

const showType = ref("list");
const stockOptions = OPTIONS_MAP.map((el) => ({
  label: el.name,
  value: el.code,
}));
const 档位名称List = ref(["实5档", "实4档", "实3档", "实2档", "实1档", "平值", "虚1档", "虚2档", "虚3档", "虚4档", "虚5档"]);
const formData = reactive({
  溢价Range: [-100, 15],
  一手价Range: [0, 建议买入价],
  一手价时间价Range: [0, 最大建议买入时间价],
  DeltaRange: [0.15, 1],
  隐波Range: [0, 23],
  GammaRange: [0.5, 9999],
  正股List: [...OPTIONS_MAP.map((el) => el.code)],
  到期日List: [...deadline_list],
  沽购List: ["购", "沽"],
  档位名称List: [],
  过滤持有: false,
});
function checkIsChance彩票(target) {
  if (target["is旧期权"]) return false;
  if (!formData.沽购List.includes(target["沽购"])) return false;
  if (!formData.正股List.includes(target["正股代码"])) return false;

  return target["is彩票"];
}
// 短期不关注隐波，只关注溢价率和价格
function checkIsChance短期(target) {
  function get短期溢价Max(到期天数) {
    if (到期天数 > 30) return 7;
    if (到期天数 > 15) return 5.5;
    if (到期天数 > 10) return 4;
    return 3.5;
  }
  if (target["is旧期权"]) return false;
  if (formData.沽购List.length && !formData.沽购List.includes(target["沽购"])) return false;
  if (formData.正股List.length && !formData.正股List.includes(target["正股代码"])) return false;
  if (formData.到期日List.length && !formData.到期日List.includes(target["到期日"])) return false;
  if (formData.档位名称List.length && !formData.档位名称List.includes(target["档位名称"])) return false;

  if (target["到期天数"] > 45 || target["到期天数"] <= 10) return false;
  if (target["一手价"] >= 500) return false;
  if (target["一手时间价"] >= 400) return false;
  if (target["一手内在价"] >= 400) return false;
  if (target["溢价率"] >= get短期溢价Max(target["到期天数"])) return false;
  return true;
}
function checkIsChance中期(target) {
  const OpsItem = OPTIONS_MAP.find((item) => item.code === target["正股代码"]);
  if (target["is旧期权"]) return false;
  if (formData.沽购List.length && !formData.沽购List.includes(target["沽购"])) return false;
  if (formData.正股List.length && !formData.正股List.includes(target["正股代码"])) return false;
  if (formData.到期日List.length && !formData.到期日List.includes(target["到期日"])) return false;
  if (formData.档位名称List.length && !formData.档位名称List.includes(target["档位名称"])) return false;
  // if (target["沽购"] === "购") {
  //   if (target["千行权价"] >= OpsItem.行权价Range[1]) return false;
  // }

  if (target["到期天数"] < 45 || target["到期天数"] >= 90) return false;
  if (target["一手价"] >= 1000) return false;
  if (target["一手时间价"] >= 750) return false;
  if (target["溢价率"] >= 10) return false;
  return true;
}
function checkIsChance远期(target) {
  const OpsItem = OPTIONS_MAP.find((item) => item.code === target["正股代码"]);
  if (target["is旧期权"]) return false;
  if (formData.沽购List.length && !formData.沽购List.includes(target["沽购"])) return false;
  if (formData.正股List.length && !formData.正股List.includes(target["正股代码"])) return false;
  if (formData.到期日List.length && !formData.到期日List.includes(target["到期日"])) return false;
  if (formData.档位名称List.length && !formData.档位名称List.includes(target["档位名称"])) return false;
  // if (target["沽购"] === "购") {
  //   if (target["千行权价"] >= OpsItem.行权价Range[1]) return false;
  // }

  if (target["到期天数"] < 90) return false;
  if (target["一手价"] >= 750) return false;
  if (target["一手时间价"] >= 750) return false;
  if (target["溢价率"] >= 15) return false;
  // 实值不关注隐波
  // if (target["隐波"] >= OpsItem.隐波Max && target["一手时间价"] >= 500 && target["一手内在价"] > 0) return false;
  return true;
}

function checkIsChance(target) {
  if (checkIsChance彩票(target)) return true;
  if (checkIsChance短期(target)) return true;
  if (checkIsChance中期(target)) return true;
  if (checkIsChance远期(target)) return true;
  return false;
}

const captureRef = ref(null);
async function download() {
  // 服务端直接返回
  if (process.server) return;

  // 动态引入（避免服务端打包报错）
  const html2canvas = (await import("html2canvas")).default;

  const el = captureRef.value;
  if (!el) return;

  try {
    const canvas = await html2canvas(el, {
      scale: 2, // 清晰度
      useCORS: true, // 跨域图片
      backgroundColor: "#ffffff",
      logging: false,
    });

    // 转成图片并下载
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${dayjs().format("YYYY")}彩票期权.png`;
    link.click();
  } catch (e) {
    console.error("截图失败", e);
  }
}
</script>
<style scoped>
.active {
  color: white;
  background-color: #409eff;
}
::v-deep(.el-form-item) {
  margin-bottom: 6px;
}
::v-deep(.el-radio-group) {
  justify-content: flex-start;
}
::v-deep(.el-table--small .cell) {
  padding: 0 0px 0 0 !important;
}
</style>
