<template>
  <div>时间价值收益：{{ 时间价值收益.value }}</div>
  <div v-for="item in 时间价值收益.list" class="grid grid-cols-3 gap-[50px]">
    <div>{{ item["期权名称"] }}</div>
    <div>*{{ item["持仓"] }}</div>
    <div>
      {{ item["最新价"] }}(时间:{{ item["时间价值"] }} 内在:{{
        item["内在价值"]
      }})
    </div>
  </div>
  <div>xxx</div>
  <div>时间价值损耗：{{ 时间价值损耗.value }}</div>
  <div v-for="item in 时间价值损耗.list" class="grid grid-cols-3 gap-[50px]">
    <div>{{ item["期权名称"] }}</div>
    <div>*{{ item["持仓"] }}</div>
    <div>
      {{ item["最新价"] }}(时间:{{ item["时间价值"] }} 内在:{{
        item["内在价值"]
      }})
    </div>
  </div>
  {{ 剩余List.map((el) => el["期权名称"]) }}
</template>

<script setup>
import { UNIT } from "~/data";
const props = defineProps(["all_data"]);
const 时间价值收益 = computed(() => {
  const 时间价值收益List = props.all_data
    .filter((el) => el["持仓"])
    .filter((el) => el["持仓"] < 0 || el["内在价值"] > 0);
  let value = 0;
  时间价值收益List.forEach((el) => {
    value += el["时间价值"] * UNIT * el["持仓"];
  });
  return { list: 时间价值收益List, value: Math.floor(value) };
});
const 时间价值损耗 = computed(() => {
  const 时间价值收益List = props.all_data
    .filter((el) => el["持仓"] > 0)
    .filter((el) => !el["内在价值"]);
  let value = 0;
  时间价值收益List.forEach((el) => {
    value += el["时间价值"] * UNIT * el["持仓"];
  });
  return { list: 时间价值收益List, value: Math.floor(value) };
});
const 剩余List = computed(() => {
  const list = props.all_data
    .filter((el) => el["持仓"])
    .filter((el) => {
      !时间价值收益.value.list.some(
        (item) => item["期权名称"] === el["期权名称"]
      );
    })
    .filter((el) => {
      !时间价值损耗.value.list.some(
        (item) => item["期权名称"] === el["期权名称"]
      );
    });
  return list;
});
function get时间价值收益() {}
</script>
