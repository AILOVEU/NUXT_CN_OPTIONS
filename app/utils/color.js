// rgb to hex
function rgbToHex(r, g, b) {
  let hex = ((r << 16) | (g << 8) | b).toString(16);
  return "#" + new Array(Math.abs(hex.length - 7)).join("0") + hex;
}

// hex to rgb
function hexToRgb(hex) {
  let rgb = [];
  for (let i = 1; i < 7; i += 2) {
    rgb.push(parseInt("0x" + hex.slice(i, i + 2)));
  }
  return rgb;
}

// 计算渐变过渡色
export function gradient(startColor, endColor, percent) {
  let step = 100;
  // 将 hex 转换为rgb
  let sColor = hexToRgb(startColor);
  let eColor = hexToRgb(endColor);

  // 计算R\G\B每一步的差值
  let rStep = (eColor[0] - sColor[0]) / step;
  let gStep = (eColor[1] - sColor[1]) / step;
  let bStep = (eColor[2] - sColor[2]) / step;

  let gradientColorArr = [];
  for (let i = 0; i < step; i++) {
    // 计算每一步的hex值
    gradientColorArr.push(
      rgbToHex(
        parseInt(rStep * i + sColor[0]),
        parseInt(gStep * i + sColor[1]),
        parseInt(bStep * i + sColor[2])
      )
    );
  }
  let index = Math.floor(percent * 100);
  if (index > 99) index = 99;
  if (index < 0) index = 0;
  return gradientColorArr[index];
}
export function gradientHandler(percent) {
  return;
}
