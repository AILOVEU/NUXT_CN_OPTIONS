import { jsPDF } from "jspdf";

/**
 * 导出图片数组为打印PDF（A4、自动横竖页、居中、深度压缩，兼容所有jspdf版本）
 * @param {string[]} base64Arr canvas.toDataURL 图片base64数组
 */
export async function downloadPrintPdf(base64Arr) {
  // 获取图片原始宽高
  const getImgSize = (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => resolve({ w: img.width, h: img.height });
      img.onerror = () => resolve({ w: 1, h: 1 });
    });
  };

  const A4_PORTRAIT_W = 210;
  const A4_PORTRAIT_H = 297;
  const A4_LANDSCAPE_W = 297;
  const A4_LANDSCAPE_H = 210;

  let pdf = null;
  // 图片压缩质量 0~1，打印推荐 0.6 ~ 0.7，清晰度足够、体积大幅下降
  const IMG_QUALITY = 0.7;

  for (let i = 0; i < base64Arr.length; i++) {
    const base64 = base64Arr[i];
    const { w, h } = await getImgSize(base64);
    const isLandscapeImg = w > h;

    // 初始化PDF：开启文档整体压缩 compress: true
    if (i === 0) {
      pdf = new jsPDF({
        orientation: isLandscapeImg ? "l" : "p",
        unit: "mm",
        format: "a4",
        compress: true // 开启PDF流压缩，进一步减体积
      });
    } else {
      pdf.addPage(isLandscapeImg ? "l" : "p");
    }

    const pageW = pdf.internal.pageSize.width;
    const pageH = pdf.internal.pageSize.height;
    const imgRatio = w / h;

    // 等比例适配页面
    let fitW = pageW;
    let fitH = fitW / imgRatio;
    if (fitH > pageH) {
      fitH = pageH;
      fitW = fitH * imgRatio;
    }

    const x = (pageW - fitW) / 2;
    const y = (pageH - fitH) / 2;

    // 直接传 base64 + 最后一个参数指定压缩质量，修复charCodeAt报错
    pdf.addImage(
      base64,
      "JPEG",
      x,
      y,
      fitW,
      fitH,
      `img_${i}`, // 图片别名，随便填
      IMG_QUALITY // 关键：图片二次压缩
    );
  }

  pdf.save("打印文件.pdf");
}