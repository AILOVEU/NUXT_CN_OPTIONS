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
    return parseFloat(num).toFixed(toFixed);
  }

  // 如果是整数，直接返回
  return num;
}
