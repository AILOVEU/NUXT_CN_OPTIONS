<template>
  <el-dialog v-model="dialogVisible" :title="props.optionInfo['期权名称']" :width="isMobile ? '250vw' : '80vw'" :z-index="10000" append-to-body>
    <div class="flex justify-center items-center scale-150 gap-[6px]">
      <el-tag size="small"> 正股价: {{ props.optionInfo["正股价格"].toFixed(4) }} </el-tag>
      <TagCallPut :value="props.optionInfo['沽购']" />
      <TagPrice :value="props.optionInfo['一手价']" />
      <TagIv :value="props.optionInfo['隐波']" />
      <TagDelta :value="props.optionInfo['Delta']" />
      <TagLeverage :value="props.optionInfo['杠杆']" />
      <TagPremium :value="props.optionInfo['溢价率']" />
      <TagGamma :value="props.optionInfo['Gamma']" />
    </div>
    <VChart :option="option" :style="{ height: '700px', width: isMobile ? '250vw' : '80vw', margin: 'auto' }" />
    <template #footer>
      <div>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { ElMessageBox } from "element-plus";
import { blackScholesOptionPrice } from "~/utils/bs";
import { useGlobal } from "~/stores/useGlobal.js";
import { formatDecimal } from "~/utils/utils";
const { setGlobalLoading, isMobile } = useGlobal();
const props = defineProps(["visible", "optionInfo"]);
const emits = defineEmits(["update:visible"]);
const dialogVisible = computed({
  get() {
    return props.visible;
  },
  set(val) {
    emits("update:visible", val);
  },
});
/**
 * @param {number} S - 标的资产当前价格
 * @param {number} K - 期权执行价格
 * @param {number} r - 无风险利率（年化，连续复利）
 * @param {number} T - 到期时间（年）
 * @param {number} sigma - 标的资产年化波动率
 * @param {string} optionType - 期权类型（'call' 看涨 / 'put' 看跌）
 */
const option = computed(() => {
  if (!props.optionInfo) return {};
  const seriesData = [];
  // const { S, K, r, T, sigma, optionType, price } = props.optionInfo;
  const S = props.optionInfo["正股价格"];
  const K = props.optionInfo["行权价"];
  const r = 0.02;
  const T = props.optionInfo["到期天数"] / 365;
  const sigma = (props.optionInfo["隐波"] || 0.01) / 100;
  const optionType = props.optionInfo["沽购"] === "购" ? "call" : "put";
  const price = props.optionInfo["最新价"];

  for (let _S = S * 0.8; _S < S * 1.2; _S += 0.001) {
    const x = _S;
    const y = blackScholesOptionPrice(_S, K, r, T, sigma, optionType);
    seriesData.push([x, y]);
  }
  return {
    animation: false,
    tooltip: {
      trigger: "axis", // 关键1：坐标轴触发
      axisPointer: {
        type: "cross", // 关键2：十字线指示器
        // 可选：自定义十字光标样式
        crossStyle: {
          color: "#0066cc",
          width: 1,
          opacity: 0.8,
        },
      },
      // 可选：tooltip 提示框样式优化
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      textStyle: {
        color: "#fff",
      },
      padding: 10,
      formatter: function (params) {
        const data = params[0];
        return `<div">
            <div>y期价： ${formatDecimal(data.data[1], 4).toFixed(4)}</div><br/>
            <div>x股价： ${formatDecimal(data.data[0], 4).toFixed(4)}</div>
          </div>`;
      },
    },
    grid: {
      top: 40,
      left: 100,
      right: 100,
      bottom: 50,
    },
    xAxis: {
      name: "x",
      type: "value",
      interval: 0.05,
      min: S * 0.9,
      max: S * 1.1,
      axisTick: {
        alignWithLabel: true, // 强制刻度与标签对齐，确保精度
      },
      // 可选：关闭自动刻度优化，强制按interval生成刻度
      boundaryGap: false,
      // minorTick: {
      //   show: true,
      // },
      // minorSplitLine: {
      //   show: true,
      // },
    },
    yAxis: {
      name: "y",
      min: 0,
      max: price * 10,
      interval: 0.025,
      minorTick: {
        show: true,
      },
      minorSplitLine: {
        show: true,
      },
    },
    dataZoom: [
      {
        show: true,
        type: "inside",
        filterMode: "none",
        xAxisIndex: [0],
        startValue: S * 0.92,
        endValue: S * 1.07,
      },
      {
        show: true,
        type: "inside",
        filterMode: "none",
        yAxisIndex: [0],
        startValue: 0,
        endValue: price * 2,
      },
    ],
    series: [
      {
        type: "line",
        data: [],
        markArea: {
          itemStyle: {
            color: "rgba(255, 180, 255, 0.2)",
            borderColor: "#0099ff",
          },
          data: [
            // 区域：按数据索引定位（第 3 个 → 第 5 个数据项，索引从 0 开始）
            [
              { xAxis: S * 0.95 }, // 起点：第 3 个数据项（周四）
              { xAxis: S * 1.05 }, // 终点：第 5 个数据项（周六）
            ],
          ],
        },
      },
      {
        type: "line",
        showSymbol: false,
        clip: true,
        data: seriesData,
        markArea: {
          itemStyle: {
            color: "rgba(0, 180, 255, 0.2)",
            borderColor: "#0099ff",
          },
          data: [
            // 区域：按数据索引定位（第 3 个 → 第 5 个数据项，索引从 0 开始）
            [
              { xAxis: S * 0.98 }, // 起点：第 3 个数据项（周四）
              { xAxis: S * 1.02 }, // 终点：第 5 个数据项（周六）
            ],
          ],
        },
        markLine: {
          symbol: "none",
          data: [
            {
              lineStyle: {
                color: "red",
              },
              label: {
                formatter: "{b}\n{c}",
              },
              name: "正股价格",
              xAxis: S,
            },
            {
              lineStyle: {
                color: "red",
              },
              label: {
                formatter: "{b}\n{c}",
              },
              name: "涨2%价",
              xAxis: S * 1.02,
            },
            {
              lineStyle: {
                color: "red",
              },
              label: {
                formatter: "{b}\n{c}",
              },
              name: "跌2%价",
              xAxis: S * 0.98,
            },
            {
              lineStyle: {
                color: "red",
              },
              label: {
                formatter: "{b}\n{c}",
              },
              name: "涨5%价",
              xAxis: S * 1.05,
            },
            {
              lineStyle: {
                color: "red",
              },
              label: {
                formatter: "{b}\n{c}",
              },
              name: "跌5%价",
              xAxis: S * 0.95,
            },
            {
              lineStyle: {
                color: "red",
              },
              label: {
                formatter: "{b}\n{c}",
              },
              name: "期权价格",
              yAxis: price,
            },
          ],
        },
      },
    ],
  };
});
</script>
