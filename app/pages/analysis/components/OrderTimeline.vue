<template>
  <div>
    <el-form size="small" :model="formData" label-width="auto" label-suffix=":">
      <el-form-item label="正股">
        <TabSelectMult :options="stockOptions" v-model="formData.正股List" />
      </el-form-item>
      <el-form-item label="沽购">
        <TabSelectMult :options="['沽', '购'].map((el) => ({ label: el, value: el }))" v-model="formData.沽购List" />
      </el-form-item>
    </el-form>
  </div>
  <OrderTable :formData="formData" :orderList="curOrderList" :dayStr="dayjs().format('YYYY-MM-DD')" />
</template>
<script setup>
import { OPTIONS_MAP } from "~/data";
import dayjs from "dayjs";

const props = defineProps(["orderList", "tiledData"]);

const stockOptions = OPTIONS_MAP.map((el) => ({ label: el.name, value: el.code }));
const stockNameMap = Object.fromEntries(OPTIONS_MAP.map((el) => [el.code, el.showName]));

const tiledMap = computed(() => {
  if (!props.tiledData) return {};
  const m = {};
  for (const item of props.tiledData) {
    m[item["期权名称"]] = item["最新价"];
  }
  return m;
});

const formData = reactive({
  正股List: [...OPTIONS_MAP.map((el) => el.code)],
  沽购List: ["沽", "购"],
});

const curOrderList = computed(() => {
  const flat = (props.orderList || []).flat();
  const groups = {};
  for (const item of flat) {
    const name = item["期权名称"];
    if (!groups[name]) groups[name] = [];
    groups[name].push(item);
  }
  return Object.entries(groups).map(([期权名称, list]) => {
    let 成交金额sum = 0, 持仓变化sum = 0, 相对收盘盈亏sum = 0;
    const 收盘价 = tiledMap.value[期权名称] || 0;
    for (const item of list) {
      成交金额sum += item["持仓变化"] * item["成交价格"];
      持仓变化sum += item["持仓变化"];
      item["相对收盘盈亏"] = (收盘价 - item["成交价格"]) * item["持仓变化"] * 10000;
      相对收盘盈亏sum += item["相对收盘盈亏"];
    }
    const first = list[0];
    return {
      期权名称,
      正股代码: first["正股代码"],
      正股ShowName: stockNameMap[first["正股代码"]] || "",
      沽购: 期权名称.includes("购") ? "购" : "沽",
      list,
      成交金额sum,
      持仓变化sum,
      相对收盘盈亏sum,
    };
  });
});
</script>
