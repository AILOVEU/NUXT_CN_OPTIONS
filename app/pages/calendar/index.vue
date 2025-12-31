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
  getDatesBetween(getLastMondayOfPreviousMonth(), dayjs("2026-12-31", "YYYY-MM-DD")).map((el) => {
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
      isFourthWednesday: getFourthWednesdayOfMonth(el) === el,
      isQuarterOptions: getFourthWednesdayOfMonth(el) === el && ["12", "03", "06", "09"].includes(dayjs(el, "YYYY-MM-DD").format("MM")),
      isGeneratedNewQuarterOptions: getFourthThursdayOfMonth(el) === el && ["01", "04", "07", "10"].includes(dayjs(el, "YYYY-MM-DD").format("MM")),
      isBirthday: ["04-26", "12-05", "07-11", "06-13"].includes(dayjs(el, "YYYY-MM-DD").format("MM-DD")),
      isCurrent: el === dayjs().format("YYYY-MM-DD"),
      isHoliday,
      isWorkDay: WORKDAY.includes(el),
      isEvenMonth: !!(dayjs(el, "YYYY-MM-DD").month() % 2),
      showText,
    };
  })
);
function getFourthThursdayOfMonth(dateStr) {
  return dayjs(getFourthWednesdayOfMonth(dateStr), "YYYY-MM-DD").add(1, "days").format("YYYY-MM-DD");
}
/**
 * 获取指定日期所在月份的第四个星期三
 * @param {string} dateStr - 输入日期，格式必须为'YYYY-MM-DD'
 * @returns {string} 该月份第四个星期三的日期，格式'YYYY-MM-DD'
 */
function getFourthWednesdayOfMonth(dateStr) {
  // 1. 解析输入日期为dayjs对象（验证格式有效性）
  const inputDate = dayjs(dateStr, "YYYY-MM-DD");
  if (!inputDate.isValid()) {
    throw new Error("输入日期格式无效，请传入'YYYY-MM-DD'格式的字符串");
  }

  // 2. 获取输入日期对应的年、月
  const targetYear = inputDate.year();
  const targetMonth = inputDate.month(); // dayjs中month为0-based（0=1月，11=12月）

  // 3. 构建当月第一天的dayjs对象
  const firstDayOfMonth = dayjs().year(targetYear).month(targetMonth).date(1);

  // 4. 获取当月第一天的星期数（dayjs中day()返回0=周日，1=周一，2=周二，3=周三，4=周四，5=周五，6=周六）
  const firstDayWeek = firstDayOfMonth.day();

  // 5. 计算当月第一个星期三的日期偏移量
  // 公式：((目标星期数 - 当月第一天星期数) + 7) % 7  确保偏移量非负
  const wednesday = 3; // 星期三对应的数字
  const offsetToFirstWednesday = (wednesday - firstDayWeek + 7) % 7;

  // 6. 计算当月第一个星期三的日期
  const firstWednesdayDate = 1 + offsetToFirstWednesday;

  // 7. 计算当月第四个星期三的日期（第一个+21天=第四个，每7天一个星期三）
  const fourthWednesdayDate = firstWednesdayDate + 21; // 1st+7=2nd, +14=3rd, +21=4th

  // 8. 构建第四个星期三的dayjs对象并格式化为指定格式
  const fourthWednesday = dayjs().year(targetYear).month(targetMonth).date(fourthWednesdayDate).format("YYYY-MM-DD");

  return fourthWednesday;
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
