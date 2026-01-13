<template>
  <div v-loading="loading" class="max-md:w-[200%]">
    <Nav />
    <el-affix :offset="32">
      <div class="grid grid-cols-7 bg-white w-full">
        <div class="text-center">星期一</div>
        <div class="text-center">星期二</div>
        <div class="text-center">星期三</div>
        <div class="text-center">星期四</div>
        <div class="text-center">星期五</div>
        <div class="text-center">星期六</div>
        <div class="text-center">星期日</div>
      </div>
    </el-affix>
    <div class="grid grid-cols-7 mt-[32px]">
      <div v-for="item in days" class="border-[1px] border-[black] h-[80px] flex items-center justify-center flex-col" :style="getStyle(item)">
        <div class="text-[12px]">{{ item.showText }}</div>
        <div v-if="item.holidayName">{{ item.holidayName }}</div>
        <div v-if="item.isCurrent" class="text-[36px]">🚩</div>
        <div v-if="item.isQuarterOptions" class="text-[24px]">🍀</div>
        <div v-else-if="item.isFourthWednesday">🔔</div>
        <div v-if="item.isGeneratedNewQuarterOptions">📚️</div>
        <div v-if="item.isBirthday">🎂</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import _ from "lodash";
import dayjs from "dayjs";
import { getFourThursdayOfMonth, getFourWednesdayOfMonth, getLastMondayOfPreMonth, getDatesBetween } from "~/utils/utils";

function getStyle(item) {
  const styleCfg = {};
  if (item.isCurrent) styleCfg.border = "6px solid red";
  if (item.isGeneratedNewQuarterOptions) styleCfg.border = "6px solid green";
  if (item.isBirthday) styleCfg.border = "6px solid orange";
  if (dayjs(item.date, "YYYY-MM-DD").isBefore(dayjs(), "days")) {
    styleCfg.background = "gray";
    styleCfg.filter = "grayscale(100%)";
  }
  if (item.isEvenMonth) {
    return {
      background: item.isHoliday ? "#70D4B4" : "#dacef3",
      ...styleCfg,
    };
  } else {
    return {
      background: item.isHoliday ? "#70D4B4" : "white",
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
    };
  })
);
</script>
