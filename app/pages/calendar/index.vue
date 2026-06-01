<template>
  <div v-loading="loading" class="max-md:w-[300%]">
    <Nav />
    <Capture title="日历" ref="captureRef">
      <el-affix :offset="32">
        <div>
          <el-date-picker v-model="dateRange" show-week-number value-format="YYYY-MM-DD" type="daterange" range-separator="To" start-placeholder="Start date" end-placeholder="End date" />
        </div>
        <div class="flex">
          <div class="basis-[12.5%] flex justify-center items-center"><el-button @click="() => captureRef.download()" link>⬇</el-button></div>
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
          <div v-for="item in days" class="text-[28px] relative border-[1px] border-[black] h-[450px] flex items-center justify-center flex-col" :style="getStyle(item)">
            <div class="absolute z-50 bg-white right-[3px] bottom-[3px]">
              <div v-if="!item.isMonthFirstDay">{{ item.showText }}</div>
              <div v-else>{{ item.showText }}</div>
            </div>
            <div v-if="商品期权到期Map[item.date]" class="text-[22px] text-[black]">{{ 商品期权到期Map[item.date] }}</div>
            <div v-if="股指期权到期Map[item.date]" class="text-[blue]">{{ 股指期权到期Map[item.date] }}</div>
            <div v-if="自定义Map[item.date]" class="text-[18px] text-[green]">{{ 自定义Map[item.date] }}</div>
            <div v-if="item.holidayName">{{ item.holidayName }}</div>
            <div v-if="item.isCurrent" class="text-[36px]">🚩</div>
            <div v-if="item.isQuarterOptions" class="text-[30px] text-[red]">ETF季交割</div>
            <div v-else-if="item.isFourthWednesday" class="text-[red]">ETF期权</div>
            <div v-if="item.isGeneratedNewQuarterOptions" class="text-[30px]">🔖新季期权</div>
            <div v-if="item.isBirthday">🎂</div>
            <div v-if="item.isFirstMonday" class="relative translate-x-[-100%] w-full flex justify-center text-[30px]">
              {{ dayjs(item.date, "YYYY-MM-DD").format("M月") }}
            </div>
          </div>
        </div>
      </div>
    </Capture>
  </div>
</template>
<script setup>
import _ from "lodash";
import dayjs from "dayjs";
import { getFourThursdayOfMonth, getFourWednesdayOfMonth, getLastMondayOfPreMonth, getDatesBetween, getFirstMondayOfMonth, getWeekMonday } from "~/utils/utils";

function getStyle(item) {
  const styleCfg = {};
  if (item.isCurrent) styleCfg.border = "6px solid red";
  // if (item.isGeneratedNewQuarterOptions) styleCfg.border = "6px solid green";
  if (item.isBirthday) styleCfg.border = "6px solid orange";
  if (dayjs(item.date, "YYYY-MM-DD").isBefore(dayjs(), "days")) {
    // styleCfg.background = "gray";
    styleCfg.filter = "grayscale(0.75)";
    styleCfg.background = "gray";
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

const dateRange = ref([getLastMondayOfPreMonth().format("YYYY-MM-DD"), "2026-12-31"]);
const days = computed(() => {
  return getDatesBetween(getWeekMonday(dayjs(dateRange.value[0]), "YYYY-MM-DD"), dayjs(dateRange.value[1], "YYYY-MM-DD")).map((el) => {
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
  });
});

const 商品期权到期Map = ref({
  "2026-05-12": "碳酸锂,工业硅,多晶硅,铂,钯",
  "2026-05-13": "玻璃,甲醇,短纤,丙烯,瓶片,纯碱,硅铁,烧碱,锰硅,PTA,尿素,动力煤,白糖(2607MS),原油",
  "2026-05-18": "燃料油",
  "2026-05-21": "豆二,纯苯,苯乙烯,乙二醇,铁矿石,鸡蛋,焦煤,聚乙烯,棕榈油,液化石油气,聚丙烯,聚氯乙烯,玉米(2607MS),豆粕(2607MS)",
  "2026-05-25": "沥青,锌,漂针浆,锡,橡胶,螺纹钢,铅,胶纸,镍,铜,合成橡胶,黄金,氧化铝,铝,白银,铝合金",
  "2026-05-27": "红枣,对二甲苯",
  "2026-06-05": "碳酸锂,工业硅,多晶硅,铂,钯",
  "2026-06-11": "白糖,棉花,PTA,甲醇,菜籽粕,动力煤,菜籽油,花生,玻璃,纯碱,硅铁,锰硅,尿素,短纤,丙烯,瓶片,烧碱,白糖(2608MS),原油",
  "2026-06-16": "豆一,豆二,玉米,玉米淀粉,豆油,豆粕,纯苯,苯乙烯,乙二醇,铁矿石,鸡蛋,焦煤,焦炭,聚乙烯,棕榈油,液化石油气,聚丙烯,聚氯乙烯,生猪",
  "2026-06-22": "燃料油",
  "2026-06-29": "沥青,锌,漂针浆,锡,橡胶,螺纹钢,铅,胶纸,镍,铜,合成橡胶,黄金,氧化铝,铝,白银,铝合金",
  "2026-06-30": "红枣,对二甲苯",
  "2026-07-07": "碳酸锂,工业硅,多晶硅,铂,钯",
  "2026-07-14": "白糖,棉花,PTA,甲醇,菜籽粕,动力煤,菜籽油,花生,玻璃,纯碱,硅铁,锰硅,尿素,短纤,丙烯,瓶片,烧碱,白糖(2609MS),原油",
  "2026-07-17": "燃料油",
  "2026-07-21": "豆一,豆二,玉米,玉米淀粉,豆油,豆粕,纯苯,苯乙烯,乙二醇,铁矿石,鸡蛋,焦煤,焦炭,聚乙烯,棕榈油,液化石油气,聚丙烯,聚氯乙烯,生猪,玉米(2609MS),豆粕(2609MS)",
  "2026-07-29": "沥青,锌,漂针浆,锡,橡胶,螺纹钢,铅,胶纸,镍,铜,合成橡胶,黄金,氧化铝,铝,白银,铝合金",
  "2026-07-30": "红枣,对二甲苯",
  "2026-08-07": "碳酸锂,工业硅,多晶硅,铂,钯",
  "2026-08-12": "白糖,棉花,PTA,甲醇,菜籽粕,动力煤,菜籽油,花生,玻璃,纯碱,硅铁,锰硅,尿素,短纤,丙烯,瓶片,烧碱,白糖(2610MS),原油",
  "2026-08-18": "豆一,豆二,玉米,玉米淀粉,豆油,豆粕,纯苯,苯乙烯,乙二醇,铁矿石,鸡蛋,焦煤,焦炭,聚乙烯,棕榈油,液化石油气,聚丙烯,聚氯乙烯,生猪",
  "2026-08-19": "燃料油",
  "2026-08-26": "沥青,锌,漂针浆,锡,橡胶,螺纹钢,铅,胶纸,镍,铜,合成橡胶,黄金,氧化铝,铝,白银,铝合金",
  "2026-08-28": "红枣,对二甲苯",
  "2026-09-04": "碳酸锂,工业硅,多晶硅,铂,钯",
  "2026-09-11": "白糖,棉花,PTA,甲醇,菜籽粕,动力煤,菜籽油,花生,玻璃,纯碱,硅铁,锰硅,尿素,短纤,丙烯,瓶片,烧碱,白糖(2611MS),原油",
  "2026-09-18": "豆一,豆二,玉米,玉米淀粉,豆油,豆粕,纯苯,苯乙烯,乙二醇,铁矿石,鸡蛋,焦煤,焦炭,聚乙烯,棕榈油,液化石油气,聚丙烯,聚氯乙烯,生猪,玉米(2611MS),豆粕(2611MS)",
  "2026-09-22": "燃料油",
  "2026-09-25": "沥青,锌,漂针浆,锡,橡胶,螺纹钢,铅,胶纸,镍,铜,合成橡胶,黄金,氧化铝,铝,白银,铝合金",
  "2026-09-29": "红枣,对二甲苯",
  "2026-10-14": "碳酸锂,工业硅,多晶硅,铂,钯",
  "2026-10-15": "白糖,棉花,PTA,甲醇,菜籽粕,动力煤,菜籽油,花生,玻璃,纯碱,硅铁,锰硅,尿素,短纤,丙烯,瓶片,烧碱,白糖(2612MS),原油",
  "2026-10-19": "燃料油",
  "2026-10-22": "豆一,豆二,玉米,玉米淀粉,豆油,豆粕,纯苯,苯乙烯,乙二醇,铁矿石,鸡蛋,焦煤,焦炭,聚乙烯,棕榈油,液化石油气,聚丙烯,聚氯乙烯,生猪",
  "2026-10-28": "沥青,锌,漂针浆,锡,橡胶,螺纹钢,铅,胶纸,镍,铜,合成橡胶,黄金,氧化铝,铝,白银,铝合金",
  "2026-10-30": "红枣,对二甲苯",
  "2026-11-06": "碳酸锂,工业硅,多晶硅,铂,钯",
  "2026-11-13": "白糖,棉花,PTA,甲醇,菜籽粕,动力煤,菜籽油,花生,玻璃,纯碱,硅铁,锰硅,尿素,短纤,丙烯,瓶片,烧碱,白糖(2701MS),原油",
  "2026-11-18": "燃料油",
  "2026-11-20": "豆一,豆二,玉米,玉米淀粉,豆油,豆粕,纯苯,苯乙烯,乙二醇,铁矿石,鸡蛋,焦煤,焦炭,聚乙烯,棕榈油,液化石油气,聚丙烯,聚氯乙烯,生猪,玉米(2701MS),豆粕(2701MS)",
  "2026-11-25": "沥青,锌,漂针浆,锡,橡胶,螺纹钢,铅,胶纸,镍,铜,合成橡胶,黄金,氧化铝,铝,白银,铝合金",
  "2026-11-27": "红枣,对二甲苯",
  "2026-12-08": "碳酸锂,工业硅,多晶硅,铂,钯",
  "2026-12-11": "白糖,棉花,PTA,甲醇,菜籽粕,动力煤,菜籽油,花生,玻璃,纯碱,硅铁,锰硅,尿素,短纤,丙烯,瓶片,烧碱,白糖(2702MS),原油",
  "2026-12-18": "豆一,豆二,玉米,玉米淀粉,豆油,豆粕,纯苯,苯乙烯,乙二醇,铁矿石,鸡蛋,焦煤,焦炭,聚乙烯,棕榈油,液化石油气,聚丙烯,聚氯乙烯,生猪",
  "2026-12-22": "燃料油",
  "2026-12-24": "沥青,锌,漂针浆,锡,橡胶,螺纹钢,铅,胶纸,镍,铜,合成橡胶,黄金,氧化铝,铝,白银,铝合金",
  "2026-12-30": "红枣,对二甲苯",
});
const 股指期权到期Map = ref({
  "2026-05-15": "股指期权",
  "2026-06-19": "股指期权",
  "2026-07-17": "股指期权",
  "2026-08-21": "股指期权",
  "2026-09-18": "股指期权",
  "2026-10-16": "股指期权",
  "2026-11-20": "股指期权",
  "2026-12-18": "股指期权",
});

const 自定义Map = ref({
  "2026-06-15": "Ti预选开始",
  "2026-06-28": "Ti预选结束",
  "2026-06-11": "世界杯开始",
  "2026-06-28": "世界杯结束",
  "2026-08-13": "Ti开始",
  "2026-08-23": "Ti结束",
});
const captureRef = ref(null);
</script>
