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
export function getFourthThursdayOfMonth(dateStr) {
  return dayjs(getFourthWednesdayOfMonth(dateStr), "YYYY-MM-DD").add(1, "days").format("YYYY-MM-DD");
}
/**
 * 获取指定日期所在月份的第四个星期三
 * @param {string} dateStr - 输入日期，格式必须为'YYYY-MM-DD'
 * @returns {string} 该月份第四个星期三的日期，格式'YYYY-MM-DD'
 */
export function getFourthWednesdayOfMonth(dateStr) {
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

export function getLastMondayOfPreviousMonth() {
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
