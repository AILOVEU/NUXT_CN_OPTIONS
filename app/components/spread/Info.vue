<template>
  <div class="p-[2px] h-[64px]">
    <!-- <div class="flex justify-between whitespace-nowrap">
      <div class="whitespace-nowrap">
        <IvTag :隐波="隐波" :正股="正股代码" />
      </div>
      <div class="whitespace-nowrap">
        <DeltaTag :Delta="Delta" :正股="正股代码" />
      </div>
    </div> -->
    <div v-if="spread期权Item && show">
      <div class="text-[gray]">
        <div class="mx-auto">
          {{ current期权Item?.["行权价"] * 1000 }}&nbsp;&nbsp;&nbsp;{{
            spread期权Item?.["行权价"] * 1000
          }}
        </div>
        <div class="mx-auto">
          δ {{ current期权Item?.["Delta"] }}&nbsp;&nbsp;&nbsp;{{
            spread期权Item?.["Delta"]
          }}
        </div>
        <div class="mx-auto">
          Iv {{ current期权Item?.["隐波"] }}&nbsp;&nbsp;&nbsp;{{
            spread期权Item?.["隐波"]
          }}
        </div>
      </div>
      <div
        class="mx-auto w-full mt-[6px] flex gap-[4px] items-center justify-around"
      >
        <div>
          {{ Math.floor(current期权Item?.["卖一"] * UNIT) }}
        </div>
        <DiffPriceTag
          :最新价="
            toFixed(
              current期权Item?.['卖一'] * UNIT -
                spread期权Item?.['买一'] * UNIT,
              0
            )
          "
          :diffValue="props.diffValue"
        />
        <div>
          {{ Math.floor(spread期权Item?.["买一"] * UNIT) }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import dayjs from "dayjs";
import { UNIT } from "~/data";
import { getColorSplitHander, toFixed } from "~//utils";
import DiffPriceTag from "~/components/tag/DiffPriceTag.vue";
import IvTag from "~/components/tag/IvTag.vue";
import DeltaTag from "~/components/tag/DeltaTag.vue";

const props = defineProps(["row", "isCall", "date", "tiledData", "diffValue"]);
const prefixKey = computed(() => {
  const type = props.isCall ? "C" : "P";
  const month = dayjs(props.date, "YYYYMMDD").format("M月");
  return type + month;
});
const 期权名称 = computed(() => {
  console.log(" props.row", props.row);
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

const greenColorHandler = getColorSplitHander("#F0FFF0", "#006400");
const redColorHandler = getColorSplitHander("#FFE4E1", "#FF0000");

const style = computed(() => {
  if (持仓.value > 0)
    return {
      border: "2px solid red",
      backgroundColor: redColorHandler(Math.abs(仓位占比.value * 2)),
    };
  if (持仓.value < 0) {
    return {
      border: "2px solid green",
      backgroundColor: greenColorHandler(Math.abs(仓位占比.value * 2)),
    };
  }

  return {};
});
function is50Multiple(val) {
  return val % 100 === 50;
}
const show = computed(() => {
  if (
    is50Multiple(current期权Item.value["行权价"] * 1000) &&
    is50Multiple(spread期权Item.value["行权价"] * 1000)
  ) {
    return false;
  }
  if (spread期权Item.value["最新价"] < 0.01) {
    return false;
  }
  if (current期权Item.value["行权价"] * 1000 < 5000 && props.diffValue === 250)
    return false;
  return true;
});
</script>
