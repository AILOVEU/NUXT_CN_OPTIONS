<template>
  <div class="w-full">
    <VChart :option="盈亏曲线Option" style="height: 400px; width: 100%" />
  </div>
  <div class="mx-auto text-center text-[18px] font-semibold">资金分布(总盈亏金额：{{ 总盈亏金额 }})</div>
  <div class="w-full">
    <VChart :option="盈亏概览Option" style="height: 400px; width: 100%" />
  </div>
</template>
<script setup>
import { useMoneyStore } from "~/stores/useMoneyStore";
import { 盈亏曲线数据 } from "~/data";
import _ from "lodash";
import dayjs from "dayjs";
const props = defineProps(["all_data", "combo_list"]);
const { money } = useMoneyStore();
const 持仓金额 = computed(() => {
  let value = 0;
  props.all_data
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
const 盈亏曲线Option = computed(() => {
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
    tooltip: {
      show: true,
      trigger: "axis",
      formatter: function (params) {
        const target = params[0];
        const { name, value, marker } = target;
        const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        const weekNumb = dayjs(name, "YYYY-MM-DD").day();
        return `${marker}${name} ${weekdays[weekNumb]}<br />${value}`;
      },
    },
    backgroundColor: "#fefefe",
    title: {
      text: "历史盈亏曲线",
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
        label: {
          show: false,
          // position: "insideTop",
        },
        data: seriesValueData,
        type: "line",
        itemStyle: {
          color: function (params) {
            // params.dataIndex：当前数据点的索引
            const currentDate = xAxisDateData[params.dataIndex];
            // 判断当前日期是否是当月首个有效日期
            if (firstDateSet.has(currentDate)) {
              return "#ff0000"; // 红色：当月首个日期
            } else {
              return "#0066ff"; // 蓝色：其他日期
            }
          },
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
            {
              lineStyle: {
                color: "red",
              },
              name: "一万重建盈亏线",
              yAxis: 21537,
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
            {
              lineStyle: {
                color: "orange",
              },
              name: "平均值",
              type: "average",
            },
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
</script>
