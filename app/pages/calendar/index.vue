<template>
  <div v-loading="loading" class="max-md:w-[300%]" ref="captureRef">
    <Nav />
    <el-affix :offset="32">
      <div class="flex">
        <div class="basis-[12.5%] flex justify-center items-center"><el-button @click="download" link>⬇</el-button></div>
        <div class="grid grid-cols-7 bg-white w-full">
          <div class="text-center">星期一</div>
          <div class="text-center">星期二</div>
          <div class="text-center">星期三</div>
          <div class="text-center">星期四</div>
          <div class="text-center">星期五</div>
          <div class="text-center">星期六</div>
          <div class="text-center">星期日</div>
        </div>
      </div>
    </el-affix>
    <div class="flex">
      <div class="basis-[12.5%]">&nbsp;</div>
      <div class="basis-[87.5%] grid grid-cols-7 mt-[32px]">
        <div v-for="item in days" class="text-[28px] relative border-[1px] border-[black] h-[119px] flex items-center justify-center flex-col" :style="getStyle(item)">
          <div class="absolute left-[5px] top-[5px]">
            <div v-if="!item.isMonthFirstDay">{{ item.showText }}</div>
            <div v-else>{{ item.showText }}</div>
          </div>
          <div v-if="customTextMap[item.date]" class="text-[24px] text-[red]">{{ customTextMap[item.date] }}</div>
          <div v-if="item.holidayName">{{ item.holidayName }}</div>
          <div v-if="item.isCurrent" class="text-[36px]">🚩</div>
          <div v-if="item.isQuarterOptions" class="text-[30px] text-[red]">ETF季交割</div>
          <div v-else-if="item.isFourthWednesday" class="text-[red]">ETF交割</div>
          <div v-if="item.isGeneratedNewQuarterOptions" class="text-[30px]">🔖新季期权</div>
          <div v-if="item.isBirthday">🎂</div>
          <div v-if="item.isFirstMonday" class="relative translate-x-[-100%] w-full flex justify-center text-[30px]">
            {{ dayjs(item.date, "YYYY-MM-DD").format("M月") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import _ from "lodash";
import dayjs from "dayjs";
import { getFourThursdayOfMonth, getFourWednesdayOfMonth, getLastMondayOfPreMonth, getDatesBetween, getFirstMondayOfMonth } from "~/utils/utils";

function getStyle(item) {
  const styleCfg = {};
  if (item.isCurrent) styleCfg.border = "6px solid red";
  // if (item.isGeneratedNewQuarterOptions) styleCfg.border = "6px solid green";
  if (item.isBirthday) styleCfg.border = "6px solid orange";
  if (dayjs(item.date, "YYYY-MM-DD").isBefore(dayjs(), "days")) {
    // styleCfg.background = "gray";
    styleCfg.filter = "grayscale(0.75)";
    // styleCfg.background = "gray";
  }
  if (item.isEvenMonth) {
    return {
      background: item.isHoliday ? "#A8DF8E" : "white",
      ...styleCfg,
    };
  } else {
    return {
      background: item.isHoliday ? "#A8DF8E" : "white",
      ...styleCfg,
    };
  }
}
const HOLIDAY = [
  "2026-01-01",
  "2026-01-02",
  "2026-01-03",
  "2026-02-15",
  "2026-02-16",
  "2026-02-17",
  "2026-02-18",
  "2026-02-19",
  "2026-02-20",
  "2026-02-21",
  "2026-02-22",
  "2026-02-23",
  "2026-04-04",
  "2026-04-05",
  "2026-04-06",
  "2026-05-01",
  "2026-05-02",
  "2026-05-03",
  "2026-05-04",
  "2026-05-05",
  "2026-06-19",
  "2026-06-20",
  "2026-06-21",
  "2026-09-25",
  "2026-09-26",
  "2026-09-27",
  "2026-10-01",
  "2026-10-02",
  "2026-10-03",
  "2026-10-04",
  "2026-10-05",
  "2026-10-06",
  "2026-10-07",
];
const WORKDAY = ["2026-01-04", "2026-02-14", "2026-02-28", "2026-05-09", "2026-09-20", "2026-10-10"];

const days = ref(
  getDatesBetween(getLastMondayOfPreMonth(), dayjs("2026-12-31", "YYYY-MM-DD")).map((el) => {
    const day = dayjs(el, "YYYY-MM-DD");
    let showText = day.format("DD");
    if (day.format("DD") === "01") {
      showText = day.format("YYYY-MM-DD");
    }
    const weekday = dayjs(el, "YYYY-MM-DD").day();
    const isHoliday = HOLIDAY.includes(el) || ([6, 0].includes(weekday) && !WORKDAY.includes(el));
    return {
      date: el,
      weekday,
      isFourthWednesday: getFourWednesdayOfMonth(el) === el,
      isQuarterOptions: getFourWednesdayOfMonth(el) === el && ["12", "03", "06", "09"].includes(dayjs(el, "YYYY-MM-DD").format("MM")),
      isGeneratedNewQuarterOptions: getFourThursdayOfMonth(el) === el && ["01", "04", "07", "10"].includes(dayjs(el, "YYYY-MM-DD").format("MM")),
      isBirthday: ["04-26", "12-05", "07-11", "06-13"].includes(dayjs(el, "YYYY-MM-DD").format("MM-DD")),
      isCurrent: el === dayjs().format("YYYY-MM-DD"),
      isHoliday,
      isWorkDay: WORKDAY.includes(el),
      isEvenMonth: !!(dayjs(el, "YYYY-MM-DD").month() % 2),
      showText,
      isFirstMonday: getFirstMondayOfMonth(el) === el,
      isMonthFirstDay: dayjs(el, "YYYY-MM-DD").format("DD") === "01",
    };
  })
);

const customTextMap = ref({
  "2026-05-13": "白糖、玻璃、纯碱",
  "2026-05-15": "股指交割",
  "2026-05-21": "铁矿石",
  "2026-05-25": "螺纹",
  "2026-06-11": "白糖、玻璃、纯碱",
  "2026-06-16": "铁矿石、玉米、豆粕",
  "2026-06-22": "股指交割",
  "2026-06-24": "螺纹",

  
  "2026-07-13": "玻璃、纯碱",
  "2026-08-12": "玻璃、纯碱",

  "2026-08-25": "螺纹",
  "2026-09-11": "纯碱",

  "2026-09-23": "螺纹",
  "2026-10-13": "纯碱",

  "2026-12-11": "玻璃、纯碱",
});

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
    link.download = `${dayjs().format("YYYY")}日历.png`;
    link.click();
  } catch (e) {
    console.error("截图失败", e);
  }
}
</script>
