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
    <div class="grid grid-cols-7">
      <div
        v-for="item in days"
        class="border-[1px] border-[black]"
        :style="getStyle(item)"
      >
        <div v-if="item.isFourthWednesday">🔔</div>
        <div v-if="item.isBirthday">🎂🎂🎂</div>
        <div>{{ item.date }}</div>
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
      background: "#dacef3",
    };
  } else {
    return {
      background: "white",
    };
  }
  if ([6, 0].includes(item.weekday)) {
    return {
      background: "green",
    };
  } else {
    return {
      background: "white",
    };
  }
}

const days = ref(
  getDatesBetween(
    dayjs("2025-11-03", "YYYY-MM-DD"),
    dayjs("2027-12-31", "YYYY-MM-DD")
  ).map((el) => ({
    date: el,
    weekday: dayjs(el, "YYYY-MM-DD").day(),
    isFourthWednesday: isFourthWednesday(el),
    isBirthday: ["04-26", "12-05", "07-11"].includes(
      dayjs(el, "YYYY-MM-DD").format("MM-DD")
    ),
    isEvenMonth: !!(dayjs(el, "YYYY-MM-DD").month() % 2),
  }))
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
</script>
