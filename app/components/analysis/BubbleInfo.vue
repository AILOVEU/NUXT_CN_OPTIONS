<template>
  <!-- <div
    v-for="item in [
      '#5470c6',
      '#91cc75',
      '#fac858',
      '#ee6666',
      '#73c0de',
      '#3ba272',
      '#fc8452',
      '#9a60b4',
      '#ea7ccc',
    ]"
    :style="{ backgroundColor: item }"
  >
    {{ item }}
  </div> -->
  <div>
    <el-form
      :model="formData"
      label-width="auto"
      style="max-width: 600px"
      label-suffix=":"
    >
      <el-form-item label="隐波范围">
        <el-col :span="11">
          <span class="text-gray-500">最小值</span>
          <el-input placeholder="最小值" v-model="formData.隐波Range[0]" />
        </el-col>
        <el-col :span="2" class="text-center">
          <span class="text-gray-500">-</span>
        </el-col>
        <el-col :span="11">
          <span class="text-gray-500">最大值</span>
          <el-input placeholder="最大值" v-model="formData.隐波Range[1]" />
        </el-col>
      </el-form-item>
      <el-form-item label="过滤当月期权">
        <el-radio-group v-model="formData.过滤当月">
          <el-radio :value="true">是</el-radio>
          <el-radio :value="false">否</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
  </div>
  <div>
    <VChart :option="option" style="height: 900px; width: 100vw" />
  </div>
</template>
<script setup>
import {
  UNIT,
  stock_code_map,
  deadline_list,
  stock_color_map,
  stock_sorted_list,
} from "~/data";
import dayjs from "dayjs";
import _ from "lodash";
const 到期天数List = deadline_list.map(
  (date) => dayjs(date, "YYYYMMDD").diff(dayjs(), "days") + 1
);
const formData = reactive({
  隐波Range: [6, 25],
  过滤当月: true,
});
const props = defineProps(["all_data"]);
const option = computed(() => {
  let all_data = props.all_data;
  if (!all_data?.length) return {};
  all_data = all_data
    .filter((el) => el["隐波"])
    .filter(
      (el) =>
        el["隐波"] < formData.隐波Range[1] && el["隐波"] > formData.隐波Range[0]
    )
    .filter((el) => !el["期权名称"].includes("A"))
    .filter((el) =>
      formData.过滤当月 ? el["到期日"] !== deadline_list[0] : true
    );
  const stockCodeList = stock_sorted_list.filter((el) =>
    Array.from(new Set(all_data.map((el) => el["正股代码"]))).includes(el)
  );
  const dataList = stockCodeList.map((code) => {
    let codeOptions = all_data.filter((el) => el["正股代码"] === code);
    return codeOptions.map((el) => {
      const isCall = el["期权名称"].includes("购");
      const 到期天数 = isCall ? el["到期天数"] : -el["到期天数"];
      const symbolSize =
        10 *
        Math.abs(
          el["Delta"] /
            el["最新价"] /
            Math.sqrt(
              !el["时间损耗"] || el["时间损耗"] > -1 ? 1 : -el["单日损耗"]
            )
        );
      return [
        到期天数,
        el["隐波"],
        Math.floor(symbolSize),
        { ...el, 到期天数 },
      ];
    });
  });
  return {
    title: {
      text: "全部期权信息",
    },
    legend: {
      data: stockCodeList.map((el) => stock_code_map[el]),
      bottom: "0",
    },
    xAxis: {
      // type: 'category',
      // minInterval: 240,
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      // type: "log",
      splitLine: {
        show: false,
      },
      scale: true,
    },
    series: [
      ...dataList.map((el) => ({
        name: stock_code_map[el[0][3]["正股代码"]],
        color: stock_color_map[el[0][3]["正股代码"]],
        data: el,
        type: "scatter",
        symbolSize: function (el) {
          let data = el[2];
          return data;
        },
        markLine: {
          lineStyle: {
            color: "#ccc",
          },
          symbol: "none",
          data: [
            ..._.reverse(到期天数List.map((el) => -el)),
            ...到期天数List,
          ].map((day) => ({
            xAxis: day,
          })),
        },
        // markLine: {
        //   data: [
        //     {
        //       type: "average",
        //     },
        //   ],
        //   silent: true,
        // },
        emphasis: {
          focus: "series",
          label: {
            show: true,
            formatter: function (param) {
              const data = param.data[3];
              return `${param.data[2]} \n ${data["期权名称"]}  价：${Math.floor(
                data["最新价"] * UNIT
              )} \n 隐波:${data["隐波"]}  Delta: ${data["Delta"]} 单日损耗: ${
                data["单日损耗"]
              }`;
            },
            position: "top",
          },
        },
      })),
    ],
  };
});
</script>
