<template>
  <VChart :option="option" style="height: 300px; width: 100%; margin: auto" />
</template>
<script setup>
const props = defineProps(["option"]);
const option = computed(() => {
  return {
    title: {
      text: props.option.title,
      top: 0, // 标题距离容器顶部10px（可根据需要调整）
      z: 0, // 👈 关键：把标题层级设为最低
    },
    grid: {
      bottom: "0",
      top: "30px",
      // left: "0",
      // right: "0",
    },
    xAxis: {
      name: props.option.xAxisName || "",
    },
    yAxis: {
      name: "手", // 单位文本
      // nameLocation: "start", // 定位到Y轴顶部（起点）
    },
    legend: {
      right: "10%",
      top: "0%",
      data: ["认购", "认沽"],
    },
    series: [
      {
        name: "认沽",
        symbolSize: function (data) {
          return 2 * Math.sqrt(data[2]["一手价"]);
        },
        label: {
          normal: {
            show: true,
            formatter: function (param) {
              const el = param.data[2];
              return el["正股符号"];
            },
          },
        },
        data: props.option.认沽SeriesData,
        type: "scatter",
        // 径向渐变：中心实色，外围渐变透明
        itemStyle: {
          color: {
            type: "radial",
            x: 0.5,
            y: 0.5,
            r: 0.5,
            colorStops: [
              { offset: 0, color: "#00c853" },
              { offset: 0.5, color: "#00c853" },
              { offset: 1, color: "rgba(255, 204, 204,0)" },
            ],
          },
          opacity: 1,
        },
        emphasis: {
          focus: "item",
          label: {
            show: true,
            formatter: props.option.infoFormatter,
            position: "left",
            // 🔥 清晰强化样式
            fontSize: 14, // 文字更大
            fontWeight: "bold", // 文字加粗
            color: "green", // 纯白文字
            backgroundColor: "white", // 深绿背景（更清晰）
            borderWidth: 2, // 白色边框
            borderColor: "#fff", // 边框强化
            borderRadius: 6, // 圆角更美观
            padding: [20, 20], // 内边距更宽松
            // textBorderColor: "#333", // 文字描边
            textBorderWidth: 1, // 描边粗细
          },
        },
      },
      {
        name: "认购",
        symbolSize: function (data) {
          return 2 * Math.sqrt(data[2]["一手价"]);
        },
        label: {
          normal: {
            show: true,
            formatter: function (param) {
              const el = param.data[2];
              return el["正股符号"];
            },
          },
        },
        data: props.option.认购SeriesData,
        type: "scatter",
        itemStyle: {
          color: {
            type: "radial",
            x: 0.5,
            y: 0.5,
            r: 0.5,
            colorStops: [
              { offset: 0, color: "#f44336" },
              { offset: 0.5, color: "#f44336" },
              { offset: 1, color: "rgba(244,67,54,0)" },
            ],
          },
        },
        emphasis: {
          focus: "item",
          label: {
            show: true,
            formatter: props.option.infoFormatter,
            position: "left",
            // 🔥 清晰强化样式
            fontSize: 14, // 文字更大
            fontWeight: "bold", // 文字加粗
            color: "red", // 纯白文字
            backgroundColor: "white", // 深绿背景（更清晰）
            borderWidth: 2, // 白色边框
            borderColor: "#fff", // 边框强化
            borderRadius: 6, // 圆角更美观
            padding: [20, 20], // 内边距更宽松
            // textBorderColor: "#333", // 文字描边
            textBorderWidth: 1, // 描边粗细
          },
        },
      },
    ],
  };
});
</script>
