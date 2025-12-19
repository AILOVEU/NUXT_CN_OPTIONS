<template>
  <div class="overflow-auto">
    <div class="min-w-[1000px]">
      <VChart :option="持仓分布Option" style="height: 900px; width: 100%" />
      <VChart :option="盈利分布Option" style="height: 450px; width: 100%" />
      <VChart :option="亏损分布Option" style="height: 450px; width: 100%" />
    </div>
  </div>

  <div>
    <el-form :model="formData" label-width="auto" style="max-width: 600px" label-suffix=":">
      <el-form-item label="正股">
        <el-select v-model="formData.正股List" multiple clearable>
          <el-option v-for="item in stockOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="到期日">
        <el-select v-model="formData.到期日List" multiple clearable>
          <el-option v-for="date in deadline_list" :key="date" :label="date" :value="date" />
        </el-select>
      </el-form-item>
      <el-form-item label="沽购">
        <el-select v-model="formData.沽购List" multiple clearable>
          <el-option v-for="call in ['沽', '购']" :key="call" :label="call" :value="call" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
  <el-table :data="richTableData" :border="false" preserve-expanded-content default-expand-all style="width: 100%" :show-header="false" :row-class-name="() => 'highlight-line'">
    <el-table-column type="expand">
      <template #expand> </template>
      <template #default="props">
        <div>
          <el-table :data="filterTableData(props.row.children)" :border="false">
            <el-table-column label="序" minWidth="40" align="center" fixed="left">
              <template #default="{ $index }">
                <div class="text-[10px]">{{ $index + 1 }}</div>
              </template>
            </el-table-column>
            <el-table-column label="期权名称" prop="期权名称" #default="{ row }" minWidth="200" sortable fixed="left">
              <CombinTableCell :value="row['期权名称']" :showDiff="false" />
            </el-table-column>
            <el-table-column label="信息" align="center">
              <el-table-column label="正股" #default="{ row }" prop="正股代码" minWidth="140" sortable>
                {{ stock_show_name_map[row["正股代码"]] }}
              </el-table-column>
              <el-table-column label="沽购" #default="{ row }" prop="沽购" minWidth="80" sortable>
                <CallPutTag :沽购="row['沽购']" />
              </el-table-column>
              <el-table-column label="到期天数" prop="到期天数" minWidth="120" sortable />
            </el-table-column>
            <el-table-column label="持仓" prop="持仓" minWidth="80" sortable />
            <el-table-column label="盈亏" align="center">
              <el-table-column label="一手价" minWidth="120" #default="{ row }" prop="一手价" sortable>
                <CombinTableCell :value="row['一手价']" :showDiff="true" />
              </el-table-column>

              <el-table-column label="一手成本价" minWidth="120" #default="{ row }" prop="一手成本价" sortable>
                <CombinTableCell :value="row['一手成本价']" :showDiff="true" />
              </el-table-column>
              <el-table-column label="一手盈亏" prop="一手盈亏" minWidth="120" sortable />

              <el-table-column label="总盈亏" prop="总盈亏" minWidth="120" sortable />
            </el-table-column>

            <el-table-column label="价格构成" align="center">
              <el-table-column label="时间" #default="{ row }" minWidth="140" prop="一手时间价" sortable>
                <CombinTableCell :value="row['一手时间价']" :showDiff="false" />
              </el-table-column>
              <el-table-column label="实值" #default="{ row }" minWidth="140" prop="一手内在价" sortable>
                <CombinTableCell :value="row['一手内在价']" :showDiff="false" />
              </el-table-column>
            </el-table-column>

            <el-table-column label="今日盈亏" align="center">
              <el-table-column label="今日总涨跌" prop="今日总涨跌" minWidth="120" sortable />
              <el-table-column label="今日单手涨跌" prop="今日单手涨跌" minWidth="140" sortable />
            </el-table-column>

            <el-table-column label="参数" align="center">
              <el-table-column label="Gamma" #default="{ row }" prop="Gamma" width="120" sortable>
                <CombinTableCell :value="row['Gamma']" :showDiff="true" />
              </el-table-column>
              <el-table-column label="Delta" #default="{ row }" prop="Delta" width="120" sortable>
                <CombinTableCell :value="row['Delta']" :showDiff="true" />
              </el-table-column>
            </el-table-column>

            <el-table-column label="仓位" align="center">
              <el-table-column label="总价" prop="总价" minWidth="120" sortable />
              <el-table-column sortable :label="props.row._custom ? `待收益占比(${props.row.value})` : `总价占比(${持仓总价})`" prop="总价占比" #default="{ row }" width="200">
                <el-progress :percentage="row['总价占比']" :color="getPercentColor(row['总价占比'])" />
              </el-table-column>
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
        <div v-if="!props.row._custom">({{ formatDecimal((100 * props.row.value) / 持仓总价, 1) }}%)</div>
        <DiffTag v-if="!props.row._custom" :涨跌="props.row.涨跌" />
      </div>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { deadline_list, stock_code_map, deadline_color_list, stock_color_map, stock_sorted_list, stock_show_name_map } from "~/data";
import { formatDecimal } from "~/utils/utils";
import _ from "lodash";
import dayjs from "dayjs";
import DiffTag from "~/components/tag/DiffTag.vue";
import CallPutTag from "~/components/tag/CallPutTag.vue";
const stockOptions = stock_sorted_list.map((el) => ({
  label: stock_code_map[el],
  value: el,
}));
const formData = reactive({
  正股List: [...stock_sorted_list],
  到期日List: [...deadline_list],
  沽购List: ["沽", "购"],
});
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
    const [权利Name, 义务Name, 组合持仓] = el;
    const 权利期权Item = props.all_data.find((el) => el["期权名称"] === 权利Name);
    const 义务期权Item = props.all_data.find((el) => el["期权名称"] === 义务Name);
    // 时间收益
    if (权利期权Item["内在价值"] && 权利期权Item["一手时间价"] < 义务期权Item["一手时间价"]) {
      时间收益组合List.push([权利期权Item, 义务期权Item, 组合持仓]);
      时间收益组合Value += (义务期权Item["一手时间价"] - 权利期权Item["一手时间价"]) * 组合持仓;
      时间收益组合持仓Value += (权利期权Item["一手价"] - 义务期权Item["一手价"]) * 组合持仓;
      时间收益组合涨跌 += (权利期权Item["一手涨跌价"] - 义务期权Item["一手涨跌价"]) * 组合持仓;
    }
    // 时间损耗
    else {
      时间损耗组合List.push([权利期权Item, 义务期权Item, 组合持仓]);
      时间损耗组合Value += (权利期权Item["一手价"] - 义务期权Item["一手价"]) * 组合持仓;
      时间损耗组合涨跌 += (权利期权Item["一手涨跌价"] - 义务期权Item["一手涨跌价"]) * 组合持仓;
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
  let 持仓List = props.all_data?.filter((el) => el["持仓"]).map((el) => ({ ...el }));
  props.combo_list.forEach(([权利Name, 义务Name, 组合持仓]) => {
    for (let i = 0; i < 持仓List.length; i++) {
      if (持仓List[i]["期权名称"] === 权利Name) {
        持仓List[i]["持仓"] -= 组合持仓;
      }
      if (持仓List[i]["期权名称"] === 义务Name) {
        持仓List[i]["持仓"] += 组合持仓;
      }
    }
  });
  let 涨跌 = 0;
  持仓List = 持仓List.filter((el) => el["持仓"]);
  持仓List = _.sortBy(持仓List, ["正股代码", "到期日", "行权价"]);
  let value = 0;
  持仓List.forEach((el) => {
    value += el["一手价"] * el["持仓"];
    涨跌 += el["一手涨跌价"] * el["持仓"];
  });
  return { list: 持仓List, value: Math.floor(value), 涨跌: Math.floor(涨跌) };
});

const 持仓总价 = computed(() => {
  return 组合期权持仓.value.时间收益组合持仓Value + 组合期权持仓.value.时间损耗组合Value + 单腿期权持仓.value.value || 1;
});

const richTableData = computed(() => {
  return [
    // 组合待收益
    {
      _custom: true,
      title: "组合时间价值待收益",
      value: 组合期权持仓.value.时间收益组合Value,
      children: 组合期权持仓.value.时间收益组合List.map(([权利期权Item, 义务期权Item, 组合持仓]) => {
        const 总价 = (义务期权Item["一手时间价"] - 权利期权Item["一手时间价"]) * 组合持仓;
        return {
          期权名称: [权利期权Item["期权名称"], 义务期权Item["期权名称"]],
          持仓: 组合持仓,

          到期日: 权利期权Item["到期日"],
          到期天数: 权利期权Item["到期天数"],
          正股代码: 权利期权Item["正股代码"],
          沽购: 权利期权Item["沽购"],

          一手价: [权利期权Item["一手价"], 义务期权Item["一手价"]],
          一手成本价: [权利期权Item["一手成本价"], 义务期权Item["一手成本价"]],
          一手内在价: [权利期权Item["一手内在价"], 义务期权Item["一手内在价"]],
          一手时间价: [权利期权Item["一手时间价"], 义务期权Item["一手时间价"]],

          总价,
          总价占比: formatDecimal((100 * 总价) / 组合期权持仓.value.时间收益组合Value, 1),
        };
      }),
    },
    // 组合实值
    {
      title: "组合占用资金(无时间损耗)",
      value: 组合期权持仓.value.时间收益组合持仓Value,
      涨跌: 组合期权持仓.value.时间收益组合涨跌,
      children: 组合期权持仓.value.时间收益组合List.map(([权利期权Item, 义务期权Item, 组合持仓]) => {
        const 总价 = (权利期权Item["一手价"] - 义务期权Item["一手价"]) * 组合持仓;
        const 一手盈亏 = 权利期权Item["一手价"] - 权利期权Item["一手成本价"] - (义务期权Item["一手价"] - 义务期权Item["一手成本价"]);
        const 总盈亏 = 一手盈亏 * 组合持仓;
        const 今日单手涨跌 = 权利期权Item["一手涨跌价"] - 义务期权Item["一手涨跌价"];
        return {
          isCombo: true,
          Gamma: [权利期权Item["Gamma"], 义务期权Item["Gamma"]],
          Delta: [权利期权Item["Delta"], 义务期权Item["Delta"]],
          正股代码: 权利期权Item["正股代码"],
          沽购: 权利期权Item["沽购"],
          到期日: 权利期权Item["到期日"],
          到期天数: 权利期权Item["到期天数"],

          期权名称: [权利期权Item["期权名称"], 义务期权Item["期权名称"]],
          持仓: 组合持仓,

          一手价: [权利期权Item["一手价"], 义务期权Item["一手价"]],
          一手成本价: [权利期权Item["一手成本价"], 义务期权Item["一手成本价"]],
          一手内在价: [权利期权Item["一手内在价"], 义务期权Item["一手内在价"]],
          一手时间价: [权利期权Item["一手时间价"], 义务期权Item["一手时间价"]],

          今日总涨跌: 今日单手涨跌 * 组合持仓,
          今日单手涨跌,

          总价,
          总价占比: formatDecimal((100 * 总价) / 持仓总价.value, 1),
          总盈亏,
          一手盈亏,
        };
      }),
    },
    // 组合虚值
    {
      title: "组合期权持仓(占用时间价值)",
      value: 组合期权持仓.value.时间损耗组合Value,
      涨跌: 组合期权持仓.value.时间损耗组合涨跌,
      children: 组合期权持仓.value.时间损耗组合List.map(([权利期权Item, 义务期权Item, 组合持仓]) => {
        const 总价 = (权利期权Item["一手价"] - 义务期权Item["一手价"]) * 组合持仓;
        const 一手盈亏 = 权利期权Item["一手价"] - 权利期权Item["一手成本价"] - (义务期权Item["一手价"] - 义务期权Item["一手成本价"]);
        const 总盈亏 = 一手盈亏 * 组合持仓;
        const 今日单手涨跌 = 权利期权Item["一手涨跌价"] - 义务期权Item["一手涨跌价"];
        return {
          isCombo: true,
          期权名称: [权利期权Item["期权名称"], 义务期权Item["期权名称"]],
          持仓: 组合持仓,
          正股代码: 权利期权Item["正股代码"],
          沽购: 权利期权Item["沽购"],
          到期日: 权利期权Item["到期日"],
          到期天数: 权利期权Item["到期天数"],
          Gamma: [权利期权Item["Gamma"], 义务期权Item["Gamma"]],
          Delta: [权利期权Item["Delta"], 义务期权Item["Delta"]],

          一手价: [权利期权Item["一手价"], 义务期权Item["一手价"]],
          一手成本价: [权利期权Item["一手成本价"], 义务期权Item["一手成本价"]],
          一手内在价: [权利期权Item["一手内在价"], 义务期权Item["一手内在价"]],
          一手时间价: [权利期权Item["一手时间价"], 义务期权Item["一手时间价"]],

          今日总涨跌: 今日单手涨跌 * 组合持仓,
          今日单手涨跌,

          总盈亏,
          一手盈亏,
          总价,
          总价占比: formatDecimal((100 * 总价) / 持仓总价.value, 1),
        };
      }),
    },
    // 单腿
    {
      showChart: true,
      title: "单腿期权(占用时间价值)",
      value: 单腿期权持仓.value.value,
      涨跌: 单腿期权持仓.value.涨跌,
      children: 单腿期权持仓.value.list.map((期权) => {
        const 持仓 = 期权["持仓"];
        const 总价 = 期权["一手价"] * 持仓;
        const 一手盈亏 = 期权["一手价"] - 期权["一手成本价"];
        const 总盈亏 = 一手盈亏 * 持仓;
        return {
          期权名称: 期权["期权名称"],
          持仓,
          一手价: 期权["一手价"],
          一手成本价: 期权["一手成本价"],
          一手内在价: 期权["一手内在价"],
          一手时间价: 期权["一手时间价"],
          到期天数: 期权["到期天数"],
          Gamma: 期权["Gamma"],
          Delta: 期权["Delta"],

          今日总涨跌: 期权["一手涨跌价"] * 持仓,
          今日单手涨跌: 期权["一手涨跌价"],
          总价,
          一手盈亏,
          总盈亏,
          总价占比: formatDecimal((100 * 总价) / 持仓总价.value, 1),
          正股代码: 期权["正股代码"],
          沽购: 期权["沽购"],
          到期日: 期权["到期日"],
        };
      }),
    },
  ];
});

function getPercentColor(val) {
  if (val > 50) return "#f56c6c";
  if (val > 25) return "#e6a23c";
  if (val > 5) return "#409eff";
  return "#909399";
}

function filterTableData(tableData) {
  return tableData
    .filter((el) => formData.正股List.includes(el["正股代码"]))
    .filter((el) => formData.到期日List.includes(el["到期日"]))
    .filter((el) => formData.沽购List.includes(el["沽购"]));
}

function getSankeyLegenColorMap({ 总和标识 }) {
  let 总和Color = "black";
  if (总和标识 === "盈") 总和Color = "#e9291a";
  if (总和标识 === "亏") 总和Color = "#2f972f";

  const colorMap = {
    沽: "green",
    购: "red",
    "沽 ": "green",
    "购 ": "red",
    [总和标识]: 总和Color,
  };
  deadline_list.forEach((el, index) => {
    colorMap[dayjs(el, "YYYYMMDD").format("M月")] = deadline_color_list[index];
  });
  Object.keys(stock_color_map).forEach((stock_code) => {
    const key = stock_code_map[stock_code];
    const color = stock_color_map[stock_code];
    colorMap[key] = color;
    colorMap[key + "[组合]"] = color;
  });
  return colorMap;
}

function getSortedLegenList({ sourceToTargetList, 总和标识 }) {
  let dataList = [];
  sourceToTargetList.forEach((el) => {
    dataList.push(el.source);
    dataList.push(el.target);
  });
  dataList = [...Array.from(new Set(dataList)), 总和标识];
  const dataListSort = [
    ..._.flattenDeep(stock_sorted_list.map((code) => [stock_code_map[code], stock_code_map[code] + "[组合]"])),
    "购",
    "购 ",
    "沽",
    "沽 ",
    ...deadline_list.map((el) => dayjs(el, "YYYYMMDD").format("M月")),
    总和标识,
  ];
  dataList = dataListSort.filter((el) => dataList.includes(el));
  return dataList;
}
function getSankeyOption({ 沽购to正股, sourceToTargetList, sumValue, title, 总和标识 = "持" }) {
  const 单腿期权TableData = [...richTableData.value?.[1]?.children, ...richTableData.value?.[2]?.children, ...richTableData.value?.[3]?.children];
  let totalData = [
    {
      source: "沽 ",
      target: 总和标识,
      value: 0,
    },
    {
      source: "购 ",
      target: 总和标识,
      value: 0,
    },
  ];
  沽购to正股.forEach((el) => {
    const idx = totalData.findIndex((item) => item.source === el.source + " ");
    totalData[idx].value += el.value;
  });
  totalData = totalData.filter((el) => el.value);
  let dataList = getSortedLegenList({ sourceToTargetList, 总和标识 });
  const colorMap = getSankeyLegenColorMap({ 总和标识 });
  const 亏损符号 = 总和标识 === "亏" ? -1 : 1;
  return {
    title: {
      text: title,
    },
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove|click",
      formatter: (params) => {
        const { dataType, data, value } = params;
        if (dataType === "node") {
          let list = [];
          let str = "";
          let type = data.name.replace(" ", "");
          let 展示字段 = 总和标识 === "持" ? "总价" : "今日总涨跌";
          if (["沽", "购"].some((type) => data.name.includes(type))) {
            list = 单腿期权TableData.filter((el) => el["沽购"] === type);
          }
          if (data.name.includes("月")) {
            list = 单腿期权TableData.filter((el) => dayjs(el["到期日"], "YYYYMMDD").format("M月") === data.name);
          }
          if (总和标识 === "盈") list = list.filter((el) => el[展示字段] > 0);
          if (总和标识 === "亏") list = list.filter((el) => el[展示字段] < 0);
          list = _.sortBy(list, (el) => -el[展示字段]);
          str += list.map((el) => `<div style="display:flex;justify-content: space-between;column-gap: 10px;height: 20px;"><div>${el[展示字段]}</div><div>${el["期权名称"]}</div></div>`).join("");
          if (str) str += "<br /><br />";
          return `${str}${data.name}<br />${亏损符号 * value}`;
        }
        if (dataType === "edge") return `${data.source} > ${data.target}<br />${亏损符号 * value}`;
      },
    },
    animation: false,
    series: [
      {
        type: "sankey",
        bottom: "10%",
        draggable: false,
        layoutIterations: 0,
        emphasis: {
          focus: "adjacency",
        },
        data: dataList.map((el) => {
          return colorMap[el] ? { name: el, itemStyle: { color: colorMap[el] } } : { name: el };
        }),
        label: {
          show: true,
          rich: {
            a: {
              height: 20,
              color: "black",
            },
            b: {
              color: "#89a8c5",
            },
            c: {
              color: "#89a8c5",
            },
          },
          formatter: function (params) {
            const { value, data } = params;
            return `{a|${data.name}}  {b|${亏损符号 * value}} {c|(${formatDecimal((100 * value) / sumValue, 1)}%)}`;
          },
        },
        links: [...sourceToTargetList, ...totalData],
        lineStyle: {
          color: "source",
          curveness: 0.5,
        },
      },
    ],
  };
}

const 持仓分布Option = computed(() => {
  const 单腿期权TableData = [...richTableData.value?.[1]?.children, ...richTableData.value?.[2]?.children, ...richTableData.value?.[3]?.children];
  let 沽购to正股Map = {};
  ["沽", "购"].forEach((type) => {
    Object.keys(stock_code_map).forEach((stock_code) => {
      单腿期权TableData.forEach((el) => {
        if (el["正股代码"] === stock_code && el["沽购"] === type) {
          const 组合Str = el["isCombo"] ? "[组合]" : "";
          const key = 组合Str + stock_code + type;
          沽购to正股Map[key] = {
            // list: [...(沽购to正股Map[key]?.list || []),el],
            source: type,
            target: stock_code_map[stock_code] + 组合Str,
            stock_code,
            value: (沽购to正股Map[key]?.value || 0) + (el?.总价 || 0),
          };
        }
      });
    });
  });
  let 到日期to沽购Map = {};
  deadline_list.forEach((date) => {
    ["沽", "购"].forEach((type) => {
      单腿期权TableData.forEach((el) => {
        if (el["沽购"] === type && el["到期日"] === date) {
          const key = date + type;
          到日期to沽购Map[key] = {
            source: dayjs(date, "YYYYMMDD").format("M月"),
            target: type + " ",
            value: (到日期to沽购Map[key]?.value || 0) + (el?.总价 || 0),
          };
        }
      });
    });
  });
  let 正股to到日期Map = {};
  deadline_list.forEach((date) => {
    Object.keys(stock_code_map).forEach((stock_code) => {
      单腿期权TableData.forEach((el) => {
        if (el["正股代码"] === stock_code && el["到期日"] === date) {
          const 组合Str = el["isCombo"] ? "[组合]" : "";
          const key = 组合Str + stock_code + date;
          正股to到日期Map[key] = {
            stock_code,
            source: stock_code_map[stock_code] + 组合Str,
            target: dayjs(date, "YYYYMMDD").format("M月"),
            value: (正股to到日期Map[key]?.value || 0) + (el?.总价 || 0),
          };
        }
      });
    });
  });
  let 正股to到日期 = Object.values(正股to到日期Map).filter((el) => el.value);
  let 到日期to沽购 = Object.values(到日期to沽购Map).filter((el) => el.value);
  let 沽购to正股 = Object.values(沽购to正股Map).filter((el) => el.value);
  const sourceToTargetList = [...沽购to正股, ...正股to到日期, ...到日期to沽购];

  return getSankeyOption({
    沽购to正股,
    sourceToTargetList,
    sumValue: 持仓总价.value,
    title: "持仓分布",
    总和标识: "持",
  });
});

const 盈利分布Option = computed(() => {
  const 单腿期权TableData = [...richTableData.value?.[1]?.children, ...richTableData.value?.[2]?.children, ...richTableData.value?.[3]?.children];
  let 沽购to正股Map = {};
  ["沽", "购"].forEach((type) => {
    Object.keys(stock_code_map).forEach((stock_code) => {
      单腿期权TableData.forEach((el) => {
        if (el["正股代码"] === stock_code && el["沽购"] === type && el?.今日总涨跌 > 0) {
          const 组合Str = el["isCombo"] ? "[组合]" : "";
          const key = 组合Str + stock_code + type;
          沽购to正股Map[key] = {
            source: type,
            target: stock_code_map[stock_code] + 组合Str,
            stock_code,
            value: (沽购to正股Map[key]?.value || 0) + (el?.今日总涨跌 || 0),
          };
        }
      });
    });
  });
  let 到日期to沽购Map = {};
  deadline_list.forEach((date) => {
    ["沽", "购"].forEach((type) => {
      单腿期权TableData.forEach((el) => {
        if (el["沽购"] === type && el["到期日"] === date && el?.今日总涨跌 > 0) {
          const key = date + type;
          到日期to沽购Map[key] = {
            source: dayjs(date, "YYYYMMDD").format("M月"),
            target: type + " ",
            value: (到日期to沽购Map[key]?.value || 0) + (el?.今日总涨跌 || 0),
          };
        }
      });
    });
  });
  let 正股to到日期Map = {};
  deadline_list.forEach((date) => {
    Object.keys(stock_code_map).forEach((stock_code) => {
      单腿期权TableData.forEach((el) => {
        if (el["正股代码"] === stock_code && el["到期日"] === date && el?.今日总涨跌 > 0) {
          const 组合Str = el["isCombo"] ? "[组合]" : "";
          const key = 组合Str + stock_code + date;
          正股to到日期Map[key] = {
            stock_code,
            source: stock_code_map[stock_code] + 组合Str,
            target: dayjs(date, "YYYYMMDD").format("M月"),
            value: (正股to到日期Map[key]?.value || 0) + (el?.今日总涨跌 || 0),
          };
        }
      });
    });
  });
  let 正股to到日期 = Object.values(正股to到日期Map).filter((el) => el.value);
  let 到日期to沽购 = Object.values(到日期to沽购Map).filter((el) => el.value);
  let 沽购to正股 = Object.values(沽购to正股Map).filter((el) => el.value);
  const sourceToTargetList = [...沽购to正股, ...正股to到日期, ...到日期to沽购];
  return getSankeyOption({
    沽购to正股,
    sourceToTargetList,
    sumValue: 持仓总价.value,
    title: "盈利分布",
    总和标识: "盈",
  });
});

const 亏损分布Option = computed(() => {
  const 单腿期权TableData = [...richTableData.value?.[1]?.children, ...richTableData.value?.[2]?.children, ...richTableData.value?.[3]?.children];
  let 沽购to正股Map = {};
  ["沽", "购"].forEach((type) => {
    Object.keys(stock_code_map).forEach((stock_code) => {
      单腿期权TableData.forEach((el) => {
        if (el["正股代码"] === stock_code && el["沽购"] === type && el?.今日总涨跌 < 0) {
          const 组合Str = el["isCombo"] ? "[组合]" : "";
          const key = 组合Str + stock_code + type;
          沽购to正股Map[key] = {
            source: type,
            target: stock_code_map[stock_code] + 组合Str,
            stock_code,
            value: (沽购to正股Map[key]?.value || 0) + (-el?.今日总涨跌 || 0),
          };
        }
      });
    });
  });
  let 到日期to沽购Map = {};
  deadline_list.forEach((date) => {
    ["沽", "购"].forEach((type) => {
      单腿期权TableData.forEach((el) => {
        if (el["沽购"] === type && el["到期日"] === date && el?.今日总涨跌 < 0) {
          const key = date + type;
          到日期to沽购Map[key] = {
            source: dayjs(date, "YYYYMMDD").format("M月"),
            target: type + " ",
            value: (到日期to沽购Map[key]?.value || 0) + (-el?.今日总涨跌 || 0),
          };
        }
      });
    });
  });
  let 正股to到日期Map = {};
  deadline_list.forEach((date) => {
    Object.keys(stock_code_map).forEach((stock_code) => {
      单腿期权TableData.forEach((el) => {
        if (el["正股代码"] === stock_code && el["到期日"] === date && el?.今日总涨跌 < 0) {
          const 组合Str = el["isCombo"] ? "[组合]" : "";
          const key = 组合Str + stock_code + date;
          正股to到日期Map[key] = {
            stock_code,
            source: stock_code_map[stock_code] + 组合Str,
            target: dayjs(date, "YYYYMMDD").format("M月"),
            value: (正股to到日期Map[key]?.value || 0) + (-el?.今日总涨跌 || 0),
          };
        }
      });
    });
  });
  let 正股to到日期 = Object.values(正股to到日期Map).filter((el) => el.value);
  let 到日期to沽购 = Object.values(到日期to沽购Map).filter((el) => el.value);
  let 沽购to正股 = Object.values(沽购to正股Map).filter((el) => el.value);
  const sourceToTargetList = [...沽购to正股, ...正股to到日期, ...到日期to沽购];
  return getSankeyOption({
    沽购to正股,
    sourceToTargetList,
    sumValue: 持仓总价.value,
    title: "亏损分布",
    总和标识: "亏",
  });
});
</script>
<style>
.el-table .highlight-line {
  background-color: #fdf6ec;
}
</style>
