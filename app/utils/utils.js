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
  // 1. 预处理：转为纯数字字符串，过滤所有非数字字符
  const pureNumStr = String(num).replace(/\D/g, "");

  // 处理空值、全0的特殊情况
  if (!pureNumStr) return "";
  if (pureNumStr === "0") return "0";

  // 2. 拆分万位部分和万位后的4位（核心：从数字右侧数4位拆分）
  const wanSplitIndex = pureNumStr.length - 4;
  const wanPart = wanSplitIndex > 0 ? pureNumStr.slice(0, wanSplitIndex) : ""; // 万位左侧部分
  const afterWanRaw = pureNumStr.slice(wanSplitIndex); // 万位右侧的原始4位

  // 3. 处理万后数字：去除前导0（如0678→678，5678→5678，0008→8）
  const afterWan = afterWanRaw.replace(/^0+/, "");

  // 4. 拼接最终结果（处理万后无数字的情况，如12340000→1234万）
  let result = "";
  if (wanPart) {
    result += `${wanPart}万`;
  }
  if (afterWan) {
    result += afterWan;
  }

  // 兜底：若结果为空（理论上不会触发，仅防极端情况）
  return result || "0";
}
