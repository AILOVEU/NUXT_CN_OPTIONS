<template>
    <div>{{正股}}</div>
    <div>{{到期日}}{{行权价}}</div>
</template>
<script setup>
import dayjs from 'dayjs'
import { stock_name_map, deadline_map } from "~/data";
const props = defineProps(["row"]);

const 正股 = computed(() => {
  return stock_name_map[props.row["正股"]];
});
const 到期日 = computed(() => {
  const month = dayjs(props.row["到期日"] + '', "YYYYMMDD").format("MM");
  return deadline_map[month];
});
const 行权价 = computed(() => {
  return props.row["行权价"] * 1000;
});
</script>
