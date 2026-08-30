<template>
    <!-- 空行占位 -->
    <div v-if="false">{{ props.row }}</div>
    <!-- 分割线行 -->
    <div v-else-if="props.row._split" style="background-color: #576a8f" class="h-[10px]">&nbsp;</div>
    <!-- 当前高亮行（空白模式不显示） -->
    <!-- 期权卡片主体：空白模式不显示任何内容 -->
    <div v-else-if="!props.row?._current"
        class="p-[2px] relative flex items-center" :style="cardStyle">

    </div>
</template>

<script setup>
import dayjs from "dayjs";

// props（空白模式）
const props = defineProps(["row", "isCall", "date", "mode", "tiledData", "indexVal"]);

// 基础计算属性
const 期权名称 = computed(() => {
    const type = props.isCall ? "C" : "P";
    const month = dayjs(props.date, "YYYY-MM-DD").format("M月");
    return props.row[type + month + "期权名称"];
});
const current期权Item = computed(() => props.tiledData?.find((el) => el["期权名称"] === 期权名称.value) || {});

// 期权单项快捷取值（减少重复访问current期权Item.value）
// const optionItem = computed(() => current期权Item.value);

// 行情数值
const 一手价 = computed(() => current期权Item.value["一手价"]);

// 卡片尺寸（仅保留高度、内边距，空白模式不显示内容也不加边框/底色）
// 无一手价时置灰背景
const cardStyle = computed(() => ({
    padding: "35px 0 5px 0",
    height: "23px",
    background: 一手价.value ? "" : "rgb(235, 235, 235)",
}));
</script>

<style lang="less" scoped>
.borderRed {
    border: 1px solid red;
}

.borderGreen {
    border: 1px solid green;
}
</style>
