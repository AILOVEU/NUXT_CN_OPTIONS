<template>
  <div v-if="props.row._split" style="background-color: black">&nbsp;</div>
  <div v-else-if="props.row._current" style="background-color: #e5effe">&nbsp;</div>
  <div v-else-if="spread期权Item && show" class="p-[2px] h-[105px] flex flex-col justify-center relative px-[4px] mx-auto">
    <div class="absolute top-0 left-[2px] bg-[red] rounded-[50%] h-[16px] leading-[16px] text-[white] font-semibold px-[4px]" v-if="组合Flag">
      {{ 组合Flag }}
    </div>
    <div v-if="一手组合涨跌价" class="absolute top-[2px] right-[2px] rounded-[5px] h-[16px] leading-[16px] bg-[white] font-[600] px-[4px]" :style="{ color: 一手组合涨跌价 > 0 ? 'red' : 'green' }">
      {{ 一手组合涨跌价 > 0 ? "涨" : "跌" }}:
      {{ 一手组合涨跌价 > 0 ? "↑ " + 一手组合涨跌价 : "↓ " + Math.abs(一手组合涨跌价) }}
    </div>
    <div class="absolute bottom-[2px] left-[2px] rounded-[5px] h-[16px] leading-[16px] bg-[white] font-[600] px-[4px]">买:{{ current期权Item?.["一手卖一价"] }}</div>
    <div class="absolute bottom-[2px] right-[2px] rounded-[5px] h-[16px] leading-[16px] bg-[white] font-[600] px-[4px]">卖:{{ spread期权Item?.["一手买一价"] }}</div>
    <div class="mx-auto w-full flex gap-[4px] items-center justify-around">
      <DiffPriceTag :current期权Item="current期权Item" :spread期权Item="spread期权Item" :diffValue="props.diffValue" />
    </div>
    <div class="text-[gray] mb-[5px]">
      <div class="mx-auto">
        {{ dayjs(current期权Item?.["到期日"], "YYYYMMDD").format("M月") }}&nbsp; {{ current期权Item?.["千行权价"] }}&nbsp;&nbsp;{{ spread期权Item?.["千行权价"] }}&nbsp;&nbsp;&nbsp;&nbsp;
      </div>
      <div class="mx-auto">Delta {{ current期权Item?.["Delta"] }}&nbsp;&nbsp;&nbsp;{{ spread期权Item?.["Delta"] }}</div>
      <div class="mx-auto">隐波 {{ current期权Item?.["隐波"] }}&nbsp;&nbsp;&nbsp;{{ spread期权Item?.["隐波"] }}</div>
    </div>
  </div>
</template>
<script setup>
import dayjs from "dayjs";
import DiffPriceTag from "~/components/tag/DiffPriceTag.vue";

const props = defineProps(["row", "isCall", "date", "tiledData", "diffValue", "combo_list"]);
const prefixKey = computed(() => {
  const type = props.isCall ? "C" : "P";
  const month = dayjs(props.date, "YYYYMMDD").format("M月");
  return type + month;
});
const 期权名称 = computed(() => {
  return props.row[prefixKey.value + "期权名称"];
});
const 行权价 = computed(() => {
  return props.row["行权价"];
});
const 千行权价 = computed(() => {
  return props.row["千行权价"];
});

const spread期权名称 = computed(() => {
  const diff = props.isCall ? props.diffValue : -props.diffValue;
  const spread千行权价 = 千行权价.value + diff;
  return 期权名称.value?.replace(千行权价.value + "", spread千行权价 + "");
});

const spread期权Item = computed(() => {
  return props.tiledData?.find((el) => el["期权名称"] === spread期权名称.value);
});

const current期权Item = computed(() => {
  return props.tiledData?.find((el) => el["期权名称"] === 期权名称.value);
});

function is50Multiple(val) {
  return val % 100 === 50;
}
const show = computed(() => {
  if (is50Multiple(current期权Item.value["千行权价"]) && is50Multiple(spread期权Item.value["千行权价"])) {
    return false;
  }
  if (spread期权Item.value["一手价"] < 100) {
    return false;
  }
  if (current期权Item.value["千行权价"] < 5000 && props.diffValue === 250) return false;
  return true;
});

const 组合Flag = computed(() => {
  if (!spread期权Item.value) return "";
  const current期权Name = current期权Item.value["期权名称"];
  const spread期权Name = spread期权Item.value["期权名称"];
  const target = props.combo_list.find(([权利期权Option, 义务期权Option, 组合持仓]) => current期权Name === 权利期权Option && spread期权Name === 义务期权Option);
  return target?.[2];
});

const 一手组合涨跌价 = computed(() => {
  if (!spread期权Item.value) return "";
  return current期权Item.value["一手涨跌价"] - spread期权Item.value["一手涨跌价"];
});
</script>
