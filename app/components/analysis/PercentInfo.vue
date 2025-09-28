<template>
  <div class="flex flex-col mx-auto">
    <VChart :option="正股分布Option" style="height: 700px; width: 100vw" />
    <VChart :option="时间分布Option" style="height: 700px; width: 100vw" />
    <VChart :option="沽购分布Option" style="height: 700px; width: 100vw" />
  </div>
</template>
<script setup>
import {
  stock_code_map,
  deadline_list,
  UNIT,
  stock_sort_map,
  stock_color_map,
} from "~/data";
import { get_http_data } from "~/utils";
import _ from "lodash";
import dayjs from "dayjs";

const props = defineProps(["options_list"]);
const stockCodeList = Object.keys(stock_code_map);
const optionType = ["购", "沽"];
const COLOR_LIST = ["#fed35d", "#c6d18a", "#ff956b", "#55a2b7"];
const 正股分布 = ref([]);
const 时间分布 = ref([]);
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
function getSunburstOptions({ title, data }) {
  return {
    title: {
      text: title,
    },
    series: {
      nodeClick: false,
      type: "sunburst",
      data: data,
      radius: [0, "95%"],
      sort: undefined,
      emphasis: {
        focus: "ancestor",
      },
      levels: [
        {},
        {
          r0: "0",
          r: "20%",
          label: {
            rotate: "tangential",
            formatter: (params) => {
              const { data } = params;
              const { value, name, percent } = data;
              return name;
            },
          },
        },
        {
          r0: "20%",
          r: "45%",
          itemStyle: {
            borderWidth: 2,
          },
          label: {
            rotate: "tangential",
            formatter: (params) => {
              const { data } = params;
              const { value, name, percent } = data;
              return `${name}\n${value}\n${percent}`;
            },
          },
        },
        {
          r0: "50%",
          r: "55%",
          label: {
            position: "outside",
            padding: 1,
            silent: false,
            formatter: (params) => {
              const { data } = params;
              const { value, name, percent } = data;
              return `${name} ${value} (${percent})`;
            },
          },
          itemStyle: {
            borderWidth: 3,
          },
        },
      ],
    },
  };
}
const 正股分布Option = computed(() => {
  return getSunburstOptions({
    title: "正股分布",
    data: 正股分布.value,
  });
});
const 时间分布Option = computed(() => {
  return getSunburstOptions({
    title: "时间分布",
    data: 时间分布.value,
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
function sortItemCode(item) {
  return stock_sort_map[item.code];
}
watch(
  () => props.options_list,
  () => {
    if (!props.options_list?.length) return;
    const options_list = props.options_list;
    // optionType.forEach((type) => {
    //   沽购分布.value[type] = options_list.filter((el) =>
    //     el["期权名称"].includes(type)
    //   );
    // });
    const allSum = get_list_all_hold(options_list);
    正股分布.value = [
      {
        name: allSum,
        children: _.sortBy(
          stockCodeList.map((code) => {
            const curSum = get_list_all_hold(
              options_list.filter((el) => el["正股代码"] === code)
            );
            return {
              code,
              itemStyle: {
                color: stock_color_map[code],
              },
              name: stock_code_map[code],
              value: curSum,
              percent: Math.floor((1000 * curSum) / allSum) / 10 + "%",
              children: optionType.map((type) => {
                const curSum = get_list_all_hold(
                  options_list.filter(
                    (el) =>
                      el["正股代码"] === code && el["期权名称"].includes(type)
                  )
                );
                return {
                  type,
                  name: type,
                  value: curSum,
                  percent: Math.floor((1000 * curSum) / allSum) / 10 + "%",
                  itemStyle: {
                    color: type === "购" ? "#f37674" : "#5e9a80",
                  },
                };
              }),
            };
          }),
          sortItemCode
        ),
      },
    ];
    时间分布.value = [
      {
        name: allSum,
        children: _.sortBy(
          deadline_list.map((date, index) => {
            const curSum = get_list_all_hold(
              options_list.filter((el) => el["到期日"].includes(date))
            );
            return {
              name: dayjs(date, "YYYYMMDD").format("M月"),
              value: curSum,
              percent: Math.floor((1000 * curSum) / allSum) / 10 + "%",
              itemStyle: {
                color: COLOR_LIST[index],
              },
              children: _.sortBy(
                stockCodeList.map((code) => {
                  const curSum = get_list_all_hold(
                    options_list.filter(
                      (el) =>
                        el["正股代码"] === code && el["到期日"].includes(date)
                    )
                  );
                  return {
                    code,
                    itemStyle: {
                      color: stock_color_map[code],
                    },
                    name: stock_code_map[code],
                    value: curSum,
                    percent: Math.floor((1000 * curSum) / allSum) / 10 + "%",
                  };
                }),
                sortItemCode
              ),
            };
          })
        ),
      },
    ];
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
  return Math.floor(sum);
}
</script>
