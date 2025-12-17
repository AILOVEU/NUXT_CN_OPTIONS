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
import { UNIT, 盈亏曲线数据 } from "~/data";
import _ from "lodash";
import dayjs from 'dayjs';
const props = defineProps(["all_data", "combo_list"]);
const { money } = useMoneyStore();
const 持仓金额 = computed(() => {
  let value = 0;
  props.all_data
    .filter((el) => el["持仓"])
    .forEach((el) => {
      value += el["持仓"] * el['一手价'];
    });
  return value;
});
const 盈亏金额 = computed(() => {
  return 持仓金额.value + money.占用保证金 + money.场内现金 - money.贷款 - money.基础金额;
});

const 总盈亏金额 = computed(() => {
  return 盈亏金额.value + money.已提现金额;
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
        const week = dayjs(name,'YYYY-MM-DD').week()
        return `${marker}${name}\n${week} ${value}`;
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
                color: "green",
              },
              name: "当前资金",
              xAxis: 贷款位置 + money.已提现金额,
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
              name: money.基础金额 > 贷款位置 ? "亏" : "盈",
              value: Math.abs(money.基础金额 - 贷款位置),
              itemStyle: {
                color: money.基础金额 > 贷款位置 ? "#91cc75" : "#ea5404",
              },
            },
            {
              name: "提现",
              value: money.已提现金额,
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
      trigger: "axis",
      // position: function (pt) {
      //   return [pt[0], "10%"];
      // },
    },
    backgroundColor: "#fefefe",
    title: {
      text: "历史盈亏曲线",
    },
    xAxis: {
      type: "category",
      data: 盈亏曲线数据.map((el) => el.name),
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
        data: 盈亏曲线数据.map((el) => el.value),
        type: "line",
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
