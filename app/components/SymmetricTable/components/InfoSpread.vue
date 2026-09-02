<template>
    <div v-if="false">{{ props.row }}</div>
    <!-- 分割线行 -->
    <div v-else-if="props.row._split" style="background-color: #576a8f" class="h-[10px]">&nbsp;</div>
    <!-- 当前高亮行（跨市模式不显示） -->
    <!-- 期权卡片主体：命中跨市组合时展示组合信息，否则保持空白占位 -->
    <div v-else-if="!props.row?._current" class="p-[2px] relative flex flex-col items-center justify-center gap-[2px]"
        :style="cardStyle">
        <!-- 跨市组合：同一期权可能属于多个组合，命中的每个组合各显示一个 tag -->
        <!-- => 两边各一个 div（左：成本价 手数；右：目标价格与 1.5 倍目标价格），同行不换行；组合配色直接写在两个 div 上 -->
        <div v-for="item in 组合项列表" :key="item.key"
            class="inline-flex items-center gap-[2px] text-[14px] leading-[22px] pb-[4px] whitespace-nowrap"
            :style="item.组合边框样式">
            <div class="rounded-[3px] px-[4px]">{{ 一手价 }}</div>

            <!-- <div class="rounded-[3px] px-[4px] text-[12px]"> {{ item.目标价格 * item.手数 }} </div> -->
            <div class="rounded-[3px] px-[4px]" :style="item.样式">{{ item.成本价 }} {{ item.手数 }}
            </div>
            <div class="text-[11px]">=></div>
            <div class="rounded-[3px] px-[4px]" :style="item.目标价格样式">{{ formatDecimal(item.目标价格, 0) }} * {{
                Math.ceil(item.手数 / 3) }}</div>
            <div class="rounded-[3px] px-[4px]" :style="item.目标价格15倍样式"> {{
                formatDecimal(item.目标价格15倍, 0) }} * {{ Math.ceil(item.手数 / 3) }}</div>
            <div class="rounded-[3px] px-[4px]" :style="item.盈亏样式">{{ item.盈亏 }}</div>
        </div>
    </div>
</template>

<script setup>
import dayjs from "dayjs";
import { SPREAD_DATA } from "~/data/spread.js";
import { formatDecimal } from "~/utils/utils.js";

// props（跨市模式，结构同 InfoBlank）
const props = defineProps(["row", "isCall", "date", "tiledData", "indexVal"]);

// 期权名称（与 SymmetricTable 数据 key 格式保持一致：M月）
const 期权名称 = computed(() => {
    const type = props.isCall ? "C" : "P";
    const month = dayjs(props.date, "YYYY-MM-DD").format("M月");
    return props.row[type + month + "期权名称"];
});
const current期权Item = computed(() => props.tiledData?.find((el) => el["期权名称"] === 期权名称.value) || {});

// 行情数值
const 一手价 = computed(() => current期权Item.value["一手价"]);

// 置灰样式：第四/第五字段有值时，对应块用灰色替代组合配色
const 置灰样式 = {
    background: "rgb(235, 235, 235)",
    border: "1px solid #aaaaaa",
    color: "gray",
    paddingBottom: '3px'
};

// 白色样式：第五字段有值时，除置灰块以外的其他块转为白底
const 白色样式 = {
    background: "white",
    border: "1px solid #dddddd",
    // color: "#333333",
    paddingBottom: "3px",
};

// 字号放大：当前基础字号 20px（外层 text-[20px]），放大 1.25 倍为 25px
const 放大字号 = "25px";

// 字段是否有值（非空：排除 null / undefined / 空字符串）
function 有值(val) {
    return val != null && val !== "";
}

// 当前单元格命中的全部组合项（同一个期权可同时属于多个组合，需全部展示）
// SPREAD_DATA：多条组合，每条为 [认购, 认沽] 两项；单项为 [期权名称, 成本价, 手数, 字段4, 字段5]
// 第四字段有值 -> 目标价格块置灰；第五字段有值 -> 1.5 倍目标价格块置灰
const 组合项列表 = computed(() => {
    const name = 期权名称.value;
    if (!name) return [];
    const list = [];
    SPREAD_DATA.forEach((group, index) => {
        // 该组合中对应当前期权的那一腿
        const leg = group.find((item) => item[0] === name);
        if (!leg) return;
        const 手数 = leg[2];
        // 该组合总成本 = 各腿（成本价 * 手数）之和
        const 总成本 = group.reduce((sum, item) => sum + item[1] * item[2], 0);
        // 目标价格 = 该组合总成本 / 该组合中该期权的手数
        const 目标价格 = 手数 ? 保留两位(总成本 * 1 / 手数) : 0;
        // 组合维度：任一项第五字段有值即生效，保证同一组合的认购/认沽同时变化
        const 组合有第五字段 = group.some((l) => 有值(l[4]));
        // 第五字段（leg[4]）有值：该组合已平仓，隐藏整个组合（含同组合另一端）
        if (组合有第五字段) return;
        // 各块基础样式（不含字号放大）
        const 目标价格基础 = 有值(leg[3]) ? 置灰样式 : 组合有第五字段 ? 白色样式 : 组合颜色(index);
        const 目标价格15倍基础 = 有值(leg[4]) ? 置灰样式 : 组合有第五字段 ? 白色样式 : 组合颜色(index);
        // 字号放大：第四字段无值 -> 放大目标价格块；第四字段有值且第五字段无值 -> 放大 1.5 倍块；其余情况不变
        // 第五字段有值时取消放大，且按组合维度判断，保证该组合两项都不放大
        const 放大目标价格 = !有值(leg[3]) && !组合有第五字段;
        const 放大目标价格15倍 = 有值(leg[3]) && !有值(leg[4]) && !组合有第五字段;
        // 盈亏：第四字段（leg[3]）有值表示已按目标价格平仓，按 (目标价格 - 成本价) * 平仓手数 计算；否则按当前一手价浮动盈亏
        const 已平仓 = 有值(leg[3]);
        const 盈亏值 = 已平仓
            ? (目标价格 - leg[1]) * leg[3]
            : (一手价.value - leg[1]) * 手数;
        const 盈亏样式 = { color: 盈亏值 > 0 ? "red" : "green" };
        list.push({
            key: index,
            成本价: leg[1],
            手数: 手数,
            目标价格: 目标价格,
            目标价格15倍: 保留两位((目标价格 * 3) / 2),
            盈亏: 盈亏值,
            盈亏样式: 盈亏样式,
            // 第五字段有值：未被置灰的其他块转为白底
            样式: 组合有第五字段 ? 白色样式 : 组合颜色(index),
            // 第四、第五字段有值时对应块置灰（置灰逻辑不变），其余按是否命中第五字段取白底或组合配色
            目标价格样式: 放大目标价格 ? { ...目标价格基础, fontSize: 放大字号 } : 目标价格基础,
            目标价格15倍样式: 放大目标价格15倍 ? { ...目标价格15倍基础, fontSize: 放大字号 } : 目标价格15倍基础,
            // 第五字段有值时，该组合两项都用 2px 边框 + 2px 内边距包裹，边框取该组合的颜色
            组合边框样式: 组合有第五字段
                ? { border: "2px solid hsl(" + 组合色相(index) + ", 65%, 55%)", padding: "2px" }
                : {},
        });
    });
    return list;
});

// 组合色相：由组合下标生成（黄金角分布，色相分散），保证同一组合的认购/认沽一致
function 组合色相(index) {
    return Math.round((index * 137.508) % 360);
}

// 组合配色：由组合下标生成稳定色相（黄金角分布），同一组合的认购/认沽颜色一致
function 组合颜色(index) {
    const hue = 组合色相(index);
    return {
        background: "hsl(" + hue + ", 70%, 86%)",
        border: "1px solid hsl(" + hue + ", 65%, 55%)",
        color: "hsl(" + hue + ", 70%, 25%)",
        paddingBottom: '3px'
    };
}

// 卡片尺寸：命中组合时按 tag 数量自适应（最低 70px）；无组合项时以 100px 为最小高度占位
// 无一手价时置灰背景
const cardStyle = computed(() => {
    const background = 一手价.value ? "" : "rgb(235, 235, 235)";
    return 组合项列表.value.length
        ? { padding: "22px 0", minHeight: "70px", background }
        : { padding: "35px 0 5px 0", minHeight: "100px", background };
});

// 数值保留两位小数
function 保留两位(num) {
    if (!num) return 0;
    return Math.round(num * 100) / 100;
}
</script>

<style lang="less" scoped>
.borderRed {
    border: 1px solid red;
}

.borderGreen {
    border: 1px solid green;
}
</style>
