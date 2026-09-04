<template>
    <!-- ==================== 行状态总览（互斥，每行仅命中一种） ====================
        行1  _split   ：组合区块间的分割线（深灰条），保留以做视觉分区；
        行2  _current ：当前价所在行 —— 跨市模式不渲染任何内容，仅占位保持表格上下对称；
        行3  常规期权行：期权卡片 —— 命中跨市组合则逐组合渲染 tag，未命中则空白占位。 -->
    <!-- 行1：分割线行 -->
    <div v-if="props.row._split" style="background-color: #576a8f" class="h-[10px]">&nbsp;</div>

    <!-- 行3：期权卡片主体（_current 行不匹配任何分支 → 自动空渲染，即“跨市模式不显示”） -->
    <div v-else-if="!props.row?._current"
        class="p-[2px] relative flex flex-col items-center justify-center gap-[2px] h-[128px]" :style="cardStyle">
        <!-- 当前一手价：absolute 悬浮于卡片左上角（卡片级信息，命中的多个组合 tag 共用一次） -->
        <div v-if="组合项列表.length" class="absolute left-0 top-[0px] text-[16px]">{{ 一手价 }}</div>
        <!-- 跨市组合：同一期权可能同时属于多个组合，命中的每个组合各渲染一行 tag -->
        <div v-for="item in 组合项列表" :key="item.key"
            class="flex w-full items-center justify-between gap-[4px] text-[14px] leading-[22px] whitespace-nowrap"
            :style="item.组合边框样式">
            <!-- ── 左区：块1 剩余手数 / 块2 成本价×手数 / 块3 连接符（整体居左，各自固定宽度） -->
            <div class="flex items-center gap-[4px]">
                <!-- 块7 涨到目标价百分比：组合完结后不再有后续目标 → 隐藏 -->
                <div class="shrink-0 text-right" style="width: 50px">
                    <div v-if="item.显示涨到目标百分比" class="text-[16px] text-[red] text-left">{{ item.涨到目标百分比 }}%</div>
                </div>
                <!-- 块1 剩余手数（原“一手价”已移至卡片左上角悬浮；组合完结后隐藏剩余） -->
                <div class="flex items-center" style="width: 58px">
                    <div v-if="item.显示剩余手数">&nbsp;*&nbsp;{{ item.剩余手数 }}</div>
                </div>
                <!-- 块2 成本价×总手数：组合完结 → 白底；推进中 → 组合底色 -->
                <div class="rounded-[3px] px-[2px] text-center" style="width: 54px" :style="item.样式">{{ item.成本价 }}*{{
                    item.手数 }}
                </div>
                <!-- 块3 连接符：左侧成本块 → 右侧目标块 -->
                <div class="text-[11px] text-center">=></div>
            </div>

            <!-- ── 中区：块4 一倍目标价 / 块5 1.5 倍目标价（弹性占满剩余宽度，居中） -->
            <div class="flex items-center justify-start gap-[4px] flex-1">
                <!-- 块4 目标价格 × (手数/3)组数：本腿已一平 → 置灰；推进中 → 组合底色且放大突出 -->
                <div class="rounded-[3px] px-[2px] text-center" :style="item.目标价格样式">{{ formatDecimal(item.目标价格, 0) }} *
                    {{ Math.ceil(item.手数 / 3) }}
                </div>
                <!-- 块5 目标价格1.5倍 × (手数/3)组数：本腿已二平 → 置灰；仅一平后 → 放大突出 -->
                <div class="rounded-[3px] px-[2px] text-center" :style="item.目标价格15倍样式"> {{
                    formatDecimal(item.目标价格15倍, 0) }} * {{ Math.ceil(item.手数 / 3) }}</div>
            </div>

            <!-- ── 右区：块6 盈亏 / 块7 涨到目标价百分比（整体居右，各自固定宽度） -->
            <div class="flex items-center gap-[4px] justify-between">
                <!-- 块6 盈亏（盈/亏 + 数值）：组合完结后全部落袋、不再浮动 → 隐藏 -->
                <div class="rounded-[3px] px-[2px] text-left text-[12px]" :style="{ ...item.盈亏样式, width: '47px' }">
                    <span v-if="item.显示盈亏">{{ item.盈亏 > 0 ? '盈' : '亏' }}{{ item.盈亏 }}</span>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup>
import dayjs from "dayjs";
import { SPREAD_DATA } from "~/data/spread.js";
import { formatDecimal } from "~/utils/utils.js";

// ============================================================================
// 一、数据结构与业务背景（重构后的统一口径，务必先读这里）
// ----------------------------------------------------------------------------
// SPREAD_DATA：一组“跨市组合”，固定由两条腿组成（认购腿 + 认沽腿），每条腿：
//   leg[0] 期权名称 | leg[1] 成本价 | leg[2] 手数
//   leg[3] 第一次平仓手数（可选）—— 涨到「目标价格(1倍)」时已平的手数，下文简称“一平”
//   leg[4] 第二次平仓手数（可选）—— 涨到「目标价格×1.5」时已平的手数，下文简称“二平”
//
// 展示状态由“腿级进度 + 组合级进度”两层共同决定，这是历次需求叠加后最容易乱的点：
//   ① 腿级进度（仅看当前期权所在那条腿）：决定哪些目标块置灰、哪个块放大、盈亏与涨幅怎么算；
//   ② 组合级进度（整组口径）：组内任一条腿出现“二平” → 整组视为已完全平仓(组合完结)，
//      两端期权展示同步收口，保证同一组合的认购/认沽两条腿永远保持一致。
//
// ②的“组合完结”此前散落在剩余手数/盈亏/涨幅/白底/边框 5 处各自重复判断，
// 现收敛为构建函数里的单一变量 组合二平，仅此一处定义。
// ============================================================================

// props（跨市模式，接口与 InfoBlank 保持一致；indexVal 仅为统一接口，本组件未使用）
const props = defineProps(["row", "isCall", "date", "tiledData", "indexVal"]);

// 期权名称（与 SymmetricTable 数据 key 格式保持一致：M月）
const 期权名称 = computed(() => {
    const type = props.isCall ? "C" : "P";
    const month = dayjs(props.date, "YYYY-MM-DD").format("M月");
    return props.row[type + month + "期权名称"];
});

// 当前期权在 tiledData 中的行情条目（未匹配到时为空对象，字段访问均为 undefined）
const current期权Item = computed(() => props.tiledData?.find((el) => el["期权名称"] === 期权名称.value) || {});

// 行情数值：当前一手价（成本价/目标价同量纲；为空时整卡灰底兜底）
const 一手价 = computed(() => current期权Item.value["一手价"]);
const 一手昨收价 = computed(() => current期权Item.value["一手昨收价"]);
// ============================================================================
// 二、样式工具（三态底色 + 放大 + 组合配色）
// ----------------------------------------------------------------------------
// 置灰样式：当前腿已在对应价位平过仓 → 该“目标价块”已结算、不再是目标，置灰；
//            卡片兜底（无一手价整卡灰底）也复用它保持一致观感。
const 置灰样式 = {
    background: "rgb(235, 235, 235)",
    border: "1px solid #aaaaaa",
    color: "gray",
    paddingBottom: '3px'
};

// 白色样式：组合完结(二平)后，未被置灰的块由组合底色统一转白底收口
const 白色样式 = {
    background: "white",
    border: "1px solid #dddddd",
    // color: "#333333",
    paddingBottom: "3px",
};

// 放大字号：给“当前真正在等的目标价块”做字号强调（常规文本 16px → 21px）
const 放大字号 = "24px";

// 字段是否有值（非空：排除 null / undefined / 空字符串）
function 有值(val) {
    return val != null && val !== "";
}

// 组合色相：按组合下标用黄金角分布生成稳定色相（色相足够分散、互不混淆），
// 同一组合的认购/认沽两端共用同一组色相 → 颜色天然一致。
function 组合色相(index) {
    return Math.round((index * 137.508) % 360);
}

// 组合配色：正常推进态下的块底色（背景/边框/文字同色系）
function 组合颜色(index) {
    const hue = 组合色相(index);
    return {
        background: "hsl(" + hue + ", 70%, 86%)",
        border: "1px solid hsl(" + hue + ", 65%, 55%)",
        color: "hsl(" + hue + ", 70%, 25%)",
        paddingBottom: '3px'
    };
}

// 数值保留两位小数（0 / 空值统一返回 0，避免出现 NaN/undefined 展示）
function 保留两位(num) {
    if (!num) return 0;
    return Math.round(num * 100) / 100;
}

// ============================================================================
// 三、组合展示项构建
// ============================================================================

/**
 * 当前期权命中的全部组合展示项。
 * 同一期权可能同时属于多个组合 → 每个命中的组合各生成一个展示项，
 * 模板 v-for 逐项渲染成一行 tag。
 */
const 组合项列表 = computed(() => {
    const name = 期权名称.value;
    if (!name) return [];
    const list = [];
    SPREAD_DATA.forEach((group, groupIndex) => {
        const item = 构建组合展示项(group, groupIndex, name);
        if (item) list.push(item);
    });
    return list;
});

/**
 * 构建单个组合的展示项（取“当前期权在该组合中的那一腿”为渲染主体）。
 *
 * 展示状态机（由「腿级平仓进度」×「组合级完结状态」决定，需求各次变动的全部规则）：
 *
 *   组合推进中（组内无人二平）：
 *     · 腿未平仓       → 1 倍目标块放大；剩余手数=全部；盈亏=全部浮动；涨幅盯 1 倍目标价
 *     · 腿仅一平       → 1 倍块置灰、1.5 倍块放大；剩余=手数-一平；
 *                        盈亏=已平部分按目标价落袋+剩余部分浮动；涨幅改盯 1.5 倍目标价
 *   组合完结（组内任一脚出现二平，两端同步收口）：
 *     · 未被置灰的块转白底，整项包裹 2px 组合色边框；
 *     · 隐藏 剩余手数 / 盈亏 / 涨到目标百分比，目标块取消放大；
 *     · 本腿自己平过的目标块仍各自置灰（一平→1 倍块灰，二平→1.5 倍块灰）
 */
function 构建组合展示项(group, groupIndex, name) {
    // ---- 第 1 步：当前腿基础数据 + 腿级进度标记 ----
    const leg = group.find((item) => item[0] === name);
    if (!leg) return null;
    const 成本价 = leg[1];
    const 手数 = leg[2];
    const 第一次平仓手数 = leg[3]; // 一平：1 倍目标价处已平手数（腿级）
    const 第二次平仓手数 = leg[4]; // 二平：1.5 倍目标价处已平手数（腿级）
    const 已一平 = 有值(第一次平仓手数);
    const 已二平 = 有值(第二次平仓手数);

    // ---- 第 2 步：组合级汇总（整组共享，两端一致） ----
    // 组合总成本 = 各腿（成本价 × 手数）之和
    const 组合总成本 = group.reduce((sum, item) => {
        const [, 单腿成本价, 单腿手数] = item;
        return sum + 单腿成本价 * 单腿手数;
    }, 0);
    // 目标价格 = 该腿按手数摊分到的组合总成本（涨到这里即回本组合投入）
    const 目标价格 = 手数 ? 保留两位(组合总成本 / 手数) : 0;
    // 目标价格 ×1.5：全文件唯一的 1.5 倍价定义处（块5 展示与涨幅基准共用，不再各自重算）
    const 目标价格15倍 = 保留两位((目标价格 * 3) / 2);
    // 组合二平（组合级完结标志）：组内任一条腿出现二平即视为整组完全平仓，
    // 同组合两条腿的展示开关、白底、粗边框全部由它驱动（= 旧代码中“组合维度”判断的唯一来源）
    const 组合二平 = group.some((l) => 有值(l[4]));

    // ---- 第 3 步：显示内容（剩余手数 / 盈亏 / 涨到目标百分比） ----
    // ① 剩余手数 = 总手数 − 已一平 − 已二平
    const 已平总量 = (已一平 ? 第一次平仓手数 : 0) + (已二平 ? 第二次平仓手数 : 0);
    const 剩余手数 = 保留两位(手数 - 已平总量);
    // 显示剩余手数的情形：
    //   · 未平仓 → 显示全部手数；仅一平 → 显示未平部分（剩余等 1.5 倍目标价）；
    //   · 本腿 一平+二平 齐备（已平完）或 组合完结 → 无剩余，隐藏
    const 显示剩余手数 = !组合二平 && (!已一平 || !已二平);

    // ② 盈亏（腿级，推进中才展示）：
    //   · 已一平 → 已平部分按 (目标价 − 成本价) 落袋，剩余部分按当前一手价浮动；
    //   · 未一平 → 全部手数按当前一手价浮动
    const 盈亏值 = 已一平
        ? (目标价格 - 成本价) * 第一次平仓手数 + (一手价.value - 成本价) * (手数 - 第一次平仓手数)
        : (一手价.value - 成本价) * 手数;
    const 盈亏样式 = { color: 盈亏值 > 0 ? "red" : "green" };
    // 组合完结后盈亏不再浮动变化 → 隐藏（组合维度两端一致）
    const 显示盈亏 = !组合二平;

    // ③ 涨到目标价百分比（腿级，推进中才展示）：
    //    目标基准价 —— 未一平盯 1 倍目标价；已一平后剩余手数改盯 1.5 倍目标价
    const 目标价基准 = 已一平 ? 目标价格15倍 : 目标价格;
    const 当前价 = 一手昨收价.value;
    const 涨到目标百分比 = 当前价 ? formatDecimal((100 * (目标价基准 - 当前价)) / 当前价, 0) : null;
    // 组合完结后不再有后续目标 → 隐藏（组合维度两端一致）
    const 显示涨到目标百分比 = !组合二平 && 涨到目标百分比 != null;

    // ---- 第 4 步：块样式（置灰 / 白底 / 组合底色 三态 + 放大 + 完结边框） ----
    // 目标块基础底色（块4/块5 各自独立）：
    //   本腿已在此价位平过 → 置灰（已结算，不再是目标）；
    //   否则 组合已完结 → 白底（收口态）；推进中 → 组合底色
    const 目标价格基础 = 已一平 ? 置灰样式 : 组合二平 ? 白色样式 : 组合颜色(groupIndex);
    const 目标价格15倍基础 = 已二平 ? 置灰样式 : 组合二平 ? 白色样式 : 组合颜色(groupIndex);
    // 放大规则（突出当前真正在等的价位）：
    //   · 未一平         → 放大 1 倍目标价块；
    //   · 仅一平（等1.5倍）→ 放大 1.5 倍块；
    //   · 二平或组合完结 → 恢复正常字号
    const 放大目标价格 = !已一平 && !组合二平;
    const 放大目标价格15倍 = 已一平 && !已二平 && !组合二平;

    return {
        key: groupIndex, // v-for key，同组合唯一
        // 原始数值
        成本价: 成本价,
        手数: 手数,
        目标价格: 目标价格,
        目标价格15倍: 目标价格15倍,
        盈亏: 盈亏值,
        剩余手数: 剩余手数,
        涨到目标百分比: 涨到目标百分比,
        // 显示开关
        显示盈亏: 显示盈亏,
        显示剩余手数: 显示剩余手数,
        显示涨到目标百分比: 显示涨到目标百分比,
        // 样式（成本价×手数 块 + 两个目标块 + 组合完结时的 2px 粗边框）
        盈亏样式,
        样式: 组合二平 ? 白色样式 : 组合颜色(groupIndex),
        目标价格样式: 放大目标价格 ? { ...目标价格基础, fontSize: 放大字号 } : 目标价格基础,
        目标价格15倍样式: 放大目标价格15倍 ? { ...目标价格15倍基础, fontSize: 放大字号 } : 目标价格15倍基础,
        组合边框样式: 组合二平
            ? { border: "2px solid hsl(" + 组合色相(groupIndex) + ", 65%, 55%)", padding: "2px" }
            : {},
    };
}

// 卡片尺寸两种情形：
//   · 命中组合 → 按 tag 行数自适应（最小高度 70px）；
//   · 未命中任何组合 → 以 100px 最小高度作空白占位（保持与相邻期权行视觉对齐）
// 无一手价（行情缺失）→ 整卡置灰兜底
const cardStyle = computed(() => {
    const background = 一手价.value ? "" : "rgb(235, 235, 235)";
    return 组合项列表.value.length
        ? { padding: "22px 0", minHeight: "70px", background }
        : { padding: "35px 0 5px 0", minHeight: "100px", background };
});
</script>
