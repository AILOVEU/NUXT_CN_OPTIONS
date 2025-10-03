<template>
  <div>
    时间价值待收益<span class="text-[8px]">(正为收益，负为时间损耗)</span>：{{
      时间价值收益.value
    }}
  </div>
  <div
    v-for="[权利, 义务, 持仓] in 时间价值收益.list"
    class="flex items-center justify-between w-[600px] border-[1px]"
  >
    <div class="w-[200px]">
      <div>{{ 权利["期权名称"] }}</div>
      <div>{{ 义务["期权名称"] }}</div>
    </div>
    <div>*{{ 持仓 }}</div>
    <div class="w-[250px]">
      <div>
        {{ 权利["最新价"].toFixed(3) }}(时间:{{ 权利["时间价值"] }} 内在:{{
          权利["内在价值"]
        }})
      </div>
      <div>
        {{ 义务["最新价"].toFixed(3) }}(时间:{{ 义务["时间价值"] }} 内在:{{
          义务["内在价值"]
        }})
      </div>
    </div>
    <!-- <div>{{ item["期权名称"] }}</div>
    <div>*{{ item["持仓"] }}</div>
    <div>
      {{ item["最新价"] }}(时间:{{ item["时间价值"] }} 内在:{{
        item["内在价值"]
      }})
    </div> -->
  </div>
  <VChart :option="时间价值收益Option" style="height: 700px; width: 100vw" />
  <!-- <div>时间价值损耗：{{ 时间价值损耗.value }}</div>
  <div v-for="item in 时间价值损耗.list" class="grid grid-cols-3 gap-[50px]">
    <div>{{ item["期权名称"] }}</div>
    <div>*{{ item["持仓"] }}</div>
    <div>
      {{ item["最新价"] }}(时间:{{ item["时间价值"] }} 内在:{{
        item["内在价值"]
      }})
    </div>
  </div> -->
  <!-- {{ 剩余List.map((el) => el["期权名称"]) }} -->
</template>

<script setup>
import { UNIT } from "~/data";
const props = defineProps(["all_data", "combo_list"]);
const 时间价值收益 = computed(() => {
  // const 时间价值收益List = props.all_data
  //   .filter((el) => el["持仓"])
  //   .filter((el) => el["持仓"] < 0 || el["内在价值"] > 0);
  let value = 0;
  const list = [];
  props.combo_list.forEach((el) => {
    const [权利Option, 义务Option, 组合持仓] = el;
    const 权利期权Item = props.all_data.find(
      (el) => el["期权名称"] === 权利Option
    );
    const 义务期权Item = props.all_data.find(
      (el) => el["期权名称"] === 义务Option
    );
    if (!权利期权Item["内在价值"]) return;
    // list.push({ ...权利期权Item, 持仓: 组合持仓 });
    // list.push({ ...义务期权Item, 持仓: -组合持仓 });
    list.push([权利期权Item, 义务期权Item, 组合持仓]);
    value += -权利期权Item["时间价值"] * UNIT * 组合持仓;
    value += 义务期权Item["时间价值"] * UNIT * 组合持仓;
    // const 行权价差 = Math.abs(权利期权Item["行权价"] - 义务期权Item['行权价'] )
    // const 最新价差 = Math.abs(权利期权Item["最新价"] - 义务期权Item['最新价'] )
    // value += UNIT * (行权价差 - 最新价差) * 组合持仓
  });
  return { list, value: Math.floor(value) };
});
const 时间价值收益Option = computed(() => {
  let total = 0;
  const seriesData1 = 时间价值收益.value.list?.map((el) => {
    const [权利期权Item, 义务期权Item, 组合持仓] = el;
    const value = Math.floor(
      (-权利期权Item["时间价值"] + 义务期权Item["时间价值"]) * 组合持仓 * UNIT
    );
    total += value;
    return {
      name: 权利期权Item["期权名称"] + "-" + 义务期权Item["期权名称"],
      value,
    };
  });

  return getPieOptions({
    total,
    title: "时间价值收益分布",
    seriesData1,
  });
});
// const 时间价值损耗 = computed(() => {
//   const 时间价值收益List = props.all_data
//     .filter((el) => el["持仓"] > 0)
//     .filter((el) => !el["内在价值"]);
//   let value = 0;
//   时间价值收益List.forEach((el) => {
//     value += el["时间价值"] * UNIT * el["持仓"];
//   });
//   return { list: 时间价值收益List, value: Math.floor(value) };
// });
// const 剩余List = computed(() => {
//   const list = props.all_data
//     .filter((el) => el["持仓"])
//     .filter((el) => {
//       !时间价值收益.value.list.some(
//         (item) => item["期权名称"] === el["期权名称"]
//       );
//     })
//     .filter((el) => {
//       !时间价值损耗.value.list.some(
//         (item) => item["期权名称"] === el["期权名称"]
//       );
//     });
//   return list;
// });
function get时间价值收益() {}

function getPieOptions({ total, title, seriesData1, seriesData2 = [] }) {
  return {
    title: {
      text: title,
      left: "center",
    },
    tooltip: {
      trigger: "item",
    },
    // legend: {
    //   // orient: "vertical",
    //   bottom: "0",
    // },
    series: [
      {
        radius: [0, "30%"],
        smooth: true,
        // radius: '50%',
        // roseType: 'area',
        // padAngle: 2,
        type: "pie",
        data: [{ name: total,value: total }],
        label: {
          position: "inner",
          formatter: "{b}",
        },
      },
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
      // {
      //   radius: ["30%", "40%"],
      //   smooth: true,
      //   label: {
      //     show: false,
      //     //   position: "inner",
      //   },
      //   labelLine: {
      //     show: false,
      //   },
      //   padAngle: 2,
      //   type: "pie",
      //   data: seriesData2,
      //   // label: {
      //   //   formatter: "{b}\n{c}\n({d}%)",
      //   // },
      // },
    ],
  };
}
</script>
