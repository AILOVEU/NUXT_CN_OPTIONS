<template>
  <el-table
    :data="richTableData"
    :border="false"
    preserve-expanded-content
    default-expand-all
    style="width: 100%"
    :show-header="false"
    :row-class-name="() => 'highlight-line'"
  >
    <el-table-column type="expand">
      <template #expand> </template>
      <template #default="props">
        <div>
          <el-table :data="props.row.children" :border="false">
            <el-table-column
              label="名称"
              prop="名称"
              #default="{ row }"
              width="180"
            >
              <template v-if="Array.isArray(row['名称'])">
                <div>{{ row["名称"][0] }}</div>
                <div>{{ row["名称"][1] }}</div>
              </template>
              <template v-else>
                {{ row["名称"] }}
              </template>
            </el-table-column>
            <el-table-column label="持仓" prop="持仓" />
            <el-table-column label="最新价" #default="{ row }" prop="最新价">
              <template v-if="Array.isArray(row['最新价'])">
                <div>{{ row["最新价"][0] }}</div>
                <div>{{ row["最新价"][1] }}</div>
              </template>
              <template v-else>
                {{ row["最新价"] }}
              </template>
            </el-table-column>
            <el-table-column label="时间" #default="{ row }" prop="时间">
              <template v-if="Array.isArray(row['时间'])">
                <div>{{ row["时间"][0] }}</div>
                <div>{{ row["时间"][1] }}</div>
              </template>
              <template v-else>
                {{ row["时间"] }}
              </template>
            </el-table-column>
            <el-table-column label="实值" #default="{ row }" prop="实值">
              <template v-if="Array.isArray(row['实值'])">
                <div>{{ row["实值"][0] }}</div>
                <div>{{ row["实值"][1] }}</div>
              </template>
              <template v-else>
                {{ row["实值"] }}
              </template>
            </el-table-column>
            <el-table-column label="总价" prop="总价" />
            <el-table-column label="占比" prop="占比" #default="{ row }">
              <el-progress
                :percentage="row['占比']"
                :status="getPercentType(row['占比'])"
                :format="(percentage) => `${percentage}%`"
              />
            </el-table-column>
          </el-table>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="名" prop="title" />
    <el-table-column label="值" prop="value" />
  </el-table>
  <!-- <div class="overflow-x-auto">
    <div>
      时间价值待收益<span class="text-[8px]">(正为收益，负为时间损耗)</span>：{{
        组合时间价值.待收益Value
      }}
    </div>
    <div>占用资金(无时间损耗)：{{ 组合时间价值.实值Value }}</div>
    <div
      v-for="[权利, 义务, 持仓] in 组合时间价值.待收益组合List"
      class="flex items-center justify-between w-[600px] border-[1px] mt-[20px]"
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
    </div>
    <div class="mt-[20px]">
      组合期权(占用时间价值)：{{ 组合时间价值.otherValue }}
    </div>
    <div
      v-for="[权利, 义务, 持仓] in 组合时间价值.otherList"
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
    </div>
    <div class="mt-[20px]">单腿期权(占用时间价值)：{{ 非组合持仓.value }}</div>
    <div
      v-for="{ 期权名称, 持仓, 最新价, 时间价值, 内在价值 } in 非组合持仓.list"
      class="flex items-center justify-between w-[600px] border-[1px]"
    >
      <div class="w-[200px]">
        <div>{{ 期权名称 }}</div>
      </div>
      <div>*{{ 持仓 }}</div>
      <div class="w-[250px]">
        <div>
          {{ 最新价.toFixed(3) }}(时间:{{ 时间价值 }} 内在:{{ 内在价值 }})
        </div>
      </div>
    </div>
  </div> -->
  <VChart :option="组合时间价值Option" style="height: 700px; width: 100%" />
</template>

<script setup>
import { UNIT } from "~/data";
import _ from "lodash";
const props = defineProps(["all_data", "combo_list"]);
const 组合时间价值 = computed(() => {
  let 待收益Value = 0;
  let otherValue = 0;
  let 实值Value = 0;
  const 待收益组合List = [];
  const otherList = [];
  props.combo_list.forEach((el) => {
    const [权利Option, 义务Option, 组合持仓] = el;
    const 权利期权Item = props.all_data.find(
      (el) => el["期权名称"] === 权利Option
    );
    const 义务期权Item = props.all_data.find(
      (el) => el["期权名称"] === 义务Option
    );
    if (
      权利期权Item["内在价值"] &&
      权利期权Item["时间价值"] < 义务期权Item["时间价值"]
    ) {
      待收益组合List.push([权利期权Item, 义务期权Item, 组合持仓]);
      待收益Value += -权利期权Item["时间价值"] * UNIT * 组合持仓;
      待收益Value += 义务期权Item["时间价值"] * UNIT * 组合持仓;
      实值Value += 权利期权Item["最新价"] * UNIT * 组合持仓;
      实值Value -= 义务期权Item["最新价"] * UNIT * 组合持仓;
    } else {
      otherList.push([权利期权Item, 义务期权Item, 组合持仓]);
      otherValue += 权利期权Item["最新价"] * UNIT * 组合持仓;
      otherValue -= 义务期权Item["最新价"] * UNIT * 组合持仓;
    }
  });
  return {
    待收益组合List,
    待收益Value: Math.floor(待收益Value),
    otherList,
    otherValue: Math.floor(otherValue),
    实值Value: Math.floor(实值Value),
  };
});

const 非组合持仓 = computed(() => {
  let 持仓List = props.all_data
    ?.filter((el) => el["持仓"])
    .map((el) => ({ ...el }));
  props.combo_list.forEach(([权利Option, 义务Option, 组合持仓]) => {
    for (let i = 0; i < 持仓List.length; i++) {
      if (持仓List[i]["期权名称"] === 权利Option) {
        持仓List[i]["持仓"] -= 组合持仓;
      }
      if (持仓List[i]["期权名称"] === 义务Option) {
        持仓List[i]["持仓"] += 组合持仓;
      }
    }
  });
  持仓List = 持仓List.filter((el) => el["持仓"]);
  持仓List = _.sortBy(持仓List, ["正股代码", "到期日", "行权价"]);
  let value = 0;
  持仓List.forEach((el) => {
    value += el["最新价"] * UNIT * el["持仓"];
  });
  return { list: 持仓List, value: Math.floor(value) };
});

const 组合时间价值Option = computed(() => {
  let total = 0;
  const seriesData1 = 组合时间价值.value.list?.map((el) => {
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
    title: "组合时间价值分布",
    seriesData1,
  });
});
function getPieOptions({ total, title, seriesData1, seriesData2 = [] }) {
  return {
    backgroundColor: "#fefefe",
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
        data: [{ name: total, value: total }],
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

const richTableData = computed(() => {
  return [
    {
      isCombo: true,
      title: "时间价值待收益",
      value: 组合时间价值.value.待收益Value,
      children: 组合时间价值.value.待收益组合List.map(
        ([权利期权Item, 义务期权Item, 组合持仓]) => {
          const 总价 = Math.floor(
            (义务期权Item["时间价值"] - 权利期权Item["时间价值"]) *
              组合持仓 *
              UNIT
          );
          return {
            名称: [权利期权Item["期权名称"], 义务期权Item["期权名称"]],
            持仓: 组合持仓,
            最新价: [权利期权Item["最新价"], 义务期权Item["最新价"]],
            实值: [权利期权Item["内在价值"], 义务期权Item["内在价值"]],
            时间: [权利期权Item["时间价值"], 义务期权Item["时间价值"]],
            总价,
            占比:
              Math.floor((1000 * 总价) / 组合时间价值.value.待收益Value) / 10,
          };
        }
      ),
    },
    {
      isCombo: true,
      title: "占用资金(无时间损耗)",
      value: 组合时间价值.value.实值Value,
      children: 组合时间价值.value.待收益组合List.map(
        ([权利期权Item, 义务期权Item, 组合持仓]) => {
          const 总价 = Math.floor(
            (权利期权Item["最新价"] - 义务期权Item["最新价"]) * 组合持仓 * UNIT
          );
          return {
            名称: [权利期权Item["期权名称"], 义务期权Item["期权名称"]],
            持仓: 组合持仓,
            最新价: [权利期权Item["最新价"], 义务期权Item["最新价"]],
            实值: [权利期权Item["内在价值"], 义务期权Item["内在价值"]],
            时间: [权利期权Item["时间价值"], 义务期权Item["时间价值"]],
            总价,
            占比: Math.floor((1000 * 总价) / 组合时间价值.value.实值Value) / 10,
          };
        }
      ),
    },
    {
      isCombo: true,
      title: "组合期权(占用时间价值)",
      value: 组合时间价值.value.otherValue,
      children: 组合时间价值.value.otherList.map(
        ([权利期权Item, 义务期权Item, 组合持仓]) => {
          const 总价 = Math.floor(
            (权利期权Item["最新价"] - 义务期权Item["最新价"]) * 组合持仓 * UNIT
          );
          return {
            名称: [权利期权Item["期权名称"], 义务期权Item["期权名称"]],
            持仓: 组合持仓,
            最新价: [权利期权Item["最新价"], 义务期权Item["最新价"]],
            实值: [权利期权Item["内在价值"], 义务期权Item["内在价值"]],
            时间: [权利期权Item["时间价值"], 义务期权Item["时间价值"]],
            总价,
            占比:
              Math.floor((1000 * 总价) / 组合时间价值.value.otherValue) / 10,
          };
        }
      ),
    },
    {
      isCombo: false,
      title: "单腿期权(占用时间价值)",
      value: 非组合持仓.value.value,
      children: 非组合持仓.value.list.map(
        ({ 期权名称, 最新价, 持仓, 内在价值, 时间价值 }) => {
          const 总价 = Math.floor(最新价 * UNIT * 持仓);
          return {
            名称: 期权名称,
            持仓: 持仓,
            最新价,
            实值: 内在价值,
            时间: 时间价值,
            总价,
            占比: Math.floor((1000 * 总价) / 非组合持仓.value.value) / 10,
          };
        }
      ),
    },
  ];
});
function getPercentType(val) {
  if (val > 25) return "warning";
  if (val > 50) return "exception";
  return undefined;
}
</script>
<style>
.el-table .highlight-line {
  background-color: #fdf6ec;
}
</style>
