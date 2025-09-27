<template>
  <div class="flex flex-col mx-auto">
    <VChart :option="正股分布Option" style="height: 400px; width: 100vw" />
    <VChart :option="时间分布Option" style="height: 400px; width: 100vw" />
    <VChart :option="沽购分布Option" style="height: 400px; width: 100vw" />
  </div>
</template>
<script setup>
import { stock_code_map, deadline_list, UNIT, stock_sort_map } from "~/data";
import { get_http_data } from "~/utils";
import _ from "lodash";
const props = defineProps(["options_list"]);
const stockCodeList = Object.keys(stock_code_map);
const optionType = ["购", "沽"];
const 正股分布 = ref({});
const sub正股分布 = ref({});

const 时间分布 = ref({});
const 沽购分布 = ref({});
function getPieOptions({ title, seriesData1, seriesData2 = [] }) {
  return {
    title: {
      text: title,
      left: "center",
    },
    tooltip: {
      trigger: "item",
    },
    legend: {
      // orient: "vertical",
      bottom: "0",
    },
    series: [
      {
        radius: ["50%", "60%"],
        smooth: true,
        // radius: '50%',
        // roseType: 'area',
        padAngle: 2,
        type: "pie",
        data: seriesData1,
        label: {
          formatter: "{b}\n{c}\n({d}%)",
        },
      },
      {
        radius: ["30%", "40%"],
        smooth: true,
        label: {
          show: false,
        //   position: "inner",
        },
        labelLine: {
          show: false,
        },
        padAngle: 2,
        type: "pie",
        data: seriesData2,
        // label: {
        //   formatter: "{b}\n{c}\n({d}%)",
        // },
      },
    ],
  };
}
const 正股分布Option = computed(() => {
  return getPieOptions({
    title: "正股分布",
    seriesData1: _.sortBy(
      Object.keys(正股分布.value).map((code) => ({
        code,
        name: stock_code_map[code],
        value: get_list_all_hold(正股分布.value[code]),
      })),
      (el) => stock_sort_map[el.code]
    ),
    seriesData2: _.sortBy(
      Object.keys(sub正股分布.value).map((code_type) => {
        const [code, type] = code_type.split("-");
        return {
          code,
          name: type,
          value: Math.floor(get_list_all_hold(sub正股分布.value[code_type])),
        };
      }),
      (el) => stock_sort_map[el.code]
    ),
  });
});
const 时间分布Option = computed(() => {
  return getPieOptions({
    title: "时间分布",
    seriesData1: Object.keys(时间分布.value).map((date) => ({
      name: date,
      value: get_list_all_hold(时间分布.value[date]),
    })),
  });
});
const 沽购分布Option = computed(() => {
  return getPieOptions({
    title: "沽购分布",
    seriesData1: Object.keys(沽购分布.value).map((type) => ({
      name: type,
      value: get_list_all_hold(沽购分布.value[type]),
    })),
  });
});
watch(
  () => props.options_list,
  () => {
    if (!props.options_list?.length) return;
    const options_list = props.options_list;
    optionType.forEach((type) => {
      沽购分布.value[type] = options_list.filter((el) =>
        el["期权名称"].includes(type)
      );
    });
    stockCodeList.forEach((code) => {
      正股分布.value[code] = options_list.filter(
        (el) => el["正股代码"] === code
      );
      optionType.forEach((type) => {
        sub正股分布.value[code + "-" + type] = 正股分布.value[code].filter(
          (el) => el["期权名称"].includes(type)
        );
      });
    });
    deadline_list.forEach((date) => {
      时间分布.value[date] = options_list.filter((el) =>
        el["到期日"].includes(date)
      );
    });
  },
  {
    immediate: true,
    deep: true,
  }
);
function get_list_all_hold(list) {
  let sum = 0;
  list.forEach((el) => {
    sum += el["持仓"] * el["最新价"] * UNIT;
  });
  return sum;
}
</script>
