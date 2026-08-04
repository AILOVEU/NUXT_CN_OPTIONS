<template>
  <Capture :title="props.dayStr + '交割单'" ref="captureRef">
    <div class="flex justify-center pb-[5px] cursor-pointer" @click="() => captureRef.download()">{{ props.dayStr }}交割单 <el-button link>⬇</el-button></div>
    <TabSelect :options="intervalOptions" v-model="timeInterval" class="mb-2" />
    <el-table style="width: 100%" :data="filterTableData" size="small" border stripe height="100%" :highlight-current-row="false" show-summary :summary-method="getSummary" :cell-style="getSpecialTimeStyle">
      <el-table-column label="期权名称" prop="期权名称" width="135" align="left" fixed="left"> </el-table-column>
      <el-table-column label="正股" prop="正股ShowName" width="60" align="center" fixed="left" />
      <el-table-column label="沽购" #default="{ row }" prop="沽购" align="center" width="30" fixed="left">
        <TagCallPut :value="row['沽购']" />
      </el-table-column>
      <el-table-column #default="{ row }" v-for="time in totalTimeList" :label="time" :prop="time" width="40" align="center">
        <div class="pb-[5px]" v-for="item in (row.list || [])?.filter((el) => isInNextNMinutes(time, el['成交时间'], timeInterval))">
          <div class="flex border-bottom-[1px] justify-between gap-[5px] border-[red] text-[gray] px-[2px]">
            <div>{{ item.持仓变化 }}</div>
            <div>{{ formatDecimal(item.成交价格 * 10000, 0) }}</div>
          </div>
          <div class="font-semibold">{{ formatDecimal(item.持仓变化 * item.成交价格 * 10000, 0) }}</div>
          <div :class="item['相对收盘盈亏'] >= 0 ? 'text-[#e02020]' : 'text-[green]'" class="text-[13px] font-medium">
            {{ formatDecimal(item['相对收盘盈亏'], 0) }}
          </div>
        </div>
      </el-table-column>
      <el-table-column #default="{ row }" label="总计" prop="成交金额sum" width="50" align="center" fixed="right">
        <div class="px-[2px] mx-auto pb-[5px]">
          <div class="text-[gray] text-center">{{ row.持仓变化sum }}</div>
          <div class="text-center font-semibold">{{ formatDecimal(row.成交金额sum * 10000, 0) }}</div>
          <div :class="row['相对收盘盈亏sum'] >= 0 ? 'text-[#e02020]' : 'text-[green]'" class="text-[13px] text-center font-medium">
            {{ formatDecimal(row['相对收盘盈亏sum'], 0) }}
          </div>
        </div>
      </el-table-column>
    </el-table>
  </Capture>
</template>
<script setup>
import { h } from "vue";
import {  formatDecimal } from "~/utils/utils";
import TabSelect from "~/components/TabSelect.vue";
import dayjs from "dayjs";
import _ from "lodash";
const captureRef = ref(null);

// 时间间隔选项
const intervalOptions = [
  { value: 1, label: "1分钟" },
  { value: 3, label: "3分钟" },
  { value: 5, label: "5分钟" },
  { value: 10, label: "10分钟" },
  { value: 15, label: "15分钟" },
  { value: 30, label: "30分钟" },
  { value: 60, label: "60分钟" },
];
const timeInterval = ref(5);
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

// 生成时间段内 每隔N分钟 的时间数组
function generateTimeList(start, end, interval = 5) {
  const result = [];
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  // 初始化时间
  let current = dayjs().startOf("day").hour(startHour).minute(startMinute);

  const endTime = dayjs().startOf("day").hour(endHour).minute(endMinute);

  // 循环：每次 +N 分钟
  while (current.isBefore(endTime) || current.isSame(endTime)) {
    result.push(current.format("HH:mm"));
    current = current.add(interval, "minute");
  }

  return result;
}

/**
 * 判断 checkTime 是否在 targetTime 之后的 N 分钟内（左闭右开）
 * @param {string} targetTime - 目标时间 HH:mm
 * @param {string} checkTime - 要检查的时间 HH:mm:ss
 * @param {number} interval - 间隔分钟数
 * @returns {boolean}
 */
function isInNextNMinutes(targetTime, checkTime, interval = 5) {
  const base = dayjs().startOf("day");

  // 解析目标时间（时分）
  const [tH, tM] = targetTime.split(":").map(Number);
  const target = base.hour(tH).minute(tM).second(0);

  // 解析检查时间（时分秒）
  const [cH, cM, cS] = checkTime.split(":").map(Number);
  const check = base.hour(cH).minute(cM).second(cS);

  // 结束时间 = 目标 +N 分钟
  const end = target.add(interval, "minute");

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

// 合并成一个完整数组（按需使用）
const totalTimeList = computed(() => [
  ...generateTimeList("09:30", "11:30", timeInterval.value),
  ...generateTimeList("13:00", "15:00", timeInterval.value),
]);

// 通用合计方法（永远不用改）
const getSummary = ({ columns, data }) => {
  return columns.map((col, index) => {
    if (index === 0) return "合计";
    if (col.property.includes(":")) {
      let sum = 0, pnlSum = 0;
      data.forEach((row) => {
        row.list.forEach((order) => {
          if (isInNextNMinutes(col.property, order["成交时间"], timeInterval.value)) {
            sum += order["持仓变化"] * order["成交价格"] * 10000;
            pnlSum += order["相对收盘盈亏"] || 0;
          }
        });
      });
      if (sum || pnlSum) {
        return h('div', [
          h('div', { class: 'font-semibold' }, formatDecimal(sum, 0)),
          h('div', {
            class: ['text-[13px] font-medium', pnlSum >= 0 ? 'text-[#e02020]' : 'text-[green]']
          }, formatDecimal(pnlSum, 0))
        ]);
      }
      return "";
    }
    if (col.property === "成交金额sum") {
      let sum = 0, pnlSum = 0;
      data.forEach((row) => {
        row.list.forEach((order) => {
          sum += order["持仓变化"] * order["成交价格"] * 10000;
          pnlSum += order["相对收盘盈亏"] || 0;
        });
      });
      if (sum || pnlSum) {
        return h('div', [
          h('div', { class: 'font-semibold' }, formatDecimal(sum, 0)),
          h('div', {
            class: ['text-[13px] font-medium', pnlSum >= 0 ? 'text-[#e02020]' : 'text-[green]']
          }, formatDecimal(pnlSum, 0))
        ]);
      }
      return "";
    }
    return "";
  });
};
</script>
