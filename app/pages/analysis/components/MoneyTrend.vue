<template>
  <div class="w-full">
    <TabSelect
      :options="[
        { label: '日', value: '日' },
        { label: '周', value: '周' },
        { label: '月', value: '月' },
      ]"
      v-model="盈亏曲线Type"
      @click="(val) => (盈亏曲线Type = val)"
    />
  </div>
  <div class="w-full">
    <VChart v-if="盈亏曲线Type === '日'" :option="盈亏曲线日Option" style="height: 400px; width: 100%" />
    <VChart v-if="盈亏曲线Type === '周'" :option="盈亏曲线周Option" style="height: 400px; width: 100%" />
    <VChart v-if="盈亏曲线Type === '月'" :option="盈亏曲线月Option" style="height: 400px; width: 100%" />
  </div>
  <div class="mx-auto text-center text-[18px] font-semibold">{{ yearStr }}资金分布(总盈亏金额：{{ 总盈亏金额 }})</div>
  <div class="w-full">
    <VChart :option="盈亏概览Option" style="height: 400px; width: 100%" />
  </div>
</template>
<script setup>
import { useMoneyStore } from "~/stores/useMoneyStore";
import { 盈亏曲线数据 } from "~/data";
import _ from "lodash";
import dayjs from "dayjs";
import { isDateInRangeWeek } from "~/utils/utils";
const yearStr = computed(() => dayjs().format("YYYY"));
const props = defineProps(["tiledData", "comboList"]);
const { money } = useMoneyStore();
const 盈亏曲线Type = ref("日");
const 持仓金额 = computed(() => {
  let value = 0;
  props.tiledData
    .filter((el) => el["持仓"])
    .forEach((el) => {
      value += el["持仓"] * el["一手价"];
    });
  return value;
});
const 非出金盈亏金额 = computed(() => {
  return 持仓金额.value + money.占用保证金 + money.场内现金 - money.贷款 - money.基础金额;
});

const 总盈亏金额 = computed(() => {
  return 非出金盈亏金额.value + money.出金;
});
const 盈亏概览Option = computed(() => {
  const 贷款位置 = 持仓金额.value + money.场内现金 + money.占用保证金 - money.贷款;
  return {
    yAxis: [
      {
        inverse: true,
        type: "category",
        data: ["持仓", "现金", "保证金", "贷款", "盈亏", "提现"],
      },
    ],
    xAxis: [
      {
        type: "value",
      },
    ],
    tooltip: {
      show: true,
      trigger: "axis",
      formatter: function (params) {
        const target = params[1];
        const { name, value, marker } = target;
        return `${marker}${name}\n${value}`;
      },
    },
    series: [
      {
        markLine: {
          symbol: "none",
          label: {
            show: false,
          },
          data: [
            {
              lineStyle: {
                color: "red",
              },
              name: "基础金额",
              xAxis: money.基础金额,
              label: {
                show: false,
                position: "start",
                formatter: (params) => {
                  const { name, value } = params;
                  return `${name}\n${value}`;
                },
              },
            },
            {
              lineStyle: {
                color: "red",
              },
              name: "第一目标",
              xAxis: money.第一目标,
              label: {
                show: false,
                position: "start",
                formatter: (params) => {
                  const { name, value } = params;
                  return `${name}\n${value}`;
                },
              },
            },
            {
              lineStyle: {
                color: "green",
              },
              name: "当前资金",
              xAxis: 贷款位置 + money.出金,
              label: {
                show: true,
                position: "start",
                formatter: (params) => {
                  const { name, value } = params;
                  return `${name}\n${value}`;
                },
              },
            },
          ],
        },
        name: "辅助",
        type: "bar",
        stack: "总",
        barWidth: 20,
        itemStyle: {
          normal: {
            barBorderColor: "rgba(0,0,0,0)",
            color: "rgba(0,0,0,0)",
          },
        },
        zlevel: -1,
        label: {
          normal: {
            show: false,
            formatter: () => "",
          },
        },
        data: [
          0, // 持仓位置
          持仓金额.value, // 现金位置
          持仓金额.value + money.场内现金, // 保证金位置
          贷款位置, // 贷款位置
          贷款位置 > money.基础金额 ? money.基础金额 : 贷款位置, // 盈亏位置
          贷款位置,
        ],
      },
      ...[
        {
          name: "值",
          type: "bar",
          barWidth: 20,
          stack: "总",
          label: {
            show: true,
            position: "right",
            formatter: (params) => {
              const { name, value } = params;
              return `${name} ${value}`;
            },
          },
          data: [
            {
              name: "持仓",
              value: 持仓金额.value,
              itemStyle: {
                color: "#5070dd",
              },
            },
            {
              name: "现金",
              value: money.场内现金,
              itemStyle: {
                color: "yellow",
              },
            },
            {
              name: "保证金",
              value: money.占用保证金,
              itemStyle: {
                color: "orange",
              },
            },
            {
              name: "贷款",
              value: money.贷款,
              itemStyle: {
                color: "#91cc75",
              },
            },
            {
              name: money.基础金额 > 贷款位置 ? "亏(非出金)" : "盈(非出金)",
              value: Math.abs(money.基础金额 - 贷款位置),
              itemStyle: {
                color: money.基础金额 > 贷款位置 ? "#91cc75" : "#ea5404",
              },
            },
            {
              name: "本期出金",
              value: money.出金,
              itemStyle: {
                color: "orange",
              },
            },
          ],
        },
      ],
    ],
  };
});
const 盈亏曲线日Option = computed(() => {
  // 2. 数据预处理：识别每个月的第一个存在的日期（核心步骤）
  const monthFirstDateMap = new Map(); // 存储「年月标识」->「当月首个日期」
  const firstDateSet = new Set(); // 存储所有当月首个日期，用于快速判断
  盈亏曲线数据.forEach((item) => {
    const { name } = item;
    // 拆分日期为 年、月（统一格式，避免格式不一致导致判断错误）
    const yearMonthKey = dayjs(name, "YYYY-MM-DD").format("YYYY-MM"); // 唯一标识：年-月

    // 若该年月未记录首个日期，则存入并标记
    if (!monthFirstDateMap.has(yearMonthKey)) {
      monthFirstDateMap.set(yearMonthKey, name);
      firstDateSet.add(name); // 加入快速查询集合
    }
  });
  const xAxisDateData = 盈亏曲线数据.map((item) => item.name);
  const seriesValueData = 盈亏曲线数据.map((item) => item.value);
  let preValue = 0;
  const seriesData = 盈亏曲线数据
    .map((item, itemIdx) => {
      let open = item.value === 0 ? 0 : preValue;
      preValue = item.value;
      return {
        date: item.name,
        low: Math.min(preValue, item.value),
        high: Math.max(preValue, item.value),
        open: open,
        close: item.value,
      };
    })
    .map((item) => [item.open, item.close, item.low, item.high, item.date]);
  return {
    // toolbox: {
    //   feature: {
    //     dataZoom: {
    //       yAxisIndex: "none",
    //     },
    //   },
    // },
    // grid: {
    //   right: '10'
    // },
    // tooltip: {
    //   show: true,
    //   trigger: "axis",
    //   formatter: function (params) {
    //     const target = params[0];
    //     const { name, value, marker } = target;
    //     const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    //     const weekNumb = dayjs(name, "YYYY-MM-DD").day();
    //     return `${marker}${name} ${weekdays[weekNumb]}<br />${value}`;
    //   },
    // },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
      formatter: function (params) {
        const target = params[0];
        const { name, value, marker } = target;
        const data = target.data;
        const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const weekNumb = dayjs(data[5], "YYYY-MM-DD").day();
        const 收盘 = data[2];
        const 涨跌 = data[2] - data[1];
        return `${marker}${name} ${weekdays[weekNumb]}<br />${formatNumberToWan(收盘)}<br /><br /><span style="color: ${涨跌 > 0 ? "red" : "green"}">${涨跌 > 0 ? "盈" : "亏"}: ${formatNumberToWan(涨跌)}</span>`;
      },
    },
    backgroundColor: "#fefefe",
    title: {
      text: dayjs().format("YYYY") + "盈亏曲线",
    },
    xAxis: {
      type: "category",
      data: xAxisDateData,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "价格数据",
        type: "candlestick", // K 线图类型
        data: seriesData,
        itemStyle: {
          color: "#ef5350", // 上涨颜色
          color0: "#26a69a", // 下跌颜色
          borderColor: "#ef5350",
          borderColor0: "#26a69a",
        },
        markPoint: {
          data: [
            {
              type: "max",
              name: "最大值",
              // symbol: "none",
              itemStyle: {
                normal: {
                  color: "red",
                  // label: {
                  //   show: true,
                  //   color: '#ffffff'
                  // }
                },
              },
            },
            {
              type: "min",
              name: "最小值",
              // symbol: "none",
              itemStyle: {
                normal: {
                  color: "green",
                  // label: {
                  //   show: true,
                  //   color: '#ffffff'
                  // }
                },
              },
            },
          ],
        },
        markLine: {
          symbol: "none",
          label: {
            formatter: "{b}\n{c}",
          },
          data: [
            // {
            //   lineStyle: {
            //     color: "red",
            //   },
            //   name: "第一目标位",
            //   yAxis: money.第一目标,
            //   // label: {
            //   //   show: false,
            //   //   position: "start",
            //   //   formatter: (params) => {
            //   //     const { name, value } = params;
            //   //     return `${name}\n${value}`;
            //   //   },
            //   // },
            // },
            {
              lineStyle: {
                color: "red",
              },
              name: "创新高",
              yAxis: 43029,
              // label: {
              //   show: false,
              //   position: "start",
              //   formatter: (params) => {
              //     const { name, value } = params;
              //     return `${name}\n${value}`;
              //   },
              // },
            },
            {
              lineStyle: {
                color: "orange",
              },
              name: "平均值",
              type: "average",
            },
            // {
            //   lineStyle: {
            //     color: "orange",
            //   },
            //   name: "平均值",
            //   type: "average",
            // },
            // {
            //   lineStyle: {
            //     color: "green",
            //   },
            //   name: "最小值",
            //   type: "min",
            // },
            // {
            //   lineStyle: {
            //     color: "red",
            //   },
            //   name: "最大值",
            //   type: "max",
            // },
          ],
        },
      },
    ],
  };
});
const 盈亏曲线周Option = computed(() => {
  const weekList = [];
  for (let i = 0; i < 52; i++) {
    weekList.push(i);
  }
  let preClose = 0;
  const weekMapList = weekList.map((week, weekIdx) => {
    let targetList = 盈亏曲线数据.filter((el) => isDateInRangeWeek(week, dayjs(el.name, "YYYY-MM-DD")));
    if (!targetList.length) return { week };
    targetList = _.sortBy(targetList, (el) => el.name);
    let open = targetList[0].value;
    let close = targetList[targetList.length - 1].value;
    let high = targetList[0].value;
    let low = targetList[0].value;
    targetList.forEach((el) => {
      if (el.value > high) high = el.value;
      if (el.value < low) low = el.value;
    });
    if (weekIdx === 0) {
      open = 0;
      preClose = close;
    } else {
      open = preClose;
      preClose = close;
    }
    return {
      week,
      high,
      low,
      open,
      close,
    };
  });
  // 处理数据：过滤空对象，生成 K 线数据格式
  const seriesData = weekMapList.map((item) => [item.open, item.close, item.low, item.high, item.week]);

  // 生成 x 轴类目
  const xData = seriesData.map((item) => `${item[4]}`);

  // ECharts 最终配置项
  return {
    title: {
      text: dayjs().format("YYYY") + "盈亏周K线图",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
      formatter: function (params) {
        const data = params[0].data;
        if (data[1] === undefined) return "";
        return `第${data[5]}周（${getWeekRange(data[5]).join("~")}）<br/><br/>
        收盘：${formatNumberToWan(data[2])}<br/>
        开盘：${formatNumberToWan(data[1])}<br/><br/>
        最高：${formatNumberToWan(data[4])}<br/>
        最低：${formatNumberToWan(data[3])}
      `;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: xData,
      boundaryGap: true,
      axisLine: { onZero: false },
    },
    yAxis: {
      type: "value",
      scale: true, // 自动适配数据区间
    },
    series: [
      {
        name: "价格数据",
        type: "candlestick", // K 线图类型
        data: seriesData,
        itemStyle: {
          color: "#ef5350", // 上涨颜色
          color0: "#26a69a", // 下跌颜色
          borderColor: "#ef5350",
          borderColor0: "#26a69a",
        },
      },
    ],
  };
  // return monthMapList;
});
const 盈亏曲线月Option = computed(() => {
  const monthList = ["01月", "02月", "03月", "04月", "05月", "06月", "07月", "08月", "09月", "10月", "11月", "12月"];
  let preClose = 0;
  const monthMapList = monthList.map((month, monthIdx) => {
    let targetList = 盈亏曲线数据.filter((el) => dayjs(el.name, "YYYY-MM-DD").format("MM月") === month);
    if (!targetList.length) return { month };
    targetList = _.sortBy(targetList, (el) => el.name);
    let open = targetList[0].value;
    let close = targetList[targetList.length - 1].value;
    let high = targetList[0].value;
    let low = targetList[0].value;
    targetList.forEach((el) => {
      if (el.value > high) high = el.value;
      if (el.value < low) low = el.value;
    });
    if (monthIdx === 0) {
      open = 0;
      preClose = close;
    } else {
      open = preClose;
      preClose = close;
    }
    return {
      month,
      high,
      low,
      open,
      close,
    };
  });
  // 处理数据：过滤空对象，生成 K 线数据格式
  const seriesData = monthMapList.map((item) => [item.open, item.close, item.low, item.high, item.month]);

  // 生成 x 轴类目
  const xData = seriesData.map((item) => `${item[4]}`);

  // ECharts 最终配置项
  return {
    title: {
      text: dayjs().format("YYYY") + "盈亏月K线图",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
      formatter: function (params) {
        const data = params[0].data;
        if (data[1] === undefined) return "";
        return `${dayjs().format("YYYY")}年${data[5]}<br/><br/>
        收盘：${formatNumberToWan(data[2])}<br/>
        开盘：${formatNumberToWan(data[1])}<br/><br/>
        最高：${formatNumberToWan(data[4])}<br/>
        最低：${formatNumberToWan(data[3])}
      `;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: xData,
      boundaryGap: true,
      axisLine: { onZero: false },
    },
    yAxis: {
      type: "value",
      scale: true, // 自动适配数据区间
    },
    series: [
      {
        name: "价格数据",
        type: "candlestick", // K 线图类型
        data: seriesData,
        itemStyle: {
          color: "#ef5350", // 上涨颜色
          color0: "#26a69a", // 下跌颜色
          borderColor: "#ef5350",
          borderColor0: "#26a69a",
        },
      },
    ],
  };
  // return monthMapList;
});
</script>
