<template>
  <Capture title="期权列表" ref="captureRef">
    <div class="flex justify-center pb-[5px] cursor-pointer" @click="() => captureRef.download()">{{ props.dayStr }}交割单 <el-button link>⬇</el-button></div>
    <el-table style="width: 100%" :data="filterTableData" size="small" border stripe height="100%" :highlight-current-row="false" show-summary :summary-method="getSummary" :cell-style="getSpecialTimeStyle">
      <el-table-column label="期权名称" prop="期权名称" width="135" align="left" fixed="left"> </el-table-column>
      <el-table-column label="正股" prop="正股ShowName" width="60" align="center" fixed="left" />
      <el-table-column label="沽购" #default="{ row }" prop="沽购" align="center" width="30" fixed="left">
        <TagCallPut :value="row['沽购']" />
      </el-table-column>
      <el-table-column #default="{ row }" v-for="time in totalTimeList" :label="time" :prop="time" width="40" align="center">
        <div class="pb-[5px]" v-for="item in (row.list || [])?.filter((el) => isInNext5Minutes(time, el['成交时间']))">
          <!-- <div v-for="item in (row.list || [])?.filter((el) => dayjs(el['成交时间'], 'HH:mm:ss').format('HH:mm') === time)"> -->
          <div class="flex border-bottom-[1px] justify-between gap-[5px] border-[red] text-[gray] px-[2px]">
            <div>{{ item.持仓变化 }}</div>
            <div>{{ formatDecimal(item.成交价格 * 10000, 0) }}</div>
          </div>
          <div class="font-semibold">{{ formatDecimal(item.持仓变化 * item.成交价格 * 10000, 0) }}</div>
        </div>
      </el-table-column>
      <el-table-column #default="{ row }" label="总计" prop="成交金额sum" width="50" align="center" fixed="right">
        <div class="px-[2px] mx-auto pb-[5px]">
          <div class="text-[gray] text-center">{{ row.持仓变化sum }}</div>
          <div class="text-center font-semibold">{{ formatDecimal(row.成交金额sum * 10000, 0) }}</div>
        </div>
      </el-table-column>
    </el-table>
  </Capture>
</template>
<script setup>
import { formatNumberToWan, formatDecimal } from "~/utils/utils";
import { OPTIONS_MAP, deadline_list } from "~/data";
import dayjs from "dayjs";
import _ from "lodash";
const captureRef = ref(null);
/**
 * 生成指定时间段内每隔1分钟的时间数组
 * @param {string} start - 开始时间，如 '09:30'
 * @param {string} end - 结束时间，如 '11:30'
 * @returns {string[]} 时间数组，格式 ['09:30', '09:31', ...]
 */
function generateMinuteList(start, end) {
  const result = [];

  // 解析开始时间（无需插件）
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  let current = dayjs().startOf("day").hour(startHour).minute(startMinute);

  const endTime = dayjs().startOf("day").hour(endHour).minute(endMinute);

  // 循环生成每分钟
  while (current.isBefore(endTime) || current.isSame(endTime)) {
    result.push(current.format("HH:mm"));
    current = current.add(1, "minute");
  }

  return result;
}
// 判断是否是整点/半点（9:30/10:00/10:30...），并返回样式
const getSpecialTimeStyle = (data) => {
  const { column } = data;
  if (!column) return {};
  const minute = column.property.split(":")?.[1];
  // 分钟是 00 或 30 → 蓝色背景
  if (minute === "00" || minute === "30") {
    return { backgroundColor: "#e8f3ff" }; // 浅蓝底+蓝色字
  }
  return {};
};

// 生成时间段内 每隔5分钟 的时间数组
function generateTimeList(start, end) {
  const result = [];
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  // 初始化时间
  let current = dayjs().startOf("day").hour(startHour).minute(startMinute);

  const endTime = dayjs().startOf("day").hour(endHour).minute(endMinute);

  // 循环：每次 +5 分钟
  while (current.isBefore(endTime) || current.isSame(endTime)) {
    result.push(current.format("HH:mm"));
    current = current.add(5, "minute");
  }

  return result;
}

/**
 * 判断 checkTime 是否在 targetTime 之后的5分钟内（左闭右开）
 * @param {string} targetTime - 目标时间 HH:mm
 * @param {string} checkTime - 要检查的时间 HH:mm:ss
 * @returns {boolean}
 */
function isInNext5Minutes(targetTime, checkTime) {
  const base = dayjs().startOf("day");

  // 解析目标时间（时分）
  const [tH, tM] = targetTime.split(":").map(Number);
  const target = base.hour(tH).minute(tM).second(0);

  // 解析检查时间（时分秒）
  const [cH, cM, cS] = checkTime.split(":").map(Number);
  const check = base.hour(cH).minute(cM).second(cS);

  // 结束时间 = 目标 +5分钟
  const end = target.add(5, "minute");

  // 左闭右开：check >= target 且 check < end
  return (check.isSame(target) || check.isAfter(target)) && check.isBefore(end);
}

const props = defineProps(["orderList", "dayStr", "formData"]);

// 过滤与校验
const filterTableData = computed(() => {
  return (
    props.orderList
      .filter((el) => props.formData.正股List.includes(el["正股代码"]))
      // .filter((el) => formData.到期日List.includes(el["到期日"]))
      .filter((el) => props.formData.沽购List.includes(el["沽购"]))
  );
});

// 生成你需要的两个时间段
const morningList = generateTimeList("09:30", "11:30");
const afternoonList = generateTimeList("13:00", "15:00");

// 合并成一个完整数组（按需使用）
const totalTimeList = ref([...morningList, ...afternoonList]);

// 通用合计方法（永远不用改）
const getSummary = ({ columns, data }) => {
  // const summaryProps = props.showHold ? ["今日总涨跌", "单日总损耗", "总盈亏", "仓位", "持仓", "持仓金额变化"] : ["持仓金额变化"];
  return columns.map((col, index) => {
    // 第一列显示“合计”
    if (index === 0) return "合计";
    // 当前列在合计列表里 → 求和
    if (col.property.includes(":")) {
      let sum = 0;
      data.forEach((row) => {
        row.list.forEach((order) => {
          if (isInNext5Minutes(col.property, order["成交时间"])) {
            sum += order["持仓变化"] * order["成交价格"] * 10000;
          }
        });
      });
      if (sum) return formatDecimal(sum, 0);
      return "";
    }
    if (col.property === "成交金额sum") {
      let sum = 0;
      data.forEach((row) => {
        row.list.forEach((order) => {
          sum += order["持仓变化"] * order["成交价格"] * 10000;
        });
      });
      if (sum) return formatDecimal(sum, 0);
      return "";
    }

    // 不在列表 → 空
    return "";
  });
};
</script>
