<template>
    <!-- 分割线行 -->
    <div v-if="props.row._split" style="background-color: #576a8f" class="h-[10px]">&nbsp;</div>
    <!-- 空白模式：仅占位，不显示任何内容（当前高亮行不渲染） -->
    <div v-else-if="!props.row?._current" class="p-[2px] relative flex items-center" :style="cardStyle"></div>
</template>

<script setup>
import dayjs from "dayjs";

const props = defineProps(["row", "isCall", "date", "tiledData"]);

// 期权名称（与当前 stockindex Info 字段保持一致：YY年M月）
const 期权名称 = computed(() => {
    const type = props.isCall ? "C" : "P";
    const month = dayjs(props.date, "YYYY-MM-DD").format("YY年M月");
    return props.row[type + month + "期权名称"];
});
const current期权Item = computed(() => {
    return props.tiledData?.find((el) => el["期权名称"] === 期权名称.value) || {};
});

const 一手价 = computed(() => current期权Item.value["一手价"]);

// 空白模式：仅保留高度与内边距，不显示内容；无一手价时浅灰背景
const cardStyle = computed(() => ({
    padding: "35px 0 5px 0",
    height: "23px",
    background: 一手价.value ? "" : "rgb(235, 235, 235)",
}));
</script>
