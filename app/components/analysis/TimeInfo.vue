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
            <el-table-column label="总价" prop="总价" sortable/>
            <el-table-column label="涨跌" prop="涨跌" sortable/>
            <el-table-column
              :label="
                props.row._custom
                  ? `待收益占比(${props.row.value})`
                  : `总价占比(${持仓总价})`
              "
              prop="总价占比"
              #default="{ row }"
            >
              <el-progress
                :percentage="row['总价占比']"
                :color="getPercentColor(row['总价占比'])"
              />
            </el-table-column>
          </el-table>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="名" prop="title" />
    <el-table-column label="值" prop="value" #default="props">
      <div class="flex items-center gap-[12px]">
        <div>
          {{ props.row.value }}
        </div>
        <div v-if="!props.row._custom">
          ({{ Math.floor((1000 * props.row.value) / 持仓总价) / 10 }}%)
        </div>
        <DiffTag v-if="!props.row._custom" :涨跌="props.row.涨跌" />
      </div>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { UNIT } from "~/data";
import _ from "lodash";
import DiffTag from "~/components/tag/DiffTag.vue";
const props = defineProps(["all_data", "combo_list"]);
const 组合期权持仓 = computed(() => {
  let 时间收益组合Value = 0;
  let 时间损耗组合Value = 0;
  let 时间收益组合持仓Value = 0;
  let 时间收益组合涨跌 = 0;
  let 时间损耗组合涨跌 = 0;

  const 时间收益组合List = [];
  const 时间损耗组合List = [];
  props.combo_list.forEach((el) => {
    const [权利Option, 义务Option, 组合持仓] = el;
    const 权利期权Item = props.all_data.find(
      (el) => el["期权名称"] === 权利Option
    );
    const 义务期权Item = props.all_data.find(
      (el) => el["期权名称"] === 义务Option
    );
    // 时间收益
    if (
      权利期权Item["内在价值"] &&
      权利期权Item["时间价值"] < 义务期权Item["时间价值"]
    ) {
      时间收益组合List.push([权利期权Item, 义务期权Item, 组合持仓]);
      时间收益组合Value +=
        (义务期权Item["时间价值"] - 权利期权Item["时间价值"]) * UNIT * 组合持仓;
      时间收益组合持仓Value +=
        (权利期权Item["最新价"] - 义务期权Item["最新价"]) * UNIT * 组合持仓;
      时间收益组合涨跌 +=
        (权利期权Item["涨跌额"] - 义务期权Item["涨跌额"]) * UNIT * 组合持仓;
    }
    // 时间损耗
    else {
      时间损耗组合List.push([权利期权Item, 义务期权Item, 组合持仓]);
      时间损耗组合Value +=
        (权利期权Item["最新价"] - 义务期权Item["最新价"]) * UNIT * 组合持仓;
      时间损耗组合涨跌 +=
        (权利期权Item["涨跌额"] - 义务期权Item["涨跌额"]) * UNIT * 组合持仓;
    }
  });
  return {
    时间收益组合List,
    时间收益组合Value: Math.floor(时间收益组合Value),
    时间收益组合涨跌: Math.floor(时间收益组合涨跌),
    时间损耗组合List,
    时间损耗组合Value: Math.floor(时间损耗组合Value),
    时间损耗组合涨跌: Math.floor(时间损耗组合涨跌),
    时间收益组合持仓Value: Math.floor(时间收益组合持仓Value),
  };
});

const 单腿期权持仓 = computed(() => {
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
  let 涨跌 = 0;
  持仓List = 持仓List.filter((el) => el["持仓"]);
  持仓List = _.sortBy(持仓List, ["正股代码", "到期日", "行权价"]);
  let value = 0;
  持仓List.forEach((el) => {
    value += el["最新价"] * UNIT * el["持仓"];
    涨跌 += el["涨跌额"] * UNIT * el["持仓"];
  });
  return { list: 持仓List, value: Math.floor(value), 涨跌: Math.floor(涨跌) };
});
const 持仓总价 = computed(() => {
  return (
    组合期权持仓.value.时间收益组合持仓Value +
      组合期权持仓.value.时间损耗组合Value +
      单腿期权持仓.value.value || 1
  );
});
const richTableData = computed(() => {
  return [
    {
      _custom: true,
      title: "组合时间价值待收益",
      value: 组合期权持仓.value.时间收益组合Value,
      children: 组合期权持仓.value.时间收益组合List.map(
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
            总价占比:
              Math.floor((1000 * 总价) / 组合期权持仓.value.时间收益组合Value) /
              10,
          };
        }
      ),
    },
    {
      title: "组合占用资金(无时间损耗)",
      value: 组合期权持仓.value.时间收益组合持仓Value,
      涨跌: 组合期权持仓.value.时间收益组合涨跌,
      children: 组合期权持仓.value.时间收益组合List.map(
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
            涨跌: Math.floor(
              (权利期权Item["涨跌额"] - 义务期权Item["涨跌额"]) *
                组合持仓 *
                UNIT
            ),
            总价占比: Math.floor((1000 * 总价) / 持仓总价.value) / 10,
          };
        }
      ),
    },
    {
      title: "组合期权持仓(占用时间价值)",
      value: 组合期权持仓.value.时间损耗组合Value,
      涨跌: 组合期权持仓.value.时间损耗组合涨跌,
      children: 组合期权持仓.value.时间损耗组合List.map(
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
            涨跌: Math.floor(
              (权利期权Item["涨跌额"] - 义务期权Item["涨跌额"]) *
                组合持仓 *
                UNIT
            ),
            总价占比: Math.floor((1000 * 总价) / 持仓总价.value) / 10,
          };
        }
      ),
    },
    {
      title: "单腿期权(占用时间价值)",
      value: 单腿期权持仓.value.value,
      涨跌: 单腿期权持仓.value.涨跌,
      children: 单腿期权持仓.value.list.map(
        ({ 期权名称, 最新价, 涨跌额, 持仓, 内在价值, 时间价值 }) => {
          const 总价 = Math.floor(最新价 * UNIT * 持仓);
          return {
            名称: 期权名称,
            持仓: 持仓,
            最新价,
            实值: 内在价值,
            时间: 时间价值,
            涨跌: Math.floor(涨跌额 * 持仓 * UNIT),
            总价,
            总价占比: Math.floor((1000 * 总价) / 持仓总价.value) / 10,
          };
        }
      ),
    },
  ];
});
function getPercentColor(val) {
  if (val > 50) return "#f56c6c";
  if (val > 25) return "#e6a23c";
  if (val > 5) return "#409eff";
  return "#909399";
}
</script>
<style>
.el-table .highlight-line {
  background-color: #fdf6ec;
}
</style>
