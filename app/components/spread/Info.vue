<template>
  <div class="p-[2px] h-[64px] relative">
    <!-- <div class="flex justify-between whitespace-nowrap">
      <div class="whitespace-nowrap">
        <IvTag :隐波="隐波" :正股="正股代码" />
      </div>
      <div class="whitespace-nowrap">
        <DeltaTag :Delta="Delta" :正股="正股代码" />
      </div>
    </div> -->
    <div class="absolute top-0 right-0 bg-[red] rounded-[50%] h-[16px] leading-[16px] text-[white] font-semibold px-[4px]" v-if="组合Flag">
      {{ 组合Flag }}
    </div>
    <div v-if="spread期权Item && show">
      <div class="text-[gray]">
        <div class="mx-auto">
          {{ dayjs(current期权Item?.["到期日"], "YYYYMMDD").format("M月") }}&nbsp; {{ current期权Item?.["行权价"] * 1000 }}&nbsp;&nbsp;{{ spread期权Item?.["行权价"] * 1000 }}&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
        <div class="mx-auto">Delta {{ current期权Item?.["Delta"] }}&nbsp;&nbsp;&nbsp;{{ spread期权Item?.["Delta"] }}</div>
        <div class="mx-auto">隐波 {{ current期权Item?.["隐波"] }}&nbsp;&nbsp;&nbsp;{{ spread期权Item?.["隐波"] }}</div>
      </div>
      <div class="mx-auto w-full mt-[3px] flex gap-[4px] items-center justify-around">
        <div>
          {{ toPrice(current期权Item?.["卖一"]) }}
        </div>
        <DiffPriceTag :current期权Item="current期权Item" :spread期权Item="spread期权Item" :diffValue="props.diffValue" />
        <div>
          {{ toPrice(spread期权Item?.["买一"]) }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import dayjs from "dayjs";
import { toPrice } from "~//utils";
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

const spread期权名称 = computed(() => {
  const diff = props.isCall ? props.diffValue : -props.diffValue;
  const spread行权价 = 行权价.value * 1000 + diff;
  return 期权名称.value?.replace(行权价.value * 1000 + "", spread行权价 + "");
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
  if (is50Multiple(current期权Item.value["行权价"] * 1000) && is50Multiple(spread期权Item.value["行权价"] * 1000)) {
    return false;
  }
  if (spread期权Item.value["一手价"] < 100) {
    return false;
  }
  if (current期权Item.value["行权价"] * 1000 < 5000 && props.diffValue === 250) return false;
  return true;
});

const 组合Flag = computed(() => {
  if (!spread期权Item.value) return "";
  const current期权Option = current期权Item.value["期权名称"];
  const spread期权Option = spread期权Item.value["期权名称"];
  const target = props.combo_list.find(([权利期权Option, 义务期权Option, 组合持仓]) => current期权Option === 权利期权Option && spread期权Option === 义务期权Option);
  return target?.[2];
});
</script>
