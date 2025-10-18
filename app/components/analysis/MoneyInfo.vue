<template>
  <div></div>
  <div>
    <VChart
      :option="盈亏曲线Option"
      style="height: 400px; width: 80%; margin: 0 auto"
    />
  </div>
  <div class="mx-auto text-center text-[18px] font-semibold">
    资金分布(总盈亏金额：{{ 总盈亏金额 }})
  </div>
  <div
    class="border-[3px] rounded-[3px] border-[black] h-[480px] relative text-[15px] font-medium mt-[10px] mx-auto"
    :style="{ width: `calc(${baseWidth}vw + 4px)` }"
  >
    <div class="absolute left-0 top-[0px] flex items-center">
      <!-- 持仓 -->
      <div
        :style="{ width: (baseWidth * 持仓金额) / money.基础金额 + 'vw' }"
        class="h-[60px] py-[10px] bg-[#00B3B3] rounded-[3px]"
      >
        <div class="whitespace-nowrap">持仓</div>
        <div>{{ 持仓金额 }}</div>
        <div>{{ ((100 * 持仓金额) / money.基础金额).toFixed(1) }}%</div>
      </div>
      <!-- 保证金 -->
      <div
        :style="{
          width: (baseWidth * money.占用保证金) / money.基础金额 + 'vw',
        }"
        class="h-[60px] py-[10px] bg-[#B3B300] relative top-[60px] rounded-[3px]"
      >
        <div class="whitespace-nowrap">占用保证金</div>
        <div>{{ money.占用保证金 }}</div>
        <div>{{ ((100 * money.占用保证金) / money.基础金额).toFixed(1) }}%</div>
      </div>
      <!-- 现金金额 -->
      <div
        :style="{
          width: (baseWidth * money.场内现金) / money.基础金额 + 'vw',
        }"
        class="h-[60px] py-[10px] bg-[#FFFF29] rounded-[3px] relative top-[120px]"
      >
        <div class="whitespace-nowrap">场内现金</div>
        <div>{{ money.场内现金 }}</div>
        <div>{{ ((100 * money.场内现金) / money.基础金额).toFixed(1) }}%</div>
      </div>
      <!-- 亏损金额 -->
      <div
        v-if="盈亏金额 <= 0"
        :style="{ width: (baseWidth * -盈亏金额) / money.基础金额 + 'vw' }"
        class="h-[60px] py-[10px] relative top-[180px] left-0 bg-[#FF1414] rounded-[3px]"
      >
        <div class="whitespace-nowrap">亏损金额</div>
        <div>{{ 盈亏金额 }}</div>
        <div>{{ ((100 * 盈亏金额) / money.基础金额).toFixed(1) }}%</div>
        <div
          class="absolute top-[60px] h-[60px] right-0 bg-[#B30059] py-[10px] rounded-[3px]"
          :style="{ width: (baseWidth * money.贷款) / money.基础金额 + 'vw' }"
        >
          <div class="whitespace-nowrap">贷款</div>
          <div>{{ money.贷款 }}</div>
          <div>{{ ((100 * money.贷款) / money.基础金额).toFixed(1) }}%</div>
        </div>
      </div>
      <!-- 盈利金额 -->
      <template v-if="盈亏金额 > 0">
        <div
          :style="{
            width: (baseWidth * 盈亏金额) / money.基础金额 + 'vw',
            left:
              -(baseWidth * (盈亏金额 + money.贷款)) / money.基础金额 + 'vw',
          }"
          class="h-[60px] py-[10px] relative top-[180px] bg-[#82e082] rounded-[3px]"
        >
          <div class="whitespace-nowrap">盈利金额</div>
          <div>{{ 盈亏金额 }}</div>
          <div>{{ ((100 * 盈亏金额) / money.基础金额).toFixed(1) }}%</div>
        </div>
        <div
          class="h-[60px] relative top-[240px] bg-[#d87f7f] rounded-[3px] py-[10px]"
          :style="{
            width: (baseWidth * money.贷款) / money.基础金额 + 'vw',
            left:
              -(baseWidth * (盈亏金额 + money.贷款)) / money.基础金额 + 'vw',
          }"
        >
          <div class="whitespace-nowrap">贷款</div>
          <div>{{ money.贷款 }}</div>
          <div>{{ ((100 * money.贷款) / money.基础金额).toFixed(1) }}%</div>
        </div>
      </template>
    </div>
    <!-- 期转股 -->
    <div class="absolute left-0 top-[300px] flex items-center">
      <div
        class="h-[60px] py-[10px] relative bg-[#82e082] rounded-[3px]"
        :style="{
          width: (baseWidth * money.期转股金额) / money.基础金额 + 'vw',
        }"
      >
        <div class="whitespace-nowrap">期转股金额</div>
        <div>{{ money.期转股金额 }}</div>
        <div>{{ ((100 * money.期转股金额) / money.基础金额).toFixed(1) }}%</div>
      </div>
      <div
        class="h-[60px] py-[10px] relative top-[60px] bg-[#06ed5b] rounded-[3px]"
        :style="{
          width: (baseWidth * money.已提现金额) / money.基础金额 + 'vw',
        }"
      >
        <div class="whitespace-nowrap">已提现金额</div>
        <div>{{ money.已提现金额 }}</div>
        <div>{{ ((100 * money.已提现金额) / money.基础金额).toFixed(1) }}%</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useMoneyStore } from "~/stores/useMoneyStore";
import { UNIT, 盈亏曲线数据 } from "~/data";
const props = defineProps(["all_data", "combo_list"]);
const baseWidth = 50;
const { money } = useMoneyStore();
const 持仓金额 = computed(() => {
  let value = 0;
  props.all_data
    .filter((el) => el["持仓"])
    .forEach((el) => {
      value += el["持仓"] * el["最新价"] * UNIT;
    });
  return value;
});
const 盈亏金额 = computed(() => {
  return (
    持仓金额.value +
    money.占用保证金 +
    money.场内现金 -
    money.贷款 -
    money.基础金额
  );
});

const 总盈亏金额 = computed(() => {
  return 盈亏金额.value + money.已提现金额 + money.期转股金额;
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
