<template>
  <div>
    <el-form size="small" :model="formData" label-width="auto" label-suffix=":">
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
  <el-table size="small" :data="validRichTableData" :border="false" preserve-expanded-content default-expand-all style="width: 100%" :show-header="false" :row-class-name="() => 'highlight-line'">
    <el-table-column type="expand">
      <template #expand> </template>
      <template #default="props">
        <div>
          <el-table :data="filterTableData(props.row.children)" :border="false" :row-style="getInRowStyle">
            <el-table-column label="序" minWidth="40" align="center" fixed="left">
              <template #default="{ $index }">
                <div class="text-[10px]">{{ $index + 1 }}</div>
              </template>
            </el-table-column>
            <el-table-column label="期权名称" prop="期权名称" #default="{ row }" :minWidth="props.row.single ? 180 : 230" minWidth="230" sortable fixed="left">
              <CombinTableCell :value="row['期权名称']" :showDiff="false" @click="() => handleShowBs(row)" />
            </el-table-column>
            <el-table-column label="信息" align="center">
              <el-table-column label="正股" #default="{ row }" prop="正股代码" minWidth="95" sortable>
                {{ OPTIONS_MAP.find((el) => el.code === row["正股代码"])?.showName }}
              </el-table-column>
              <el-table-column label="沽购" #default="{ row }" prop="沽购" minWidth="80" sortable>
                <TagCallPut :value="row['沽购']" />
              </el-table-column>
              <el-table-column label="天数" prop="到期天数" align="right" minWidth="80" sortable />
            </el-table-column>
            <el-table-column label="持" prop="持仓" align="right" minWidth="70" sortable />
            <el-table-column label="一手价格构成" align="center">
              <el-table-column label="时间" #default="{ row }" align="right" :minWidth="props.row.single ? 80 : 140" prop="一手时间价" sortable>
                <CombinTableCell :value="row['一手时间价']" :showDiff="false" />
              </el-table-column>
              <el-table-column label="实值" #default="{ row }" align="right" :minWidth="props.row.single ? 80 : 140" prop="一手内在价" sortable>
                <CombinTableCell :value="row['一手内在价']" :showDiff="false" />
              </el-table-column>
            </el-table-column>

            <el-table-column label="日盈亏" align="center">
              <el-table-column label="日总涨跌" align="right" prop="今日总涨跌" minWidth="110" sortable />
              <el-table-column label="日单手涨跌" align="right" prop="今日单手涨跌" minWidth="120" sortable />
            </el-table-column>

            <el-table-column label="总盈亏" align="center">
              <el-table-column label="一手价" :minWidth="props.row.single ? 95 : 120" #default="{ row }" prop="一手价" align="right" sortable>
                <CombinTableCell :value="row['一手价']" :showDiff="true" />
              </el-table-column>
              <el-table-column label="成本价" :minWidth="props.row.single ? 95 : 120" #default="{ row }" align="right" prop="一手成本价" sortable>
                <CombinTableCell :value="row['一手成本价']" :showDiff="true" />
              </el-table-column>
              <el-table-column label="一手盈亏" prop="一手盈亏" align="right" :minWidth="props.row.single ? 110 : 120" sortable />
              <el-table-column label="总盈亏" prop="总盈亏" align="right" :minWidth="props.row.single ? 95 : 120" sortable />
            </el-table-column>

            <el-table-column label="希腊字母" align="center">
              <el-table-column label="Gamma" #default="{ row }" prop="Gamma" align="right" :minWidth="props.row.single ? 105 : 120" sortable>
                <CombinTableCell v-if="!props.row.single" :value="row['Gamma'].map((el) => el * 10)" :showDiff="true" :format="(val) => val?.toFixed(1)" />
                <TagGamma v-else :value="row['Gamma']" />
              </el-table-column>
              <el-table-column label="Delta" #default="{ row }" prop="Delta" align="right" :minWidth="props.row.single ? 95 : 120" sortable>
                <CombinTableCell v-if="!props.row.single" :value="row['Delta'].map((el) => el * 100)" :showDiff="true" :format="(val) => val?.toFixed(1)" />
                <TagDelta v-else :value="row['Delta']" />
              </el-table-column>
              <el-table-column label="Vega" #default="{ row }" prop="Vega" align="right" :minWidth="props.row.single ? 95 : 120" sortable>
                <CombinTableCell v-if="!props.row.single" :value="row['Vega'].map((el) => el * 100)" :showDiff="true" :format="(val) => val?.toFixed(0)" />
                <TagVega v-else :value="row['Vega']" />
              </el-table-column>
            </el-table-column>

            <el-table-column label="仓位" align="center" fixed="right">
              <el-table-column label="总价" prop="总价" align="right" minWidth="85" sortable />
              <el-table-column sortable :label="props.row._custom ? `待收益占比(${props.row.value})` : `总价占比(${持仓总价})`" prop="总价占比" #default="{ row }" width="160">
                <el-progress :percentage="row['总价占比'].toFixed(2)" :color="getPercentColor(row['总价占比'])" />
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
        <TagDiff v-if="!props.row._custom" :涨跌="props.row.涨跌" />
      </div>
    </el-table-column>
  </el-table>

  <div class="overflow-auto mt-[10px]">
    <div class="min-w-[1000px] mx-auto">
      <VChart :option="持仓分布Option" style="height: 900px; width: 100%" />
      <VChart :option="盈利分布Option" style="height: 450px; width: 100%" />
      <VChart :option="亏损分布Option" style="height: 450px; width: 100%" />
    </div>
  </div>
  <BsModal v-model:visible="bsModalData.visible" :optionInfo="bsModalData.optionInfo" />
</template>

<script setup>
import { deadline_list, deadline_color_list, OPTIONS_MAP, 最大建议买入时间价 } from "~/data";
import { formatDecimal } from "~/utils/utils";
import _ from "lodash";
import dayjs from "dayjs";
const bsModalData = reactive({
  visible: false,
  optionInfo: {},
});
function handleShowBs(row) {
  const current期权Item = props.tiledData.find((el) => el["期权名称"] === row["期权名称"]);
  // bsModalData.optionInfo = {
  //   正股价格: current期权Item.value["正股价格"],
  //   行权价: current期权Item.value["行权价"],
  //   到期天数: current期权Item.value["到期天数"],
  //   隐波: current期权Item.value["隐波"],
  //   沽购: current期权Item.value["沽购"],
  //   最新价:  current期权Item.value["最新价"],

  //   S: props.row["正股价格"],
  //   K: props.row["行权价"],
  //   r: 0.02,
  //   T: current期权Item.value["到期天数"] / 365,
  //   sigma: (current期权Item.value["隐波"] || 0.01) / 100,
  //   optionType: props.isCall ? "call" : "put",
  //   price: current期权Item.value["最新价"],
  // };
  bsModalData.optionInfo = { ...current期权Item };
  bsModalData.visible = true;
}
const stockOptions = OPTIONS_MAP.map((el) => ({
  label: el.name,
  value: el.code,
}));
const formData = reactive({
  正股List: [...OPTIONS_MAP.map((el) => el.code)],
  到期日List: [...deadline_list],
  沽购List: ["沽", "购"],
});
const props = defineProps(["tiledData", "comboList"]);
const 组合期权持仓 = computed(() => {
  let 时间收益组合Value = 0;
  let 时间损耗组合Value = 0;
  let 时间收益组合持仓Value = 0;
  let 时间收益组合涨跌 = 0;
  let 时间损耗组合涨跌 = 0;

  const 时间收益组合List = [];
  const 时间损耗组合List = [];

  props.comboList.forEach((el) => {
    const [权利Name, 义务Name, 组合持仓, 组合名称] = el;
    const 权利期权Item = props.tiledData.find((el) => el["期权名称"] === 权利Name);
    const 义务期权Item = props.tiledData.find((el) => el["期权名称"] === 义务Name);
    // 时间收益
    if (权利期权Item["内在价值"] && 权利期权Item["一手时间价"] < 义务期权Item["一手时间价"]) {
      时间收益组合List.push([权利期权Item, 义务期权Item, 组合持仓, 组合名称]);
      时间收益组合Value += (义务期权Item["一手时间价"] - 权利期权Item["一手时间价"]) * 组合持仓;
      时间收益组合持仓Value += (权利期权Item["一手价"] - 义务期权Item["一手价"]) * 组合持仓;
      时间收益组合涨跌 += (权利期权Item["一手涨跌价"] - 义务期权Item["一手涨跌价"]) * 组合持仓;
    }
    // 时间损耗
    else {
      时间损耗组合List.push([权利期权Item, 义务期权Item, 组合持仓, 组合名称]);
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
  let 持仓List = props.tiledData?.filter((el) => el["持仓"]).map((el) => ({ ...el }));
  props.comboList.forEach(([权利Name, 义务Name, 组合持仓]) => {
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
      children: 组合期权持仓.value.时间收益组合List.map(([权利期权Item, 义务期权Item, 组合持仓, 组合名称]) => {
        const 总价 = (义务期权Item["一手时间价"] - 权利期权Item["一手时间价"]) * 组合持仓;
        return {
          期权名称: 组合名称,
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
      children: 组合期权持仓.value.时间收益组合List.map(([权利期权Item, 义务期权Item, 组合持仓, 组合名称]) => {
        const 总价 = (权利期权Item["一手价"] - 义务期权Item["一手价"]) * 组合持仓;
        const 一手盈亏 = 权利期权Item["一手价"] - 权利期权Item["一手成本价"] - (义务期权Item["一手价"] - 义务期权Item["一手成本价"]);
        const 总盈亏 = 一手盈亏 * 组合持仓;
        const 今日单手涨跌 = 权利期权Item["一手涨跌价"] - 义务期权Item["一手涨跌价"];
        return {
          isCombo: true,
          Vega: [权利期权Item["Vega"], 义务期权Item["Vega"]],
          Gamma: [权利期权Item["Gamma"], 义务期权Item["Gamma"]],
          Delta: [权利期权Item["Delta"], 义务期权Item["Delta"]],
          正股代码: 权利期权Item["正股代码"],
          沽购: 权利期权Item["沽购"],
          到期日: 权利期权Item["到期日"],
          到期天数: 权利期权Item["到期天数"],

          期权名称: 组合名称,
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
      children: 组合期权持仓.value.时间损耗组合List.map(([权利期权Item, 义务期权Item, 组合持仓, 组合名称]) => {
        const 总价 = (权利期权Item["一手价"] - 义务期权Item["一手价"]) * 组合持仓;
        const 一手盈亏 = 权利期权Item["一手价"] - 权利期权Item["一手成本价"] - (义务期权Item["一手价"] - 义务期权Item["一手成本价"]);
        const 总盈亏 = 一手盈亏 * 组合持仓;
        const 今日单手涨跌 = 权利期权Item["一手涨跌价"] - 义务期权Item["一手涨跌价"];
        return {
          isCombo: true,
          期权名称: 组合名称,
          持仓: 组合持仓,
          正股代码: 权利期权Item["正股代码"],
          沽购: 权利期权Item["沽购"],
          到期日: 权利期权Item["到期日"],
          到期天数: 权利期权Item["到期天数"],
          Vega: [权利期权Item["Vega"], 义务期权Item["Vega"]],
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
      single: true,
      title: "单腿期权(占用时间价值)",
      value: 单腿期权持仓.value.value,
      涨跌: 单腿期权持仓.value.涨跌,
      children: 单腿期权持仓.value.list.map((期权) => {
        const 持仓 = 期权["持仓"];
        const 总价 = 期权["一手价"] * 持仓;
        const 一手盈亏 = 期权["一手价"] - 期权["一手成本价"];
        const 总盈亏 = 一手盈亏 * 持仓;
        return {
          ...期权,
          // 期权名称: 期权["期权名称"],
          // 持仓,
          // 一手价: 期权["一手价"],
          // 一手成本价: 期权["一手成本价"],
          // 一手内在价: 期权["一手内在价"],
          // 一手时间价: 期权["一手时间价"],
          // 到期天数: 期权["到期天数"],
          // Gamma: 期权["Gamma"],
          // Delta: 期权["Delta"],

          今日总涨跌: 期权["一手涨跌价"] * 持仓,
          今日单手涨跌: 期权["一手涨跌价"],
          总价,
          一手盈亏,
          总盈亏,
          总价占比: formatDecimal((100 * 总价) / 持仓总价.value, 1),
          // 正股代码: 期权["正股代码"],
          // 沽购: 期权["沽购"],
          // 到期日: 期权["到期日"],
        };
      }),
    },
  ];
});

const validRichTableData = computed(() => {
  const [table1, table2, table3, table4] = richTableData.value || [];
  if (!table1.children?.length && !table2.children?.length && !table3.children?.length) return [table4];
  return richTableData.value;
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
    colorMap[dayjs(el, "YYYY-MM-DD").format("M月")] = deadline_color_list[index];
  });
  OPTIONS_MAP.forEach((el) => {
    colorMap[el.code] = el.color;
    colorMap[el.code + "[组合]"] = el.color;
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
  const dataListSort = [..._.flattenDeep(OPTIONS_MAP.map((el) => [el.code, el.code + "[组合]"])), "购", "购 ", "沽", "沽 ", ...deadline_list.map((el) => dayjs(el, "YYYY-MM-DD").format("M月")), 总和标识];
  dataList = dataListSort.filter((el) => dataList.includes(el));
  return dataList;
}
function getSpaceBetween2Div($1, $2) {
  return `<div style="font-size: 20px;display:flex;justify-content: space-between;column-gap: 30px;height: 24px;"><div>${$1}</div><div>${$2}</div></div>`;
}
function getSpaceBetween4Div($1, $2, $3, $4, $5) {
  return `<div style="font-size: 20px;display:flex;justify-content: space-between;align-items: center;column-gap: 5px;height: 24px;">
              <div style='width: 75px;border: 1px solid #409eff;padding: 2px;color: #409eff;border-radius: 3px;text-align: right;;margin-right: 20px;'>${$2}</div>
              <div style='width:230px'>${$3}</div>
              <div style='width: 50px;font-size:12px; text-align:right;color: #607cdd;'>${$5}</div>
              <div style='width: 60px;color: #409eff;border-radius: 3px;text-align: right;'>${$4}手</div>
              <div style='width: 70px;text-align:right;'>${$1}</div>
            </div>
          </div>`;
}
function getSankeyOption({ 沽购to正股, sourceToTargetList, sumValue, title, 总和标识 = "持" }) {
  const 所有持仓期权TableData = [...richTableData.value?.[1]?.children, ...richTableData.value?.[2]?.children, ...richTableData.value?.[3]?.children];
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
      top: 0, // 标题距离容器顶部10px（可根据需要调整）
      padding: [0, 0, 25, 0], // 标题内边距：上、右、下、左 → 底部留25px空白
      textStyle: {
        fontSize: 18,
        fontWeight: "normal",
      },
    },
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove|click",
      formatter: (params) => {
        const { dataType, data, value } = params;
        let list = [];
        let targetName = "";
        let listStr = "";
        let targetValue = 亏损符号 * value;
        let 展示字段 = 总和标识 === "持" ? "总价" : "今日总涨跌";
        let sumValue = 0;

        if (dataType === "node") {
          targetName = getStockCodeName(data.name);
          list = getFilterDataByDataName(data.name, 所有持仓期权TableData);
          if (总和标识 === "盈") list = list.filter((el) => el[展示字段] >= 0);
          if (总和标识 === "亏") list = list.filter((el) => el[展示字段] < 0);
        } else if (dataType === "edge") {
          targetName = `${getStockCodeName(data.source)} > ${getStockCodeName(data.target)}`;
          let tList = getFilterDataByDataName(data.source, 所有持仓期权TableData);
          list = getFilterDataByDataName(data.target, tList);
        }

        list.forEach((el) => (sumValue += el[展示字段]));
        list = _.sortBy(list, (el) => -Math.abs(el[展示字段]));
        listStr += list
          .map(
            (el) =>
              `${getSpaceBetween4Div(
                //
                el[展示字段],
                // 百分比
                formatDecimal((10000 * el[展示字段]) / sumValue / 100, 1).toFixed(1) + "%",
                // 名称
                el["期权名称"],
                el["持仓"],
                formatDecimal(el[展示字段] / el["持仓"], 0)
              )}`
          )
          .join("");
        if (listStr) listStr += "<br />";
        return `${listStr}${getSpaceBetween2Div(targetName, targetValue)}`;
      },
    },
    grid: {
      left: "center", // 水平居中
      top: "10%", // 垂直居中
      right: "auto",
      bottom: "0",
      // containLabel: true, // 确保标签包含在grid区域内，避免溢出
    },
    animation: true,
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
              fontWeight: 600,
              fontSize: "14px",
            },
            b: {
              color: "#4f6eda",
              fontWeight: 600,
              fontSize: "14px",
            },
            c: {
              color: "#4f6eda",
              fontWeight: 600,
              fontSize: "14px",
            },
          },
          formatter: function (params) {
            const { value, data } = params;
            let targetName = getStockCodeName(data.name);
            return `{a|${targetName}} {b|${亏损符号 * value}} {c|(${formatDecimal((100 * value) / sumValue, 1)}%)}`;
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

function getFilterDataByDataName(dataName, tableData) {
  let list = [];
  let type = dataName.replace(" ", "");
  // 沽购列
  if (["沽", "购"].some((type) => dataName.includes(type))) {
    list = tableData.filter((el) => el["沽购"] === type);
  }
  // 月份列
  else if (dataName.includes("月")) {
    list = tableData.filter((el) => dayjs(el["到期日"], "YYYY-MM-DD").format("M月") === dataName);
  }
  // 合计列
  else if (["持", "盈", "亏"].includes(dataName)) {
    list = tableData;
  }
  // 正股
  else {
    const stockCode = OPTIONS_MAP.find((el) => el.code === dataName.replace("[组合]", ""))?.code;
    const isCombo = dataName.includes("[组合]");
    list = tableData.filter((el) => el["正股代码"] === stockCode && !!el["isCombo"] === isCombo);
  }
  return list;
}

function getStockCodeName(name) {
  let targetName = name;
  if (targetName.includes("[组合]")) {
    const target = OPTIONS_MAP.find((el) => el.code === targetName.replace("[组合]", ""));
    if (target) targetName = target.name + "[组合]";
  } else {
    const target = OPTIONS_MAP.find((el) => el.code === targetName);
    if (target) targetName = target.name;
  }
  return targetName;
}

const 持仓分布Option = computed(() => {
  const 单腿期权TableData = [...richTableData.value?.[1]?.children, ...richTableData.value?.[2]?.children, ...richTableData.value?.[3]?.children];
  let 沽购to正股Map = {};
  ["沽", "购"].forEach((type) => {
    OPTIONS_MAP.forEach((item) => {
      单腿期权TableData.forEach((el) => {
        if (el["正股代码"] === item.code && el["沽购"] === type) {
          const 组合Str = el["isCombo"] ? "[组合]" : "";
          const key = 组合Str + item.code + type;
          沽购to正股Map[key] = {
            // list: [...(沽购to正股Map[key]?.list || []),el],
            source: type,
            target: item.code + 组合Str,
            stock_code: item.code,
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
            source: dayjs(date, "YYYY-MM-DD").format("M月"),
            target: type + " ",
            value: (到日期to沽购Map[key]?.value || 0) + (el?.总价 || 0),
          };
        }
      });
    });
  });
  let 正股to到日期Map = {};
  deadline_list.forEach((date) => {
    OPTIONS_MAP.forEach((item) => {
      单腿期权TableData.forEach((el) => {
        if (el["正股代码"] === item.code && el["到期日"] === date) {
          const 组合Str = el["isCombo"] ? "[组合]" : "";
          const key = 组合Str + item.code + date;
          正股to到日期Map[key] = {
            stock_code: item.code,
            source: item.code + 组合Str,
            target: dayjs(date, "YYYY-MM-DD").format("M月"),
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
    OPTIONS_MAP.forEach((item) => {
      单腿期权TableData.forEach((el) => {
        if (el["正股代码"] === item.code && el["沽购"] === type && el?.今日总涨跌 > 0) {
          const 组合Str = el["isCombo"] ? "[组合]" : "";
          const key = 组合Str + item.code + type;
          沽购to正股Map[key] = {
            source: type,
            target: item.code + 组合Str,
            stock_code: item.code,
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
            source: dayjs(date, "YYYY-MM-DD").format("M月"),
            target: type + " ",
            value: (到日期to沽购Map[key]?.value || 0) + (el?.今日总涨跌 || 0),
          };
        }
      });
    });
  });
  let 正股to到日期Map = {};
  deadline_list.forEach((date) => {
    OPTIONS_MAP.forEach((item) => {
      单腿期权TableData.forEach((el) => {
        if (el["正股代码"] === item.code && el["到期日"] === date && el?.今日总涨跌 > 0) {
          const 组合Str = el["isCombo"] ? "[组合]" : "";
          const key = 组合Str + item.code + date;
          正股to到日期Map[key] = {
            stock_code: item.code,
            source: item.code + 组合Str,
            target: dayjs(date, "YYYY-MM-DD").format("M月"),
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
    OPTIONS_MAP.forEach((item) => {
      单腿期权TableData.forEach((el) => {
        if (el["正股代码"] === item.code && el["沽购"] === type && el?.今日总涨跌 < 0) {
          const 组合Str = el["isCombo"] ? "[组合]" : "";
          const key = 组合Str + item.code + type;
          沽购to正股Map[key] = {
            source: type,
            target: item.code + 组合Str,
            stock_code: item.code,
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
            source: dayjs(date, "YYYY-MM-DD").format("M月"),
            target: type + " ",
            value: (到日期to沽购Map[key]?.value || 0) + (-el?.今日总涨跌 || 0),
          };
        }
      });
    });
  });
  let 正股to到日期Map = {};
  deadline_list.forEach((date) => {
    OPTIONS_MAP.forEach((item) => {
      单腿期权TableData.forEach((el) => {
        if (el["正股代码"] === item.code && el["到期日"] === date && el?.今日总涨跌 < 0) {
          const 组合Str = el["isCombo"] ? "[组合]" : "";
          const key = 组合Str + item.code + date;
          正股to到日期Map[key] = {
            stock_code: item.code,
            source: item.code + 组合Str,
            target: dayjs(date, "YYYY-MM-DD").format("M月"),
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
const filterHandler = (value, row, column) => {
  const property = column["property"];
  return row[property] === value;
};
function getInRowStyle({ row }) {
  if (row["is非法持仓"]) return { background: "#FFE2AF" };
}
</script>
<style scoped>
::v-deep(.el-table--small .cell) {
  padding: 0 6px 0 0 !important;
}
::v-deep(.el-table--small .el-table__cell) {
  padding: 2px 0 !important;
}
</style>
<style>
.el-progress__text {
  text-align: right;
}
</style>
