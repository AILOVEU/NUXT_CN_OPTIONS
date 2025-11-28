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



// ↓ 颜色切割 start↓
export const getColorSplitHander = (startColor, endColor) => {
  function interpolateColor(color1, color2, factor) {
    var result = color1.slice();
    for (var i = 0; i < 3; i++) {
      result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
  }
  let h2r = function (hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
  };
  let r2h = function (rgb) {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
  };
  return (value, min = 0, max = 100) => {
    let tempValue = value;
    if (value > max) tempValue = max;
    if (value < min) tempValue = min;
    const stepPercent = (tempValue - min) / (max - min);
    const scol = h2r(startColor);
    const ecol = h2r(endColor);
    if (!scol || !ecol) return startColor;
    var icol = interpolateColor(scol, ecol, stepPercent),
      hcol = r2h(icol);
    return hcol;
  };
};
// ↑ 颜色切割 end↑