<template>
  <Nav />
  <div class="w-full max-w-[1400px] mx-auto bg-white rounded-lg overflow-hidden font-sans">
    <!-- 顶部标题栏：替换为日期范围选择器 -->
    <div class="flex items-center gap-3 px-5 py-4 relative">
      <button class="w-8 h-8 rounded-md bg-blue-50 text-blue-600 text-sm font-medium cursor-pointer hover:bg-blue-100 border-none shrink-0" @click="scrollToToday">今</button>
      <div class="flex justify-center" @click="captureRef.download()">
        <el-button link>⬇</el-button>
      </div>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" class="flex-1 max-w-sm" />
    </div>
    <Capture title="日历" ref="captureRef">
      <!-- 星期表头 -->
      <div class="grid grid-cols-7 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div v-for="day in weekDays" :key="day" class="py-2.5 text-center text-sm text-gray-500 font-medium">{{ day }}</div>
      </div>

      <!-- 日历主体：根据日期范围动态生成 -->
      <div class="overflow-y-auto overflow-x-hidden calendar-main-body">
        <div v-for="(week, weekIdx) in calendarWeeks" :key="weekIdx" class="grid grid-cols-7 min-h-[200px]">
          <div
            v-for="(day, dayIdx) in week"
            :key="dayIdx"
            class="relative border-r border-b border-[#e0e0e0] p-0 min-h-[200px] box-border overflow-visible [&:nth-child(7n)]:border-r-0"
            :class="{
              'bg-gray-300 text-gray-300': !day.isInRange,
              'bg-green-100': day.isWeekendOrHoliday && !day.isPast,
              'bg-gray-300': day.isPast && day.isInRange,
              '!bg-white': day.isWorkAdjust && !day.isPast,
              '!bg-gray-100': day.isWorkAdjust && day.isPast,
              'month-first-day': day.isMonthFirstDay,
              // 今日：单元格红色内描边高亮，提升层级避免被遮挡
              'ring-8 ring-red-500 ring-inset z-20': day.isToday,
            }"
          >
            <!-- 月份标签（每月1号显示） -->
            <div v-if="day.isMonthFirstDay" class="absolute top-0 left-0 right-0 h-6 leading-6 px-2 bg-blue-600 text-white text-sm font-medium text-right rounded-t z-2">{{ day.month + 1 }}月</div>

            <!-- 日期数字 -->
            <div class="absolute top-1 left-2 text-sm font-medium z-3 text-gray-700 flex items-center gap-[5px]">
              <div
                :class="[
                  !day.isInRange ? 'text-gray-400' : '',
                  day.isMonthFirstDay && !day.isToday ? 'text-white' : '',
                  // 已过去的非工作日：数字浅绿背景
                  day.isPast && day.isWeekendOrHoliday && !day.isToday && !day.isMonthFirstDay ? 'inline-flex items-center justify-center w-[22px] h-[22px] bg-green-200 text-green-800 rounded-full text-xs leading-none' : '',
                  // 已过去的工作日：文字弱化
                  day.isPast && !day.isWeekendOrHoliday && !day.isToday && !day.isMonthFirstDay ? 'text-gray-500' : '',
                ]"
              >
                {{ day.date }}
              </div>
              <!-- 农历日期 -->
              <div
                class="text-xs z-3 text-gray-400 select-none"
                :class="[!day.isInRange ? 'text-gray-300' : '', day.isMonthFirstDay && !day.isToday ? 'text-blue-100' : '', day.isPast && !day.isToday && !day.isMonthFirstDay ? 'text-gray-300' : '', day.lunarText.includes('月') ? 'font-extrabold !text-[black]' : '']"
              >
                {{ day.lunarText }}
              </div>
            </div>

            <!-- 事件层 -->
            <div class="absolute top-[30px] left-0 right-0 bottom-1 overflow-y-hidden overflow-x-hidden z-1">
              <div
                v-for="event in day.events"
                :key="event.id"
                class="event-item absolute left-0 right-0 h-[18px] leading-[18px] text-[11px] px-1.5 overflow-hidden whitespace-nowrap text-ellipsis box-border border-y border-solid rounded-none flex justify-center items-center"
                :class="[
                  getEventTypeClass(event.type),
                  {
                    'event-start border-l rounded-l-sm ml-0.5': event.isWeekStart || event.isFirstDay,
                    'event-end border-r rounded-r-sm mr-0.5': event.isWeekEnd || event.isLastDay,
                  },
                ]"
                :style="{ top: event.rowIndex * 30 + 'px' }"
              >
                <span v-if="event.isWeekStart || event.isFirstDay">{{ event.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Capture>
  </div>
</template>

<script setup>
import { all事件, eventTypeClassMap } from "./data/events.js";
import { holidayDates, workAdjustDates } from "./data/holidayDates.js";
import dayjs from "dayjs";
const captureRef = ref();
const weekDays = ["一", "二", "三", "四", "五", "六", "日"];
// 日期范围：默认2026全年
const dateRange = ref([dayjs().format("YYYY-MM-DD"), "2026-12-31"]);

function getEventTypeClass(type) {
  return eventTypeClassMap[type] || "";
}

// ========== 事件数据 ==========
const events = ref(
  [...all事件].map((el, idx) => ({
    ...el,
    id: idx,
  }))
);

// ========== 公历转农历：单函数封装 ==========
const getLunarText = (() => {
  // 农历信息表（1900-2100）
  const lunarInfo = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, 0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0, 0x0ea50,
    0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260,
    0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6, 0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5,
    0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, 0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3,
    0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  ];
  const lunarMonths = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"];
  const lunarDays = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十", "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];

  // 内部辅助方法
  function getLunarYearDays(year) {
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      sum += lunarInfo[year - 1900] & i ? 1 : 0;
    }
    return sum + getLeapDays(year);
  }
  function getLeapMonth(year) {
    return lunarInfo[year - 1900] & 0xf;
  }
  function getLeapDays(year) {
    return getLeapMonth(year) ? (lunarInfo[year - 1900] & 0x10000 ? 30 : 29) : 0;
  }
  function getLunarMonthDays(year, month) {
    return lunarInfo[year - 1900] & (0x10000 >> month) ? 30 : 29;
  }

  // 对外暴露的主方法
  return function (dateStr) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const baseDate = new Date(1900, 0, 31);
    const currentDate = new Date(year, month - 1, day);
    let offset = Math.floor((currentDate - baseDate) / 86400000);

    let lunarYear = 1900;
    let daysInYear;
    while (lunarYear < 2100 && offset > 0) {
      daysInYear = getLunarYearDays(lunarYear);
      if (offset < daysInYear) break;
      offset -= daysInYear;
      lunarYear++;
    }

    let leapMonth = getLeapMonth(lunarYear);
    let isLeap = false;
    let lunarMonth = 1;
    let daysInMonth;

    while (lunarMonth < 13 && offset > 0) {
      if (leapMonth > 0 && lunarMonth === leapMonth + 1 && !isLeap) {
        lunarMonth--;
        isLeap = true;
        daysInMonth = getLeapDays(lunarYear);
      } else {
        daysInMonth = getLunarMonthDays(lunarYear, lunarMonth);
      }
      if (isLeap && lunarMonth === leapMonth + 1) isLeap = false;
      if (offset < daysInMonth) break;
      offset -= daysInMonth;
      lunarMonth++;
    }

    const lunarDay = offset + 1;
    // 初一显示月份，其余显示日期
    return lunarDay === 1 ? (isLeap ? "闰" : "") + lunarMonths[lunarMonth - 1] + "月" : lunarDays[lunarDay - 1];
  };
})();

// ========== 工具函数 ==========
function formatDate(y, m, d) {
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function isWeekend(dayOfWeek) {
  return dayOfWeek === 5 || dayOfWeek === 6;
}

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(startStr, endStr) {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

// ========== 根据日期范围生成连续周日历 ==========
const calendarWeeks = computed(() => {
  // 边界判断：日期范围不完整时返回空
  if (!dateRange.value || dateRange.value.length !== 2) return [];

  const rangeStart = parseDate(dateRange.value[0]);
  const rangeEnd = parseDate(dateRange.value[1]);

  // 日历起点：选中开始日期所在周的周一
  let startWeekday = rangeStart.getDay() === 0 ? 6 : rangeStart.getDay() - 1;
  const calendarStart = new Date(rangeStart);
  calendarStart.setDate(rangeStart.getDate() - startWeekday);

  // 日历终点：选中结束日期所在周的周日
  let endWeekday = rangeEnd.getDay() === 0 ? 6 : rangeEnd.getDay() - 1;
  const calendarEnd = new Date(rangeEnd);
  calendarEnd.setDate(rangeEnd.getDate() + (6 - endWeekday));

  const weeks = [];
  let currentDate = new Date(calendarStart);

  while (currentDate <= calendarEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentDate);
      const dateStr = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
      // 判断是否在选中的日期范围内
      const isInRange = d >= rangeStart && d <= rangeEnd;
      const isMonthFirstDay = d.getDate() === 1;
      const month = d.getMonth();
      const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;

      week.push(createDayCell(dateStr, isInRange, isMonthFirstDay, month, dayOfWeek));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
  }

  assignEventsToDays(weeks);
  return weeks;
});

function createDayCell(dateStr, isInRange, isMonthFirstDay, month, dayOfWeek) {
  const isHoliday = holidayDates.includes(dateStr);
  const isWorkAdj = workAdjustDates.includes(dateStr);
  const isWeekendDay = isWeekend(dayOfWeek);
  const isWeekendOrHoliday = (isWeekendDay || isHoliday) && !isWorkAdj;

  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  const isToday = dateStr === todayStr;
  const isPast = dateStr < todayStr;

  return {
    date: new Date(dateStr).getDate(),
    dateStr,
    isInRange,
    isMonthFirstDay,
    month,
    dayOfWeek,
    isWeekendOrHoliday,
    isWorkAdjust: isWorkAdj,
    isToday,
    isPast,
    lunarText: getLunarText(dateStr), // 直接调用封装好的农历函数
    events: [],
  };
}

// ========== 事件排布算法 ==========
function assignEventsToDays(weeks) {
  const dayMap = {};
  weeks.forEach((week) => {
    week.forEach((day) => {
      dayMap[day.dateStr] = day;
    });
  });

  const dayEventSlots = {};
  const sortedEvents = [...events.value].sort((a, b) => {
    return parseDate(a.startTime) - parseDate(b.startTime);
  });

  sortedEvents.forEach((event) => {
    const totalDays = daysBetween(event.startTime, event.endTime) + 1;
    let rowIndex = 0;

    while (true) {
      let conflict = false;
      for (let i = 0; i < totalDays; i++) {
        const d = new Date(parseDate(event.startTime));
        d.setDate(d.getDate() + i);
        const ds = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
        if (!dayEventSlots[ds]) dayEventSlots[ds] = [];
        if (dayEventSlots[ds][rowIndex]) {
          conflict = true;
          break;
        }
      }
      if (!conflict) break;
      rowIndex++;
    }

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(parseDate(event.startTime));
      d.setDate(d.getDate() + i);
      const ds = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
      const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1;

      if (!dayEventSlots[ds]) dayEventSlots[ds] = [];
      dayEventSlots[ds][rowIndex] = true;

      if (dayMap[ds]) {
        dayMap[ds].events.push({
          id: event.id,
          title: event.title,
          type: event.type,
          rowIndex,
          isFirstDay: i === 0,
          isLastDay: i === totalDays - 1,
          isWeekStart: dayOfWeek === 0,
          isWeekEnd: dayOfWeek === 6,
        });
      }
    }
  });
}

// ========== 跳转今天 ==========
function scrollToToday() {
  const todayEl = document.querySelector(".ring-red-500");
  if (todayEl) {
    todayEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

onMounted(() => {
  nextTick(() => {
    scrollToToday();
  });
});
</script>

<style scoped>
/* 日历主体整体字体放大150% */
.calendar-main-body .text-sm {
  font-size: 21px;
}
.calendar-main-body .text-xs {
  font-size: 18px;
}

/* 事件条尺寸同步放大150% */
.calendar-main-body .event-item {
  font-size: 16.5px;
  height: 27px;
  line-height: 23px;
}

/* 月份标签高度适配 */
.calendar-main-body .bg-blue-600 {
  height: 36px;
  line-height: 36px;
}

/* 已过非工作日日期背景圆尺寸适配 */
.calendar-main-body .bg-green-200.rounded-full {
  width: 33px;
  height: 33px;
}

/* 跨天事件无缝衔接：向右延伸1px覆盖单元格边框 */
.event-item:not(.event-end) {
  right: -1px;
}

/* 最后一列不延伸，避免溢出 */
.day-cell:nth-child(7n) .event-item:not(.event-end) {
  right: 0;
}

/* 单日事件四周圆角 */
.event-item.event-start.event-end {
  border-radius: 3px;
}

/* 非范围内的周末背景微调 */
.bg-gray-50.bg-green-50 {
  background-color: #f5faf2;
}
</style>
