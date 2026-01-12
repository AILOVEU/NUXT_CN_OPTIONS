import dayjs from "dayjs";

export function useCopy(text) {
  function selectText(textbox, startIndex, stopIndex) {
    if (textbox.createTextRange) {
      const range = textbox.createTextRange();
      range.moveStart("character", startIndex);
      range.moveEnd("character", startIndex - stopIndex);
      range.select();
    } else {
      textbox.setSelectionRange(startIndex, stopIndex);
      textbox.focus();
    }
  }
  let textArea = document.createElement("textarea");
  textArea.style.position = "fixed";
  textArea.style.top = "-10000"; // 把生成的输入框移动到视线之外
  textArea.style.zIndex = "-1"; // 把生成的输入框移动到视线之外
  textArea.readOnly = "readOnly"; // 设置为只读，这样在移动端才不会弹出虚拟键盘
  textArea.value = text;
  document.body.appendChild(textArea);
  selectText(textArea, 0, text.length);
  try {
    if (document.execCommand("copy")) {
      document.execCommand("copy");
      ElMessage({ message: "复制成功", type: "success" });
    } else {
    }
  } catch (error) {
    ElMessage({ message: `${error}`, type: "error" });
  }
  textArea.blur(); //去掉选中，因为的移动端ios 上，会出现点了选择左上角出现点问题
  document.body.removeChild(textArea);
}

export function generateRandomString(length) {
  var result = "";
  var characters = "abcdefghijklmnopqrstuvwxyz01234567890123456789012345678901234567890123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function formatDecimal(num, toFixed = 2) {
  // 先将数字转为字符串
  const str = num.toString();

  // 判断是否为小数（包含小数点）
  if (str.includes(".")) {
    // 保留两位小数（四舍五入）
    return parseFloat(parseFloat(num).toFixed(toFixed));
  }

  // 如果是整数，直接返回
  return num;
}

/**
 * 数字格式化为「X万XXXX」格式（万后数字自动去除前导0）
 * @param {number|string} num - 输入的正整数（数字/字符串类型均可）
 * @returns {string} 格式化后的字符串
 */
export function formatNumberToWan(num) {
  // 1. 转换为数字并校验有效性
  const targetNum = Number(num);
  if (isNaN(targetNum)) {
    throw new Error("输入参数必须是有效的数字或数字字符串");
  }

  // 2. 绝对值小于10000，直接返回原数字字符串
  const absNum = Math.abs(targetNum);
  if (absNum < 10000) {
    return String(targetNum);
  }

  // 3. 提取符号位（区分正负，正数为空字符串，负数为"-"）
  const signStr = targetNum < 0 ? "-" : "";
  // 取绝对值进行后续拆分计算，避免负号干扰
  const positiveNum = absNum;

  // 4. 拆分万级部分和个级部分
  const wanInteger = Math.floor(positiveNum / 10000); // 万级整数（如 10000 → 1，12345678.9 → 1234）
  const gePart = positiveNum % 10000; // 个级部分（如 10000 → 0，12345678.9 → 5678.9）

  // 5. 判断是否为整万数，分别拼接结果
  if (gePart === 0) {
    // 整万数：符号 + 万级整数 + 万
    return `${signStr}${wanInteger}万`;
  } else {
    // 非整万数：符号 + 万级整数 + 万 + 个级部分
    return `${signStr}${wanInteger}万 ${gePart}`;
  }
}
// 获取指定日期所在月份的第四个星期四
export function get每月第四个周四(dateStr) {
  return dayjs(get每月第四个周三(dateStr), "YYYY-MM-DD").add(1, "days").format("YYYY-MM-DD");
}
/**
 * 获取指定日期所在月份的第四个星期三
 * @param {string} dateStr - 输入日期，格式必须为'YYYY-MM-DD'
 * @returns {string} 该月份第四个星期三的日期，格式'YYYY-MM-DD'
 */
export function get每月第四个周三(dateStr) {
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

export function get上个月最后一个周一() {
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

// 获取两个日期之间的所有日期
export function getDatesBetween(startDate, endDate, format = "YYYY-MM-DD") {
  const dates = [];
  let current = dayjs(startDate);
  const end = dayjs(endDate);

  while (current.isBefore(end) || current.isSame(end)) {
    dates.push(current.format(format));
    current = current.add(1, "day");
  }

  return dates;
}

export function resizeFontSize(res) {
  let clientWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  if (!clientWidth) return res;
  let fontSize = clientWidth / 375;
  return res * fontSize;
}

/**
 * 获取比输入值大的最小10的倍数
 * @param {number} num - 输入值（1~100，支持整数和小数）
 * @returns {number|string} 结果（超出范围返回提示，否则返回10的倍数）
 */
export function get比输入值大的最小十倍数(num) {
  // 步骤2：核心逻辑：除以10 → 向上取整 → 乘以10
  const quotient = num / 10; // 输入值除以10
  const ceilQuotient = Math.ceil(quotient); // 对商向上取整
  const minTenMultiple = ceilQuotient * 10; // 还原为10的倍数

  return minTenMultiple;
}

/**
 * 获取比输入值小的最大10的倍数
 * @param {number} num - 输入值（1~100，支持整数和小数）
 * @returns {number|string} 结果（超出范围返回提示，否则返回10的倍数）
 */
export function get比输入值小的最大十倍数(num) {
  // 步骤2：核心逻辑：除以10 → 向下取整 → 乘以10
  const quotient = num / 10; // 输入值除以10，转化为10的倍数刻度
  const floorQuotient = Math.floor(quotient); // 对商向下取整，获取小于等于商的最大整数
  const maxTenMultiple = floorQuotient * 10; // 还原为10的倍数，得到最终结果

  return maxTenMultiple;
}

export function getMinPointFiveMultiple(num) {
  // 步骤2：核心逻辑：除以0.5 → 向上取整 → 乘以0.5
  const quotient = num / 0.5; // 输入值除以0.5（等价于乘以2）
  const ceilQuotient = Math.ceil(quotient); // 对商进行向上取整
  const minPointFiveMultiple = ceilQuotient * 0.5; // 还原为0.5的倍数
  return minPointFiveMultiple;
}
export function getMaxPointFiveMultipleLessThan(num) {
  // 步骤2：核心逻辑：除以0.5 → 向下取整 → 乘以0.5
  const quotient = num / 0.5; // 输入值除以0.5（等价于乘以2，转化为整数刻度判断）
  const floorQuotient = Math.floor(quotient); // 对商进行向下取整，获取小于等于商的最大整数
  const maxPointFiveMultiple = floorQuotient * 0.5; // 还原为0.5的倍数
  return maxPointFiveMultiple;
}

/**
 * 查找时间范围内所有当月第四个周三的日期
 * @param {string|Date|dayjs.Dayjs} startTime - 开始时间（支持多种格式输入）
 * @param {string|Date|dayjs.Dayjs} endTime - 结束时间（支持多种格式输入）
 * @returns {string[]} 符合条件的日期数组（格式：YYYY-MM-DD）
 */
export function get范围内是第四个周三的日期List(startTime, endTime) {
  // 1. 格式化输入时间为 dayjs 实例，统一处理（确保时间格式合法）
  const start = dayjs(startTime, "YYYY-MM-DD");
  const end = dayjs(endTime, "YYYY-MM-DD");

  // 边界校验：如果开始时间晚于结束时间，返回空数组
  if (start.isAfter(end)) {
    console.warn("开始时间不能晚于结束时间");
    return [];
  }

  // 2. 初始化结果数组和当前遍历日期（从开始时间所在月的月初开始，按月推进提升效率）
  const result = [];
  let currentDate = start.startOf("month"); // 定位到当前月第一天（核心功能支持）

  // 3. 循环遍历，直到当前日期超过结束时间
  while (currentDate.isSameOrBefore(end, "day")) {
    // 4. 核心逻辑：无插件计算当月第四个周三
    // 步骤1：获取当前月的总天数（核心功能：daysInMonth()）
    const daysInCurrentMonth = currentDate.daysInMonth();
    // 步骤2：遍历当前月的所有日期，筛选出所有周三，收集日期号
    const wednesdaysInMonth = [];
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const date = currentDate.date(day);
      // 核心功能：day() 方法返回星期几（0=周日，1=周一，...，3=周三，...，6=周六）
      if (date.day() === 3) {
        wednesdaysInMonth.push(day);
      }
    }

    // 步骤3：获取当月第四个周三（数组索引为3，对应第4个元素）
    const fourthWednesdayDay = wednesdaysInMonth[3];
    if (fourthWednesdayDay) {
      const fourthWednesday = currentDate.date(fourthWednesdayDay);
      // 5. 无插件判断日期是否在输入范围内（仅使用核心 isAfter/isSame/isBefore）
      const isInRange = !fourthWednesday.isBefore(start, "day") && !fourthWednesday.isAfter(end, "day");
      if (isInRange) {
        result.push(fourthWednesday.format("YYYY-MM-DD"));
      }
    }

    // 6. 遍历下一个月（按月推进，避免无效循环，核心功能：add()）
    currentDate = currentDate.add(1, "month");
  }

  return result;
}

export function get有效行权日List(dateStr) {
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
  const curMonth行权日 = get每月第四个周三(dateStr);
  console.log("curMonth行权日", curMonth行权日);

  let monthIdx = +date.format("M") - 1;
  if (dayjs(dateStr, "YYYY-MM-DD").isAfter(dayjs(curMonth行权日, "YYYY-MM-DD"))) {
    monthIdx += 1;
  }
  return validMonthList[monthIdx].map((el) => get每月第四个周三(el));
}
