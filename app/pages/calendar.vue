<template>
  <div v-loading="loading" class="max-md:w-[140%]">
    <el-affix :offset="0">
      <div class="flex justify-between text-[12px] mb-[12px]">
        <el-button @click="handleQuery" class="flex-1" type="primary">
          刷新
        </el-button>
        <Nav />
      </div>
    </el-affix>

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
      <div
        v-for="item in days"
        class="border-[1px] border-[black] h-[80px] flex items-center justify-center flex-col"
        :style="getStyle(item)"
      >
        <div class="text-[12px]">{{ item.showText }}</div>
        <div v-if="item.holidayName">{{ item.holidayName }}</div>
        <div v-if="item.isCurrent" class="text-[36px]">🚩</div>
        <div v-if="item.isFourthWednesday">🔔</div>
        <div v-if="item.isBirthday">🎂</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import _ from "lodash";
import dayjs from "dayjs";

// 获取两个日期之间的所有日期
function getDatesBetween(startDate, endDate, format = "YYYY-MM-DD") {
  const dates = [];
  let current = dayjs(startDate);
  const end = dayjs(endDate);

  while (current.isBefore(end) || current.isSame(end)) {
    dates.push(current.format(format));
    current = current.add(1, "day");
  }

  return dates;
}

function getStyle(item) {
  if (item.isEvenMonth) {
    return {
      background: item.isHoliday ? "#70D4B4" : "#dacef3",
    };
  } else {
    return {
      background: item.isHoliday ? "#70D4B4" : "white",
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
const WORKDAY = [
  "2026-01-04",
  "2026-02-14",
  "2026-02-28",
  "2026-05-09",
  "2026-09-20",
  "2026-10-10",
];

const days = ref(
  getDatesBetween(
    getLastMondayOfPreviousMonth(),
    dayjs("2026-12-31", "YYYY-MM-DD")
  ).map((el) => {
    const day = dayjs(el, "YYYY-MM-DD");
    let showText = day.format("DD");
    if (day.format("DD") === "01") {
      showText = day.format("YYYY-MM-DD");
    }
    const weekday = dayjs(el, "YYYY-MM-DD").day();
    const isHoliday =
      HOLIDAY.includes(el) ||
      ([6, 0].includes(weekday) && !WORKDAY.includes(el));
    return {
      date: el,
      weekday,
      isFourthWednesday: isFourthWednesday(el),
      isBirthday: ["04-26", "12-05", "07-11", "06-13"].includes(
        dayjs(el, "YYYY-MM-DD").format("MM-DD")
      ),
      isCurrent: el === dayjs().format("YYYY-MM-DD"),
      isHoliday,
      isWorkDay: WORKDAY.includes(el),
      isEvenMonth: !!(dayjs(el, "YYYY-MM-DD").month() % 2),
      showText,
    };
  })
);

function isFourthWednesday(date) {
  const inputDate = dayjs(date, "YYYY-MM-DD");
  const year = inputDate.year();
  const month = inputDate.month();

  // 获取当月的第一天
  const firstDayOfMonth = dayjs().year(year).month(month).date(1);

  // 计算第一个周三是哪一天
  let firstWednesday;
  const firstDayWeek = firstDayOfMonth.day();

  if (firstDayWeek <= 3) {
    firstWednesday = firstDayOfMonth.date(3 - firstDayWeek + 1);
  } else {
    firstWednesday = firstDayOfMonth.date(3 - firstDayWeek + 8);
  }

  // 第四个周三 = 第一个周三 + 3周
  const fourthWednesday = firstWednesday.add(3, "week");

  return inputDate.isSame(fourthWednesday, "day");
}

function getLastMondayOfPreviousMonth() {
  // 获取当前日期并设置为上个月的第一天
  const firstDayOfCurrentMonth = dayjs().startOf("month");
  const lastDayOfPreviousMonth = firstDayOfCurrentMonth.subtract(1, "day");

  // 从上个月的最后一天开始向前查找，直到找到星期一
  let date = lastDayOfPreviousMonth;
  while (date.day() !== 1) {
    // 1 代表星期一 (0 是星期日，1 是星期一，依此类推)
    date = date.subtract(1, "day");
  }

  return date;
}
</script>
