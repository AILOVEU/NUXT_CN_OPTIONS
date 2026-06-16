<template>
  <div>
    <el-form size="small" :model="formData" label-width="auto" label-suffix=":">
      <el-form-item label="正股">
        <TabSelectMult :options="stockOptions" v-model="formData.正股List" />
      </el-form-item>
      <el-form-item label="到期日">
        <TabSelectMult :options="deadline_list.map((el) => ({ label: el, value: el }))" v-model="formData.到期日List" />
      </el-form-item>
      <el-form-item label="沽购">
        <TabSelectMult :options="['沽', '购'].map((el) => ({ label: el, value: el }))" v-model="formData.沽购List" />
      </el-form-item>
    </el-form>
  </div>

  <div class="w-full flex mb-[12px] gap-[20px] justify-between mx-[20px]">
    <div v-for="item in tabOptions" :key="item.value" class="flex-1 border-[1px] leading-1 text-center cursor-pointer h-[25px] flex items-center justify-center" :class="{ active: item.value === showType }" @click="showType = item.value">
      {{ item.label }}
    </div>
  </div>

  <template v-if="showType === 'list'">
    <div class="flex justify-center items-center">持仓列表</div>
    <el-table size="small" :data="validRichTableData" :border="false" preserve-expanded-content default-expand-all style="width: 100%" :show-header="false" :row-class-name="() => 'highlight-line'">
      <el-table-column type="expand">
        <template #default="props">
          <div>
            <FilterList :checkIsChance="checkIsFilter" :data="props.row.children" :isCombo="!props.row.single" :showHold="true" />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="名" prop="title" />
      <el-table-column label="值" prop="value" #default="props">
        <div class="flex items-center gap-[12px]">
          <div>{{ props.row.value }}</div>
          <div v-if="!props.row._custom">({{ formatDecimal((100 * props.row.value) / 持仓总价, 1) }}%)</div>
          <TagDiff v-if="!props.row._custom" :value="props.row.涨跌" />
        </div>
      </el-table-column>
    </el-table>
    <div v-if="持仓变化Table.length" class="flex justify-center items-center">清仓列表</div>
    <FilterList v-if="持仓变化Table.length" :checkIsChance="() => true" :data="持仓变化Table" :showHold="false" />
  </template>

  <div v-else-if="showType === 'symmetric'" class="flex justify-center">
    <SymmetricTable tableTitle="持仓" :symmetricData="filteredSymmetricData" :tiledData="filteredTiledData" mode="hold" />
  </div>

  <div class="overflow-auto mt-[10px]">
    <div class="min-w-[1000px] mx-auto">
      <div class="flex justify-center" @click="captureRef.download()">
        <el-button link>⬇</el-button>
      </div>
      <Capture title="持仓分布" ref="captureRef">
        <VChart :option="投入分布Option" style="height: 900px; width: 100%" />
        <VChart :option="持仓分布Option" style="height: 900px; width: 100%" />
      </Capture>
    </div>
  </div>

  <BsModal v-model:visible="bsModalData.visible" :optionInfo="bsModalData.optionInfo" />
</template>

<script setup>
import { deadline_list, deadline_color_list, OPTIONS_MAP } from "~/data";
import { formatDecimal } from "~/utils/utils";
import { filter是否保留行 } from "~/utils/options.js";
import _ from "lodash";
import dayjs from "dayjs";

// 常量提取
const tabOptions = [
  { label: "列表", value: "list" },
  { label: "T型", value: "symmetric" },
];

// 响应式状态
const showType = ref("list");
const captureRef = ref(null);

const bsModalData = reactive({
  visible: false,
  optionInfo: {},
});

const tableData = reactive({
  symmetricData: [],
  tiledData: [],
  comboList: [],
  loading: false,
});

// 表单数据
const formData = reactive({
  正股List: [...OPTIONS_MAP.map((el) => el.code)],
  到期日List: [...deadline_list],
  沽购List: ["沽", "购"],
});

const stockOptions = OPTIONS_MAP.map((el) => ({
  label: el.name,
  value: el.code,
}));

// Props
const props = defineProps(["tiledData", "comboList"]);

// 方法
function handleShowBs(row) {
  const current期权Item = props.tiledData.find((el) => el["期权名称"] === row["期权名称"]);
  if (!current期权Item) return;
  bsModalData.optionInfo = { ...current期权Item };
  bsModalData.visible = true;
}

async function handleQuery() {
  tableData.loading = true;
  try {
    const [symmetricData, comboList, tiledData] = await queryGrid(OPTIONS_MAP.map((el) => el.code));
    tableData.symmetricData = symmetricData || [];
    tableData.tiledData = tiledData;
    tableData.comboList = comboList;
  } finally {
    tableData.loading = false;
  }
}

// 初始化执行
handleQuery();

// 过滤数据
const filteredTiledData = computed(() => {
  return tableData.tiledData.map((el) => {
    if (checkIsFilter(el) && (el["持仓"] || (!el["持仓"] && el["持仓变化"]))) return el;
    return {
      ...el,
      _限制展示: true,
    };
  });
});

const filteredSymmetricData = computed(() => {
  return filter是否保留行(tableData.symmetricData, tableData.tiledData, filteredTiledData.value);
});

// 组合期权持仓计算
const 组合期权持仓 = computed(() => {
  let 时间收益组合Value = 0;
  let 时间损耗组合Value = 0;
  let 时间收益组合持仓Value = 0;
  let 时间收益组合涨跌 = 0;
  let 时间损耗组合涨跌 = 0;
  let 组合总投入 = 0;

  const 时间收益组合List = [];
  const 时间损耗组合List = [];

  props.comboList.forEach((el) => {
    const [权利Name, 义务Name, 组合持仓, 组合名称] = el;
    const 权利期权Item = props.tiledData.find((item) => item["期权名称"] === 权利Name);
    const 义务期权Item = props.tiledData.find((item) => item["期权名称"] === 义务Name);

    if (!权利期权Item || !义务期权Item) return;

    组合总投入 += 权利期权Item["总投入"] - 义务期权Item["总投入"];

    if (权利期权Item["内在价值"] && 权利期权Item["一手时间价"] < 义务期权Item["一手时间价"]) {
      时间收益组合List.push([权利期权Item, 义务期权Item, 组合持仓, 组合名称]);
      时间收益组合Value += (义务期权Item["一手时间价"] - 权利期权Item["一手时间价"]) * 组合持仓;
      时间收益组合持仓Value += (权利期权Item["一手价"] - 义务期权Item["一手价"]) * 组合持仓;
      时间收益组合涨跌 += (权利期权Item["一手涨跌价"] - 义务期权Item["一手涨跌价"]) * 组合持仓;
    } else {
      时间损耗组合List.push([权利期权Item, 义务期权Item, 组合持仓, 组合名称]);
      时间损耗组合Value += (权利期权Item["一手价"] - 义务期权Item["一手价"]) * 组合持仓;
      时间损耗组合涨跌 += (权利期权Item["一手涨跌价"] - 义务期权Item["一手涨跌价"]) * 组合持仓;
    }
  });

  return {
    组合总投入,
    时间收益组合List,
    时间收益组合Value: Math.floor(时间收益组合Value),
    时间收益组合涨跌: Math.floor(时间收益组合涨跌),
    时间损耗组合List,
    时间损耗组合Value: Math.floor(时间损耗组合Value),
    时间损耗组合涨跌: Math.floor(时间损耗组合涨跌),
    时间收益组合持仓Value: Math.floor(时间收益组合持仓Value),
  };
});

// 单腿期权持仓
const 单腿期权持仓 = computed(() => {
  let 持仓List = props.tiledData?.filter((el) => el["持仓"]).map((el) => ({ ...el })) || [];

  props.comboList.forEach(([权利Name, 义务Name, 组合持仓]) => {
    持仓List.forEach((item) => {
      if (item["期权名称"] === 权利Name) item["持仓"] -= 组合持仓;
      if (item["期权名称"] === 义务Name) item["持仓"] += 组合持仓;
    });
  });

  let 涨跌 = 0;
  持仓List = 持仓List.filter((el) => el["持仓"]);
  持仓List = _.sortBy(持仓List, ["正股代码", "到期日", "行权价"]);

  let value = 0;
  let 总投入 = 0;

  持仓List.forEach((el) => {
    总投入 += el["总投入"];
    value += el["一手价"] * el["持仓"];
    涨跌 += el["一手涨跌价"] * el["持仓"];
  });

  return {
    list: 持仓List,
    value: Math.floor(value),
    涨跌: Math.floor(涨跌),
    总投入,
  };
});

// 汇总计算
const 持仓总价 = computed(() => {
  return 组合期权持仓.value.时间收益组合持仓Value + 组合期权持仓.value.时间损耗组合Value + 单腿期权持仓.value.value || 1;
});

const 持仓总投入 = computed(() => {
  return 组合期权持仓.value.组合总投入 + 单腿期权持仓.value.总投入 || 1;
});

// 表格数据源
const richTableData = computed(() => {
  const combo = 组合期权持仓.value;
  const single = 单腿期权持仓.value;

  return [
    {
      _custom: true,
      title: "组合时间价值待收益",
      value: combo.时间收益组合Value,
      children: combo.时间收益组合List.map(([权利期权Item, 义务期权Item, 组合持仓, 组合名称]) => {
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
          总价占比: formatDecimal((100 * 总价) / combo.时间收益组合Value, 1),
        };
      }),
    },
    {
      title: "组合占用资金(无时间损耗)",
      value: combo.时间收益组合持仓Value,
      涨跌: combo.时间收益组合涨跌,
      children: combo.时间收益组合List.map(([权利期权Item, 义务期权Item, 组合持仓, 组合名称]) => {
        const 总价 = (权利期权Item["一手价"] - 义务期权Item["一手价"]) * 组合持仓;
        const 总投入 = 权利期权Item["总投入"] - 义务期权Item["总投入"];
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
          一手涨跌价: 今日单手涨跌,
          总投入,
          总价,
          总价占比: formatDecimal((100 * 总价) / 持仓总价.value, 1),
          总盈亏,
          一手盈亏,
        };
      }),
    },
    {
      title: "组合期权持仓(占用时间价值)",
      value: combo.时间损耗组合Value,
      涨跌: combo.时间损耗组合涨跌,
      children: combo.时间损耗组合List.map(([权利期权Item, 义务期权Item, 组合持仓, 组合名称]) => {
        const 总价 = (权利期权Item["一手价"] - 义务期权Item["一手价"]) * 组合持仓;
        const 总投入 = 权利期权Item["总投入"] - 义务期权Item["总投入"];
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
          一手涨跌价: 今日单手涨跌,
          总盈亏,
          一手盈亏,
          总投入,
          总价,
          总价占比: formatDecimal((100 * 总价) / 持仓总价.value, 1),
        };
      }),
    },
    {
      showChart: true,
      single: true,
      title: "单腿期权(占用时间价值)",
      value: single.value,
      涨跌: single.涨跌,
      children: single.list.map((期权) => {
        const 持仓 = 期权["持仓"];
        const 总价 = 期权["一手价"] * 持仓;
        const 一手盈亏 = 期权["一手价"] - 期权["一手成本价"];
        return {
          ...期权,
          今日总涨跌: 期权["一手涨跌价"] * 持仓,
          一手涨跌价: 期权["一手涨跌价"],
          总价,
          一手盈亏,
          总盈亏: 一手盈亏 * 持仓,
          总价占比: formatDecimal((100 * 总价) / 持仓总价.value, 1),
        };
      }),
    },
  ];
});

const 持仓变化Table = computed(() => {
  let 持仓List = props.tiledData?.filter((el) => !el["持仓"] && el["持仓变化"]) || [];
  console.log("持仓List", 持仓List);
  return 持仓List;
});

// 有效表格数据
const validRichTableData = computed(() => {
  const data = richTableData.value || [];
  const [table1, table2, table3, table4] = data;
  const hasComboData = table1?.children?.length || table2?.children?.length || table3?.children?.length;
  return hasComboData ? data : [table4];
});

// 过滤与校验
function filterTableData(tableData) {
  return tableData
    .filter((el) => formData.正股List.includes(el["正股代码"]))
    .filter((el) => formData.到期日List.includes(el["到期日"]))
    .filter((el) => formData.沽购List.includes(el["沽购"]));
}

function checkIsFilter(el) {
  return formData.正股List.includes(el["正股代码"]) && formData.到期日List.includes(el["到期日"]) && formData.沽购List.includes(el["沽购"]);
}

// 颜色工具
function getPercentColor(val) {
  if (val > 50) return "#f56c6c";
  if (val > 25) return "#e6a23c";
  if (val > 5) return "#409eff";
  return "#909399";
}

// 桑基图工具函数（提取公共逻辑，大幅简化代码）
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
    colorMap[dayjs(el).format("M月")] = deadline_color_list[index];
  });

  OPTIONS_MAP.forEach((el) => {
    colorMap[el.code] = el.color;
    colorMap[`${el.code}[组合]`] = el.color;
  });

  return colorMap;
}

function getStockCodeName(name) {
  if (name.includes("[组合]")) {
    const code = name.replace("[组合]", "");
    return OPTIONS_MAP.find((el) => el.code === code)?.name + "[组合]" || name;
  }
  return OPTIONS_MAP.find((el) => el.code === name)?.name || name;
}

function getFilterDataByDataName(dataName, tableData) {
  const type = dataName.trim();
  if (["沽", "购"].includes(type)) {
    return tableData.filter((el) => el["沽购"] === type);
  }
  if (dataName.includes("月")) {
    return tableData.filter((el) => dayjs(el["到期日"]).format("M月") === dataName);
  }
  if (["持", "盈", "亏", "投"].includes(dataName)) {
    return tableData;
  }
  const stockCode = dataName.replace("[组合]", "");
  const isCombo = dataName.includes("[组合]");
  return tableData.filter((el) => el["正股代码"] === stockCode && !!el.isCombo === isCombo);
}

// HTML 模板字符串（简化写法）
const getSpaceBetween2Div = ($1, $2) => `<div style="font-size:20px;display:flex;justify-content:space-between;gap:30px;height:24px;"><div>${$1}</div><div>${$2}</div></div>`;

const getSpaceBetween3Div = ($1, $2, $3) => {
  const color = $2 - $3 > 0 ? "red" : "green";
  return `<div style="font-size:20px;display:flex;justify-content:space-between;gap:30px;height:24px;">
            <div>${$1}</div>
            <div style='width:190px;text-align:right'>${$2}/${$3}
              <div style='width:60px;display:inline-block;font-size:0.8em;color:${color}'>${$2 - $3}</div>
            </div>
          </div>`;
};

const getSpaceBetween4Div = ($1, $2, $3, $4, $5) =>
  `<div style="font-size:20px;display:flex;justify-content:space-between;align-items:center;gap:5px;height:24px;">
      <div style='width:75px;border:1px solid #409eff;padding:2px;color:#409eff;border-radius:3px;text-align:right;margin-right:20px'>${$2}</div>
      <div style='width:230px'>${$3}</div>
      <div style='width:50px;font-size:12px;text-align:right;color:#607cdd'>${$5}</div>
      <div style='width:60px;color:#409eff;border-radius:3px;text-align:right'>${$4}手</div>
      <div style='width:140px;text-align:right'>${$1}</div>
    </div>`;

const getSpaceBetween7Div = ($1, $2, $3, $4, $5, $6) => {
  const color = $1 - $6 > 0 ? "red" : "green";
  return `<div style="font-size:20px;display:flex;justify-content:space-between;align-items:center;gap:5px;height:24px;">
            <div style='width:75px;border:1px solid #409eff;padding:2px;color:#409eff;border-radius:3px;text-align:right;margin-right:20px'>${$2}</div>
            <div style='width:230px'>${$3}</div>
            <div style='width:50px;font-size:12px;text-align:right;color:#607cdd'>${$5}</div>
            <div style='width:60px;color:#409eff;border-radius:3px;text-align:right'>${$4}手</div>
            <div style='width:170px;text-align:right'>${$1}/${$6}
              <div style='width:60px;display:inline-block;font-size:0.8em;color:${color}'>${$1 - $6}</div>
            </div>
          </div>`;
};

// 桑基图配置生成（提取公共逻辑，4个图表复用）
function generateSankeyData(tableData, valueField) {
  let 沽购to正股Map = {};
  let 到日期to沽购Map = {};
  let 正股to到日期Map = {};

  // 构建映射关系
  tableData.forEach((el) => {
    const { 正股代码, 沽购, 到期日, isCombo, [valueField]: value } = el;
    if (!value || value === 0) return;

    const 组合Str = isCombo ? "[组合]" : "";
    const 月份 = dayjs(到期日).format("M月");

    // 沽购 → 正股
    const key1 = 组合Str + 正股代码 + 沽购;
    沽购to正股Map[key1] = {
      source: 沽购,
      target: 正股代码 + 组合Str,
      value: (沽购to正股Map[key1]?.value || 0) + Math.abs(value),
    };

    // 月份 → 沽购
    const key2 = 到期日 + 沽购;
    到日期to沽购Map[key2] = {
      source: 月份,
      target: 沽购 + " ",
      value: (到日期to沽购Map[key2]?.value || 0) + Math.abs(value),
    };

    // 正股 → 月份
    const key3 = 组合Str + 正股代码 + 到期日;
    正股to到日期Map[key3] = {
      source: 正股代码 + 组合Str,
      target: 月份,
      value: (正股to到日期Map[key3]?.value || 0) + Math.abs(value),
    };
  });

  return {
    沽购to正股: Object.values(沽购to正股Map).filter((el) => el.value),
    正股到日期: Object.values(正股to到日期Map).filter((el) => el.value),
    到日期to沽购: Object.values(到日期to沽购Map).filter((el) => el.value),
  };
}

function getSankeyOption({ 沽购to正股, sourceToTargetList, sumValue, title, 总和标识 = "持" }) {
  const 所有持仓期权TableData = [...(richTableData.value?.[1]?.children || []), ...(richTableData.value?.[2]?.children || []), ...(richTableData.value?.[3]?.children || [])];

  const totalData = [
    { source: "沽 ", target: 总和标识, value: 0 },
    { source: "购 ", target: 总和标识, value: 0 },
  ];

  沽购to正股.forEach((el) => {
    const idx = totalData.findIndex((item) => item.source === el.source + " ");
    if (idx >= 0) totalData[idx].value += el.value;
  });

  const finalTotalData = totalData.filter((el) => el.value);
  const colorMap = getSankeyLegenColorMap({ 总和标识 });
  const 亏损符号 = 总和标识 === "亏" ? -1 : 1;

  // 排序图例
  let dataList = [];
  sourceToTargetList.forEach((el) => {
    dataList.push(el.source, el.target);
  });
  dataList = [...new Set(dataList), 总和标识];

  const dataListSort = [..._.flattenDeep(OPTIONS_MAP.map((el) => [el.code, `${el.code}[组合]`])), "购", "购 ", "沽", "沽 ", ...deadline_list.map((el) => dayjs(el).format("M月")), 总和标识];

  dataList = dataListSort.filter((el) => dataList.includes(el));

  return {
    title: {
      text: title,
      top: 0,
      padding: [0, 0, 25, 0],
      textStyle: { fontSize: 18, fontWeight: "normal" },
    },
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove|click",
      formatter: (params) => {
        const { dataType, data, value } = params;
        const 展示字段 = { 持: "总价", 投: "总投入", 盈: "今日总涨跌", 亏: "今日总涨跌" }[总和标识];
        let list = [];
        let targetName = "";

        if (dataType === "node") {
          targetName = getStockCodeName(data.name);
          list = getFilterDataByDataName(data.name, 所有持仓期权TableData);
        } else {
          targetName = `${getStockCodeName(data.source)} > ${getStockCodeName(data.target)}`;
          list = getFilterDataByDataName(data.source, 所有持仓期权TableData);
          list = getFilterDataByDataName(data.target, list);
        }

        // 盈亏过滤
        if (总和标识 === "盈") list = list.filter((el) => el[展示字段] >= 0);
        if (总和标识 === "亏") list = list.filter((el) => el[展示字段] < 0);

        // 排序
        list = _.sortBy(list, (el) => -Math.abs(el[展示字段] || 0));

        // 生成HTML
        let listStr = list
          .map((el) => {
            const percent = formatDecimal((10000 * el[展示字段]) / _.sumBy(list, 展示字段) / 100, 1).toFixed(1) + "%";
            return 总和标识 === "投"
              ? getSpaceBetween7Div(el["总价"], percent, el["期权名称"], el["持仓"], `${el["一手价"]}/${formatDecimal(el[展示字段] / el["持仓"], 0)}`, el[展示字段])
              : getSpaceBetween4Div(el[展示字段], percent, el["期权名称"], el["持仓"], formatDecimal(el[展示字段] / el["持仓"], 0));
          })
          .join("");

        const targetValue = 亏损符号 * value;
        const bottomStr = 总和标识 === "投" ? getSpaceBetween3Div(targetName, _.sumBy(list, "总价"), targetValue) : getSpaceBetween2Div(targetName, targetValue);

        return listStr + (listStr ? "<br>" : "") + bottomStr;
      },
    },
    grid: { left: "center", top: "10%", right: "auto", bottom: "0" },
    animation: true,
    series: [
      {
        type: "sankey",
        bottom: "10%",
        draggable: false,
        layoutIterations: 0,
        emphasis: { focus: "adjacency" },
        data: dataList.map((el) => (colorMap[el] ? { name: el, itemStyle: { color: colorMap[el] } } : { name: el })),
        label: {
          show: true,
          rich: {
            a: { height: 20, color: "black", fontWeight: 600, fontSize: 14 },
            b: { color: "#4f6eda", fontWeight: 600, fontSize: 14 },
            c: { color: "#4f6eda", fontWeight: 600, fontSize: 14 },
          },
          formatter: (params) => {
            const { value, data } = params;
            const name = getStockCodeName(data.name);
            return `{a|${name}} {b|${亏损符号 * value}} {c|(${formatDecimal((100 * value) / sumValue, 1)}%)}`;
          },
        },
        links: [...sourceToTargetList, ...finalTotalData],
        lineStyle: { color: "source", curveness: 0.5 },
      },
    ],
  };
}

// 四个图表 computed（大幅简化）
const 持仓分布Option = computed(() => {
  const tableData = [...(richTableData.value?.[1]?.children || []), ...(richTableData.value?.[2]?.children || []), ...(richTableData.value?.[3]?.children || [])];
  const { 沽购to正股, 正股到日期, 到日期to沽购 } = generateSankeyData(tableData, "总价");
  return getSankeyOption({
    沽购to正股,
    sourceToTargetList: [...沽购to正股, ...正股到日期, ...到日期to沽购],
    sumValue: 持仓总价.value,
    title: "持仓分布",
    总和标识: "持",
  });
});

const 投入分布Option = computed(() => {
  const tableData = [...(richTableData.value?.[1]?.children || []), ...(richTableData.value?.[2]?.children || []), ...(richTableData.value?.[3]?.children || [])];
  const { 沽购to正股, 正股到日期, 到日期to沽购 } = generateSankeyData(tableData, "总投入");
  return getSankeyOption({
    沽购to正股,
    sourceToTargetList: [...沽购to正股, ...正股到日期, ...到日期to沽购],
    sumValue: 持仓总投入.value,
    title: "投入分布",
    总和标识: "投",
  });
});

const 盈利分布Option = computed(() => {
  const tableData = [...(richTableData.value?.[1]?.children || []), ...(richTableData.value?.[2]?.children || []), ...(richTableData.value?.[3]?.children || [])].filter((el) => el?.今日总涨跌 > 0);
  const { 沽购to正股, 正股到日期, 到日期to沽购 } = generateSankeyData(tableData, "今日总涨跌");
  return getSankeyOption({
    沽购to正股,
    sourceToTargetList: [...沽购to正股, ...正股到日期, ...到日期to沽购],
    sumValue: 持仓总价.value,
    title: "盈利分布",
    总和标识: "盈",
  });
});

const 亏损分布Option = computed(() => {
  const tableData = [...(richTableData.value?.[1]?.children || []), ...(richTableData.value?.[2]?.children || []), ...(richTableData.value?.[3]?.children || [])].filter((el) => el?.今日总涨跌 < 0);
  const { 沽购to正股, 正股到日期, 到日期to沽购 } = generateSankeyData(tableData, "今日总涨跌");
  return getSankeyOption({
    沽购to正股,
    sourceToTargetList: [...沽购to正股, ...正股到日期, ...到日期to沽购],
    sumValue: 持仓总价.value,
    title: "亏损分布",
    总和标识: "亏",
  });
});

// 无用但保留的函数
const filterHandler = () => false;
const getInRowStyle = () => ({});
</script>

<style scoped>
::v-deep(.el-table--small .cell) {
  padding: 0 !important;
}
::v-deep(.el-table--small .el-table__cell) {
  padding: 0 !important;
}
</style>

<style>
.el-progress__text {
  text-align: right;
}
.active {
  color: white;
  background-color: #409eff;
}
</style>
