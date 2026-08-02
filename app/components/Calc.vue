<template>
    <el-dialog v-model="dialogVisible" title="BS期权定价计算器" width="90%" :max-width="'1200px'" :close-on-click-modal="false"
        @close="handleDialogClose">
        <div class="min-h-[600px] bg-slate-100 py-4 px-1">
            <div class="mx-auto bg-white rounded-xl shadow-md p-2">
                <div class="mb-6 p-4 bg-slate-50 rounded-lg">
                    <p class="text-sm text-slate-600 mb-3 font-medium">选择横轴变量：</p>
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input v-model="selectedAxis" type="radio" value="none" name="axisRadio"
                                class="accent-blue-500" @change="handleAxisChange" />
                            <span>不绘图（全部可编辑）</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input v-model="selectedAxis" type="radio" value="days" name="axisRadio"
                                class="accent-blue-500" @change="handleAxisChange" />
                            <span>到期天数(0-120)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input v-model="selectedAxis" type="radio" value="strike" name="axisRadio"
                                class="accent-blue-500" @change="handleAxisChange" />
                            <span>行权价(现价80%~120%)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input v-model="selectedAxis" type="radio" value="spot" name="axisRadio"
                                class="accent-blue-500" @change="handleAxisChange" />
                            <span>正股价格(2.8~3.2)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input v-model="selectedAxis" type="radio" value="vol" name="axisRadio"
                                class="accent-blue-500" @change="handleAxisChange" />
                            <span>隐含波动率(0-30%)</span>
                        </label>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-1 mb-1">
                    <div class="flex flex-col gap-1">
                        <label class="text-sm text-slate-600">到期剩余天数</label>
                        <el-input-number v-model="params.daysToExpire" :min="0" :disabled="selectedAxis === 'days'"
                            @change="calcOption" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm text-slate-600">行权价 K</label>
                        <el-input-number v-model="params.strikePrice" step="0.01" :min="0.01"
                            :disabled="selectedAxis === 'strike'" @change="calcOption" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm text-slate-600">正股现价 S</label>
                        <el-input-number v-model="params.spotPrice" step="0.01" :min="0.01"
                            :disabled="selectedAxis === 'spot'" @change="calcOption" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm text-slate-600">隐含波动率 %</label>
                        <el-input-number v-model="params.impliedVol" step="0.1" :min="0.01"
                            :disabled="selectedAxis === 'vol'" @change="calcOption" class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm text-slate-600">无风险利率 %</label>
                        <el-input-number v-model="params.riskFreeRate" step="0.01" :min="0" @change="calcOption"
                            class="w-full" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-sm text-slate-600">期权类型</label>
                        <el-select v-model="params.optionType" @change="calcOption" class="w-full">
                            <el-option label="购（看涨 Call）" value="call" />
                            <el-option label="沽（看跌 Put）" value="put" />
                        </el-select>
                    </div>
                </div>

                <div class="bg-blue-50 rounded-lg p-2 border border-blue-100 mb-1">
                    <h3 class="font-semibold text-blue-800 mb-1 text-[16px]">实时定价结果</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center py-1 border-b border-blue-100">
                            <span class="text-slate-700">期权理论价格：</span>
                            <span class="font-bold text-blue-700 text-lg">{{ result.optionPrice }}</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-blue-100">
                            <span class="text-slate-700">内在价值：</span>
                            <span class="font-bold text-emerald-600 text-lg">
                                {{ result.intrinsicValue }} <span class="text-sm font-normal text-slate-500">（占比 {{
                                    result.intrinsicRatio }}%）</span>
                            </span>
                        </div>
                        <div class="flex justify-between items-center py-1">
                            <span class="text-slate-700">时间价值：</span>
                            <span class="font-bold text-orange-600 text-lg">
                                {{ result.timeValue }} <span class="text-sm font-normal text-slate-500">（占比 {{
                                    result.timeRatio }}%）</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div v-if="selectedAxis !== 'none'" class="border border-slate-200 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-slate-700 mb-3">价值变化曲线图</h3>
                    <div ref="chartRef" class="w-full h-[420px]"></div>
                </div>
                <div v-else class="text-center text-slate-500 py-10 text-lg">当前未选择横轴变量，仅单点计算，不生成曲线图表</div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick, computed } from "vue";
import * as echarts from "echarts";

// ===================== props & emit（对外接口，固定v-model:visible）=====================
const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    // 外部传入初始参数，可选
    optionInfo: {
        type: Object,
        default: null,
    },
});
const emit = defineEmits(["update:visible"]);

// 桥接el-dialog双向绑定
const dialogVisible = computed({
    get() {
        return props.visible;
    },
    set(val) {
        emit("update:visible", val);
    },
});

const chartRef = ref(null);
let chartInstance = null;
const selectedAxis = ref("none");

const params = reactive({
    daysToExpire: 30,
    strikePrice: 3.0,
    spotPrice: 3.0,
    impliedVol: 18,
    riskFreeRate: 1.5,
    optionType: "call",
});

const result = reactive({
    optionPrice: "0.0000",
    intrinsicValue: "0.0000",
    timeValue: "0.0000",
    intrinsicRatio: "0.00",
    timeRatio: "0.00",
});

// 监听弹窗打开，接收外部optionInfo初始化参数
watch(
    () => props.visible,
    async (newVal) => {
        if (newVal) {
            // 弹窗打开，赋值外部传入参数
            if (props.optionInfo) {
                Object.assign(params, props.optionInfo);
            }
            await nextTick();
            calcOption();
            handleAxisChange();
        }
    },
    { immediate: true }
);

// 弹窗关闭销毁图表
const handleDialogClose = () => {
    if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
    }
    selectedAxis.value = "none";
};

// 高精度标准正态累积分布函数
function normCDF(x) {
    const pi = Math.PI;
    const a = [0.31938153, -0.356563782, 1.781477937, -1.821255978, 1.330274429];
    const gamma = 0.2316419;

    if (x >= 0) {
        let k = 1 / (1 + gamma * x);
        let poly = k * (a[0] + k * (a[1] + k * (a[2] + k * (a[3] + k * a[4]))));
        return 1 - (Math.exp((-x * x) / 2) / Math.sqrt(2 * pi)) * poly;
    } else {
        return 1 - normCDF(-x);
    }
}

// BS核心公式
function blackScholes(S, K, T, r, sigma, optType) {
    if (T <= 0) {
        return optType === "call" ? Math.max(0, S - K) : Math.max(0, K - S);
    }
    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;

    let price;
    if (optType === "call") {
        price = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
    } else {
        price = K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
    }
    return Math.max(0, price);
}

// 价值计算入口
function calcValue(S, K, days, volPct, ratePct, type) {
    const T = days / 252;
    const sigma = volPct / 100;
    const r = ratePct / 100;

    const premium = blackScholes(S, K, T, r, sigma, type);
    const intrinsic = type === "call" ? Math.max(0, S - K) : Math.max(0, K - S);
    const timeValue = Math.max(0, premium - intrinsic);

    return {
        premium: Number(premium.toFixed(6)),
        intrinsic: Number(intrinsic.toFixed(6)),
        time: Number(timeValue.toFixed(6)),
    };
}

// 更新图表数据
function updateChartData() {
    const range = getAxisRange();
    if (!range || !chartInstance) return;
    const data = generateLineData(range);

    chartInstance.setOption({
        series: buildSeries(data),
    });
}

// 获取当前横轴变量对应的输入值（作为 x 点位）
function getCurrentX() {
    switch (selectedAxis.value) {
        case "days": return params.daysToExpire;
        case "strike": return params.strikePrice;
        case "spot": return params.spotPrice;
        case "vol": return params.impliedVol;
        default: return null;
    }
}

// 构建曲线 series，并在“当前输入点位”上标记 x（竖线）与各价值 y 点
function buildSeries(data) {
    const xVal = getCurrentX();
    if (xVal === null) return [];
    const res = calcValue(
        params.spotPrice,
        params.strikePrice,
        params.daysToExpire,
        params.impliedVol,
        params.riskFreeRate,
        params.optionType
    );

    // 在“期权总价格”曲线上寻找 ≈ 当前价 2 倍的点（用于标记翻倍位置）
    const twiceTarget = res.premium * 2;
    let twicePoint = null;
    if (data.length) {
        const ys = data.map((d) => d[1]);
        const yMin = Math.min(...ys);
        const yMax = Math.max(...ys);
        // 仅当目标值落在曲线 y 范围内才标记，避免误标
        if (twiceTarget >= yMin && twiceTarget <= yMax) {
            let bestDiff = Infinity;
            for (const d of data) {
                const diff = Math.abs(d[1] - twiceTarget);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    twicePoint = d;
                }
            }
        }
    }

    // 在当前 x 处、给定 y 值上打一个标记点，并显示数值
    const mkMarkPoint = (y, labelOffset) => ({
        symbol: "circle",
        symbolSize: 7,
        itemStyle: { color: "auto" },
        labelLayout: { moveOverlap: "shiftY" },
        label: {
            show: true,
            formatter: (p) => Number(p.value).toFixed(4),
            position: "right",
            offset: labelOffset,
            fontSize: 10,
            color: "#334155",
            backgroundColor: "rgba(255,255,255,0.85)",
            padding: [2, 3],
            borderRadius: 3,
        },
        data: [{ coord: [xVal, y], value: y }],
    });

    // 贯穿 x 轴的虚线：当前输入点位 + （若存在）约 2 倍点的 x 点位
    const axisNameMap = { days: "到期天数", strike: "行权价", spot: "正股价格", vol: "隐含波动率" };
    const axisName = axisNameMap[selectedAxis.value] || "x";
    const currentLine = {
        symbol: "none",
        lineStyle: { type: "dashed", color: "#64748b", width: 1.5 },
        label: { show: false },
        data: [
            {
                xAxis: xVal,
                label: {
                    show: true,
                    formatter: () => `当前输入 ${axisName} ${Number(xVal).toFixed(3)}`,
                    position: "end",
                    color: "#64748b",
                    fontSize: 12,
                },
            },
        ],
    };
    if (twicePoint) {
        currentLine.data.push({
            xAxis: twicePoint[0],
            lineStyle: { type: "dashed", color: "#dc2626", width: 1.5 },
            label: {
                show: true,
                formatter: () => `2× ${axisName} ${Number(twicePoint[0]).toFixed(3)}`,
                position: "end",
                color: "#dc2626",
                fontSize: 12,
            },
        });
    }

    // 三条贯穿 y 轴的虚线，仅作视觉对齐参考（数值已由 markPoint 在右侧标出）
    const yLines = {
        symbol: "none",
        lineStyle: { type: "dashed", color: "#cbd5e1", width: 1 },
        label: {
            show: false,
        },
        labelLayout: { moveOverlap: "shiftY" },
        data: [
            { yAxis: res.premium, yText: `理论 ${res.premium.toFixed(4)}` },
            { yAxis: res.intrinsic, yText: `内在 ${res.intrinsic.toFixed(4)}` },
            { yAxis: res.time, yText: `时间 ${res.time.toFixed(4)}` },
        ],
    };

    // 期权总价格曲线上的标记点：当前输入点 + （若存在）约 2 倍点
    const premiumMarkPoint = {
        labelLayout: { moveOverlap: "shiftY" },
        data: [
            {
                coord: [xVal, res.premium],
                value: res.premium,
                symbol: "circle",
                symbolSize: 7,
                itemStyle: { color: "auto" },
                label: {
                    show: true,
                    formatter: (p) => Number(p.value).toFixed(4),
                    position: "right",
                    offset: [0, -6],
                    fontSize: 10,
                    color: "#334155",
                    backgroundColor: "rgba(255,255,255,0.85)",
                    padding: [2, 3],
                    borderRadius: 3,
                },
            },
        ],
    };
    if (twicePoint) {
        premiumMarkPoint.data.push({
            coord: [twicePoint[0], twicePoint[1]],
            value: twicePoint[1],
            symbol: "diamond",
            symbolSize: 12,
            itemStyle: { color: "#dc2626" },
            label: {
                show: true,
                formatter: "2×",
                position: "right",
                offset: [0, 0],
                fontSize: 10,
                color: "#dc2626",
                backgroundColor: "rgba(255,255,255,0.85)",
                padding: [2, 3],
                borderRadius: 3,
            },
        });
    }

    return [
        {
            name: "期权总价格",
            type: "line",
            smooth: false,
            data: data.map((item) => [item[0], item[1]]),
            lineStyle: { width: 2, color: "#2563eb" },
            symbol: "none",
            markPoint: premiumMarkPoint,
            markLine: currentLine,
        },
        {
            name: "内在价值",
            type: "line",
            smooth: false,
            data: data.map((item) => [item[0], item[2]]),
            lineStyle: { width: 2, color: "#059669" },
            symbol: "none",
            markPoint: mkMarkPoint(res.intrinsic, [0, 0]),
        },
        {
            name: "时间价值",
            type: "line",
            smooth: false,
            data: data.map((item) => [item[0], item[3]]),
            lineStyle: { width: 2, color: "#ea580c" },
            symbol: "none",
            markPoint: mkMarkPoint(res.time, [0, 6]),
        },
        {
            // 仅用于承载 y 轴三条水平参考线
            name: "参考线",
            type: "line",
            data: [],
            markLine: yLines,
            tooltip: { show: false },
            silent: true,
            legendHoverLink: false,
        },
    ];
}

// 页面单点实时计算
const calcOption = () => {
    const res = calcValue(params.spotPrice, params.strikePrice, params.daysToExpire, params.impliedVol, params.riskFreeRate, params.optionType);
    let inRatio = 0,
        tmRatio = 0;
    if (res.premium > 0.0001) {
        inRatio = (res.intrinsic / res.premium) * 100;
        tmRatio = (res.time / res.premium) * 100;
    }
    result.optionPrice = res.premium.toFixed(4);
    result.intrinsicValue = res.intrinsic.toFixed(4);
    result.timeValue = res.time.toFixed(4);
    result.intrinsicRatio = inRatio.toFixed(2);
    result.timeRatio = tmRatio.toFixed(2);

    if (selectedAxis.value !== "none" && chartInstance) {
        updateChartData();
    }
};

// 获取横轴区间配置
function getAxisRange() {
    switch (selectedAxis.value) {
        case "days":
            return { min: 0, max: 120, name: "到期天数(天)", key: "days" };
        case "strike":
            return { min: +(params.spotPrice * 0.8).toFixed(4), max: +(params.spotPrice * 1.2).toFixed(4), name: "行权价", key: "strike" };
        case "spot":
            return { min: params.spotPrice * 0.8, max: params.spotPrice * 1.2, name: "正股价格", key: "spot" };
        case "vol":
            return { min: 0, max: 30, name: "隐含波动率(%)", key: "vol" };
        default:
            return null;
    }
}

// 生成曲线原始数据
function generateLineData(range, pointNum = 1000) {
    if (!range) return [];
    const { min, max, key } = range;
    const list = [];
    const stepCnt = pointNum - 1;

    for (let i = 0; i <= pointNum; i++) {
        const percent = i / stepCnt;
        const x = min + (max - min) * percent;

        let s = params.spotPrice;
        let k = params.strikePrice;
        let tDay = params.daysToExpire;
        let vol = params.impliedVol;

        switch (key) {
            case "days":
                tDay = x;
                break;
            case "strike":
                k = x;
                break;
            case "spot":
                s = x;
                break;
            case "vol":
                vol = x;
                break;
        }

        const val = calcValue(s, k, tDay, vol, params.riskFreeRate, params.optionType);
        list.push([+x.toFixed(4), +val.premium.toFixed(4), +val.intrinsic.toFixed(4), +val.time.toFixed(4)]);
    }
    return list;
}

// 切换横轴、重绘图表统一入口
const handleAxisChange = async () => {
    if (selectedAxis.value === "none") {
        if (chartInstance) {
            chartInstance.dispose();
            chartInstance = null;
        }
        calcOption();
        return;
    }

    if (!chartInstance) {
        await nextTick();
        if (!chartRef.value) return;
        chartInstance = echarts.init(chartRef.value);
    }

    const range = getAxisRange();
    const data = generateLineData(range);

    const option = {
        tooltip: {
            trigger: "axis",
            formatter(params) {
                let tipText = `${range.name}：${params[0].axisValue.toFixed(4)}<br/>`;
                params.forEach((item) => {
                    tipText += `${item.seriesName}：${(+item.data[1] * 10000).toFixed(0)}<br/>`;
                });
                return tipText;
            },
        },
        legend: {
            data: ["期权总价格", "内在价值", "时间价值"],
            top: 10,
        },
        grid: { left: 60, right: 30, top: 60, bottom: 60 },
        xAxis: {
            type: "value",
            name: range.name,
            min: range.min,
            max: range.max,
            splitNumber: 10,
            boundaryGap: false,
            splitLine: { show: false },
        },
        yAxis: {
            type: "value",
            name: "期权价值",
            min: 0,
            scale: false,
            splitLine: { show: false },
        },
        series: buildSeries(data),
    };
    chartInstance.setOption(option, true);
    calcOption();
};

// 窗口自适应
window.addEventListener("resize", () => {
    if (chartInstance) chartInstance.resize();
});
</script>