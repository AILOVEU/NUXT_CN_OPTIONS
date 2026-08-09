import dayjs from "dayjs";

/**
 * 获取指定日期所在月份的第四个星期三
 * @param {string} dateStr - 输入日期，格式必须为'YYYY-MM-DD'
 * @returns {string} 该月份第四个星期三的日期，格式'YYYY-MM-DD'
 */
export function getFourWednesdayOfMonth(dateStr) {
  // 1. 解析输入日期为dayjs对象（验证格式有效性）
  const inputDate = dayjs(dateStr, "YYYY-MM-DD");
  if (!inputDate.isValid()) {
    return "";
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

export function getValidExerciseDate(dateStr) {
  const date = dayjs(dateStr, "YYYY-MM-DD");
  const validMonthList = [
    [date.format("YYYY-01-01"), date.format("YYYY-02-01"), date.format("YYYY-03-01"), date.format("YYYY-06-01")],
    [date.format("YYYY-02-01"), date.format("YYYY-03-01"), date.format("YYYY-06-01"), date.format("YYYY-09-01")],
    [date.format("YYYY-03-01"), date.format("YYYY-04-01"), date.format("YYYY-06-01"), date.format("YYYY-09-01")],
    [date.format("YYYY-04-01"), date.format("YYYY-05-01"), date.format("YYYY-06-01"), date.format("YYYY-09-01")],
    [date.format("YYYY-05-01"), date.format("YYYY-06-01"), date.format("YYYY-09-01"), date.format("YYYY-12-01")],
    [date.format("YYYY-06-01"), date.format("YYYY-07-01"), date.format("YYYY-09-01"), date.format("YYYY-12-01")],
    [date.format("YYYY-07-01"), date.format("YYYY-08-01"), date.format("YYYY-09-01"), date.format("YYYY-12-01")],
    [date.format("YYYY-08-01"), date.format("YYYY-09-01"), date.format("YYYY-12-01"), date.add(1, "years").format("YYYY-03-01")],
    [date.format("YYYY-09-01"), date.format("YYYY-10-01"), date.format("YYYY-12-01"), date.add(1, "years").format("YYYY-03-01")],
    [date.format("YYYY-10-01"), date.format("YYYY-11-01"), date.format("YYYY-12-01"), date.add(1, "years").format("YYYY-03-01")],
    [date.format("YYYY-11-01"), date.format("YYYY-12-01"), date.add(1, "years").format("YYYY-03-01"), date.add(1, "years").format("YYYY-06-01")],
    [date.format("YYYY-12-01"), date.add(1, "years").format("YYYY-01-01"), date.add(1, "years").format("YYYY-03-01"), date.add(1, "years").format("YYYY-06-01")],
    [date.add(1, "years").format("YYYY-01-01"), date.add(1, "years").format("YYYY-02-01"), date.add(1, "years").format("YYYY-03-01"), date.add(1, "years").format("YYYY-06-01")],
  ];
  const curMonth行权日 = getFourWednesdayOfMonth(dateStr);
  let monthIdx = +date.format("M") - 1;
  if (dayjs(dateStr, "YYYY-MM-DD").isAfter(dayjs(curMonth行权日, "YYYY-MM-DD"))) {
    monthIdx += 1;
  }
  return validMonthList[monthIdx].map((el) => getFourWednesdayOfMonth(el));
}
