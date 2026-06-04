<template>
  <div>
    <el-form size="small" :model="formData" label-width="auto" label-suffix=":">
      <el-form-item label="正股">
        <TabSelectMult :options="stockOptions" v-model="formData.正股List" />
      </el-form-item>
      <el-form-item label="到期日">
        <TabSelectMult :options="deadline_list.map((el) => ({ label: el, value: el }))" v-model="formData.到期日List" />
      </el-form-item>
    </el-form>
  </div>
  <div class="mx-auto overflow-x-auto">
    <el-table :data="props.orderList" size="small" border stripe height="100%" :highlight-current-row="false">
      <el-table-column label="期权名称" prop="期权名称" width="140" align="left" fixed="left" />
      <el-table-column #default="{ row }" v-for="time in totalTimeList" :label="time" :prop="time" width="50" align="center">
        <div v-for="item in (row.list || [])?.filter((el) => dayjs(el['成交时间'], 'HH:mm:ss').format('HH:mm') === time)">
          <div class="flex border-bottom-[1px] justify-between gap-[5px] border-[red]">
            <div>{{ item.持仓变化 }}</div>
            <div>{{ item.成交价格 * 10000 }}</div>
          </div>
          <div>{{ item.持仓变化 * item.成交价格 * 10000 }}</div>
        </div>
      </el-table-column>
    </el-table>
  </div>
</template>
<script setup>
import { formatNumberToWan, formatDecimal } from "~/utils/utils";
import { OPTIONS_MAP, deadline_list } from "~/data";
import dayjs from "dayjs";
import _ from "lodash";

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

const props = defineProps(["orderList"]);
const stockOptions = OPTIONS_MAP.map((el) => ({
  label: el.name,
  value: el.code,
}));

const formData = reactive({
  正股List: [...OPTIONS_MAP.map((el) => el.code)],
  到期日List: [...deadline_list],
});

// 生成你需要的两个时间段
const morningList = generateMinuteList("09:30", "11:30");
const afternoonList = generateMinuteList("13:00", "15:00");

// 合并成一个完整数组（按需使用）
const totalTimeList = ref([...morningList, ...afternoonList]);
</script>
