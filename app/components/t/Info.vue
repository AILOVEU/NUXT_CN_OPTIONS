<template>
  <div
    class="grid grid-cols-2 gap-[3px]"
    v-if="!props.row?._split && !props.row?._current"
  >
    <div>
      <IvTag :隐波="隐波" :正股代码="正股代码" />
    </div>
    <div>
      <DeltaTag :Delta="Delta" :正股代码="正股代码" />
    </div>
    <div>
      <PremiumTag :溢价率="溢价率" :正股代码="正股代码" />
    </div>
    <div>
      <LeverageTag :杠杆="杠杆" :正股代码="正股代码" />
    </div>
  </div>
</template>
<script setup>
import DeltaTag from "~/components/tag/DeltaTag.vue";
import IvTag from "~/components/tag/IvTag.vue";
import PremiumTag from "~/components/tag/PremiumTag.vue";
import LeverageTag from "~/components/tag/LeverageTag.vue";

const props = defineProps(["row", "isCall"]);
const callOrPut = computed(() => {
  return props.isCall ? "C" : "P";
});
const 正股代码 = computed(() => {
  return props.row["正股代码"];
});
const 隐波 = computed(() => {
  return props.row[callOrPut.value + "隐波"];
});
const Delta = computed(() => {
  return props.row[callOrPut.value + "Delta"];
});
const 溢价率 = computed(() => {
  return props.row[callOrPut.value + "溢价率"];
});
const 杠杆 = computed(() => {
  return props.row[callOrPut.value + "杠杆"];
});
</script>
