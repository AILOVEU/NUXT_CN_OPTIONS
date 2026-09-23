<template>
  <div class="px-3 pb-10 pt-2">
    <Nav />

    <!-- 标题 / 刷新 -->
    <div class="mx-auto mt-2 flex max-w-[1100px] flex-wrap items-end justify-between gap-2">
      <div>
        <h1 class="text-[20px] font-black tracking-wide text-gray-800">股指期货价差</h1>
        <p class="mt-1 text-[12px] text-gray-500">
          {{ tab === "calendar"
            ? `价差 = 近月 − 远月 · 主分位基准：季月连续（当季 − 下季）· 窗口近 ${windowYear} 年`
            : `升贴水 = 期货 − 现货（升水为正）· 主分位基准：季月连续基差（当季 − 现货）· 窗口近 ${windowYear} 年` }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[11px] text-gray-400">{{ updatedAt ? "更新于 " + updatedAt : "" }}</span>
        <el-button size="small" :loading="loading" @click="load(true)">刷新</el-button>
      </div>
    </div>

    <!-- 价格 Tab -->
    <div class="mx-auto mt-3 flex max-w-[1100px] items-center gap-2">
      <div class="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
        <button
          v-for="t in TABS"
          :key="t.key"
          class="rounded-md px-4 py-1.5 text-[13px] font-bold transition-colors"
          :class="tab === t.key ? 'bg-[#2f6fd0] text-white' : 'text-gray-600 hover:text-[#2f6fd0]'"
          @click="switchTab(t.key)"
        >
          {{ t.name }}
        </button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="mx-auto mt-3 flex max-w-[1100px] flex-wrap items-center gap-2 rounded-[12px] border border-gray-200 bg-white px-3 py-2">
      <template v-if="tab === 'calendar'">
        <span class="text-[12px] font-bold text-gray-700">对比月份</span>
        <el-select v-model="nearYm" size="small" style="width: 108px" @change="onNearChange">
          <el-option v-for="m in options" :key="m" :label="monthLabel(m)" :value="m" />
        </el-select>
        <span class="text-[12px] text-gray-400">vs</span>
        <el-select v-model="farYm" size="small" style="width: 108px" @change="onFarChange">
          <el-option v-for="m in farOptions" :key="m" :label="monthLabel(m)" :value="m" />
        </el-select>
        <span class="rounded bg-blue-50 px-2 py-0.5 text-[12px] font-semibold text-[#2f6fd0]">跨 {{ monthsApart }} 月</span>
      </template>
      <template v-else>
        <span class="rounded bg-blue-50 px-2 py-0.5 text-[12px] font-semibold text-[#2f6fd0]">基准：季月连续基差（当季 − 现货）</span>
        <span class="text-[12px] text-gray-400">升水为正、贴水为负；折合 = 升贴水 ÷ 与当前月份差</span>
      </template>

      <div class="flex-1" />
      <el-button size="small" type="primary" plain @click="expandAll = !expandAll">
        {{ expandAll ? "全部收起详情" : "一键展开全部详情" }}
      </el-button>
    </div>

    <!-- 加载 / 错误 -->
    <div v-if="loading && !data" class="mx-auto mt-16 flex max-w-[1100px] flex-col items-center justify-center gap-3 text-gray-500">
      <div class="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-500" />
      <p class="text-[13px]">数据加载中…</p>
    </div>
    <div v-else-if="error && !data" class="mx-auto mt-16 max-w-[1100px] text-center text-[13px] text-red-500">
      <p>数据加载失败：{{ error }}</p>
      <el-button class="mt-3" size="small" @click="load(true)">重试</el-button>
    </div>

    <!-- ======================= 跨期价差 ======================= -->
    <div v-else-if="tab === 'calendar'" class="mx-auto mt-3 grid max-w-[1100px] grid-cols-1 gap-4 lg:grid-cols-2">
      <div
        v-for="p in products"
        :key="p.key"
        class="overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-sm"
        :class="expandAll ? 'ring-1 ring-blue-300' : ''"
      >
        <div class="flex items-center justify-between gap-2 bg-[#2f6fd0] px-3 py-2 text-white">
          <div class="flex min-w-0 items-center gap-2">
            <span class="truncate text-[14px] font-bold">{{ p.name }}</span>
            <span class="rounded bg-white/20 px-1.5 py-0.5 text-[12px] font-semibold">
              {{ p.near.code }} <span class="opacity-70">vs</span> {{ p.far.code }}
            </span>
          </div>
          <span class="shrink-0 rounded border border-white/40 px-1.5 py-0.5 text-[11px]">跨{{ p.monthsApart }}月</span>
        </div>

        <div class="flex items-stretch gap-2 px-3 py-3">
          <div class="flex min-w-0 flex-1 flex-col justify-center">
            <div class="text-[12px] text-gray-500">当前价差</div>
            <div class="mt-0.5 text-[26px] font-black leading-none sm:text-[30px]" :class="levelText(p.level)">
              {{ fmt(p.currentSpread) }}
            </div>
            <div class="mt-3 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2">
              <span class="text-[12px] text-gray-600">折合价差（点/月）</span>
              <span class="text-[16px] font-bold text-[#2f6fd0]">{{ fmt(p.spreadPerMonth) }}</span>
            </div>
          </div>

          <div class="flex w-[86px] shrink-0 flex-col items-center justify-center gap-1">
            <div class="flex h-[64px] w-[64px] flex-col items-center justify-center rounded-full text-center" :class="levelBadge(p.level)">
              <span class="text-[18px] font-black leading-none">{{ p.rolling.percentile == null ? "—" : p.rolling.percentile + "%" }}</span>
            </div>
            <span class="text-[10px] leading-tight text-gray-500">季月连续分位</span>
          </div>

          <div class="w-[120px] shrink-0 border-l border-dashed border-gray-200 pl-2 sm:w-[150px] sm:pl-3">
            <div class="mb-1 text-right text-[12px] text-gray-500">历史分位参照</div>
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between text-[12px]"><span class="text-gray-500">30%分位</span><b class="text-[#2e9e6b]">{{ fmt(p.rolling.ref.p30) }}</b></div>
              <div class="flex items-center justify-between text-[12px]"><span class="text-gray-500">50%分位</span><b class="text-[#c8862a]">{{ fmt(p.rolling.ref.p50) }}</b></div>
              <div class="flex items-center justify-between text-[12px]"><span class="text-gray-500">75%分位</span><b class="text-[#cf3b3b]">{{ fmt(p.rolling.ref.p75) }}</b></div>
            </div>
          </div>
        </div>

        <div class="px-3 pb-3">
          <div class="rounded-lg px-3 py-2 text-center text-[13px] font-semibold" :class="levelBar(p.level)">
            季月连续 · 近{{ windowYear }}年历史分位
            {{ p.rolling.percentile == null ? "—" : p.rolling.percentile + "%" }}（样本：{{ p.rolling.sample }}），{{ p.banner }}
          </div>
        </div>

        <div v-if="expandAll" class="border-t border-gray-100 bg-gray-50/60 px-3 py-3">
          <div class="grid grid-cols-2 gap-2">
            <div v-for="c in [p.near, p.far]" :key="c.code" class="rounded-lg border border-gray-200 bg-white px-3 py-2">
              <div class="flex items-center justify-between">
                <span class="text-[12px] font-bold text-gray-700">{{ c.code }}</span>
                <span class="text-[11px]" :class="(c.changePct ?? 0) >= 0 ? 'text-[#cf3b3b]' : 'text-[#2e9e6b]'">
                  {{ c.change == null ? "—" : (c.change > 0 ? "+" : "") + fmt(c.change) }}
                  ({{ c.changePct == null ? "—" : (c.changePct > 0 ? "+" : "") + c.changePct + "%" }})
                </span>
              </div>
              <div class="mt-1 text-[20px] font-black" :class="levelText((c.changePct ?? 0) >= 0 ? 'up' : 'down')">{{ fmt(c.price) }}</div>
              <div class="mt-1 flex justify-between text-[11px] text-gray-500">
                <span>开 {{ fmt(c.open) }}</span><span>高 {{ fmt(c.high) }}</span><span>低 {{ fmt(c.low) }}</span>
              </div>
              <div class="mt-0.5 flex justify-between text-[11px] text-gray-400">
                <span>昨收 {{ fmt(c.prevClose) }}</span><span>持仓 {{ c.hold ?? "—" }}</span>
              </div>
            </div>
          </div>

          <div class="mt-2 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
            <span class="text-[12px] text-gray-600">所选合约对自身分位（{{ p.near.code }} − {{ p.far.code }}）</span>
            <span class="text-[12px]">
              <b :class="p.pair.sample >= 20 ? levelText(levelFromPct(p.pair.percentile)) : 'text-gray-400'">
                {{ p.pair.sample >= 20 && p.pair.percentile != null ? p.pair.percentile + "%" : "样本不足" }}
              </b>
              <span class="text-gray-400">（样本 {{ p.pair.sample }}）</span>
            </span>
          </div>

          <div class="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <div class="mb-1 flex items-center justify-between text-[11px] text-gray-500">
              <span>季月连续价差走势（当季 − 下季）</span><span>样本 {{ p.rolling.sample }} 天</span>
            </div>
            <svg v-if="p.rolling.series && p.rolling.series.length > 1" viewBox="0 0 100 32" preserveAspectRatio="none" class="h-[70px] w-full">
              <polyline :points="sparkPoints(p.rolling.series)" fill="none" :stroke="sparkColor(p.level)" stroke-width="0.8" />
              <line v-if="p.rolling.ref.p50 != null" x1="0" x2="100" :y1="yOf(p.rolling.series, p.rolling.ref.p50)" :y2="yOf(p.rolling.series, p.rolling.ref.p50)" stroke="#c8862a" stroke-width="0.4" stroke-dasharray="2 2" />
              <circle v-if="p.currentSpread != null" :cx="100" :cy="yOf(p.rolling.series, p.currentSpread)" r="1.4" :fill="sparkColor(p.level)" />
            </svg>
            <div v-else class="py-4 text-center text-[12px] text-gray-400">暂无足够历史数据</div>
            <div class="mt-1 flex justify-between text-[10px] text-gray-400">
              <span>{{ p.rolling.series?.[0]?.date }}</span>
              <span>{{ p.rolling.series?.[p.rolling.series.length - 1]?.date }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ======================= 期现升贴水 ======================= -->
    <div v-else class="mx-auto mt-3 grid max-w-[1100px] grid-cols-1 gap-4 lg:grid-cols-2">
      <div
        v-for="{ p, c } in basisCards"
        :key="p.key"
        class="overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-sm"
        :class="expandAll ? 'ring-1 ring-blue-300' : ''"
      >
        <!-- 头部 -->
        <div class="flex items-center justify-between gap-2 bg-[#2f6fd0] px-3 py-2 text-white">
          <div class="flex min-w-0 items-center gap-2">
            <span class="truncate text-[14px] font-bold">{{ p.name }}</span>
            <span class="rounded bg-white/20 px-1.5 py-0.5 text-[12px] font-semibold">现货 {{ p.spot.code.slice(2) }}</span>
          </div>
          <div class="shrink-0 text-[12px]">
            现货 {{ fmt(p.spot.price) }}
            <span class="ml-1" :class="pinColor(p.spot.changePct)">{{ sign(p.spot.changePct) }}{{ p.spot.changePct ?? "—" }}%</span>
          </div>
        </div>

        <!-- 主体：当季升贴水 + 分位 + 参照 -->
        <div class="flex items-stretch gap-2 px-3 py-3">
          <div class="flex min-w-0 flex-1 flex-col justify-center">
            <div class="text-[12px] text-gray-500">{{ p.featured.label }} {{ p.featured.code }} 升贴水</div>
            <div class="mt-0.5 text-[26px] font-black leading-none sm:text-[30px]" :class="pinColor(p.featured.basis)">
              {{ fmt(p.featured.basis) }}
            </div>
            <div class="mt-3 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2">
              <span class="text-[12px] text-gray-600">折合（点/月）</span>
              <span class="text-[16px] font-bold" :class="pinColor(p.featured.perMonth)">{{ fmt(p.featured.perMonth) }}</span>
            </div>
          </div>

          <div class="flex w-[86px] shrink-0 flex-col items-center justify-center gap-1">
            <div class="flex h-[64px] w-[64px] flex-col items-center justify-center rounded-full text-center" :class="levelBadge(p.level)">
              <span class="text-[18px] font-black leading-none">{{ p.rolling.percentile == null ? "—" : p.rolling.percentile + "%" }}</span>
            </div>
            <span class="text-[10px] leading-tight text-gray-500">季月连续基差分位</span>
          </div>

          <div class="w-[120px] shrink-0 border-l border-dashed border-gray-200 pl-2 sm:w-[150px] sm:pl-3">
            <div class="mb-1 text-right text-[12px] text-gray-500">历史分位参照</div>
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between text-[12px]"><span class="text-gray-500">30%分位</span><b class="text-[#2e9e6b]">{{ fmt(p.rolling.ref.p30) }}</b></div>
              <div class="flex items-center justify-between text-[12px]"><span class="text-gray-500">50%分位</span><b class="text-[#c8862a]">{{ fmt(p.rolling.ref.p50) }}</b></div>
              <div class="flex items-center justify-between text-[12px]"><span class="text-gray-500">75%分位</span><b class="text-[#cf3b3b]">{{ fmt(p.rolling.ref.p75) }}</b></div>
            </div>
          </div>
        </div>

        <!-- 结论条 -->
        <div class="px-3 pb-3 pt-2">
          <div class="rounded-lg px-3 py-2 text-center text-[13px] font-semibold" :class="levelBar(p.level)">
            季月连续基差 · 近{{ windowYear }}年分位
            {{ p.rolling.percentile == null ? "—" : p.rolling.percentile + "%" }}（样本：{{ p.rolling.sample }}），{{ p.banner }}
          </div>
        </div>

        <!-- 详情（点击展开） -->
        <div v-if="expandAll" class="border-t border-gray-100 bg-gray-50/60 px-3 py-3">
          <!-- 各月份升贴水对比（2×2） -->
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="m in p.months"
              :key="m.ym"
              class="rounded-lg border px-2.5 py-2"
              :class="m.ym === p.featured.ym ? 'border-[#2f6fd0] bg-blue-50/70' : 'border-gray-200 bg-white'"
            >
              <div class="flex items-center justify-between">
                <span class="rounded bg-gray-100 px-1 text-[10px] text-gray-500">{{ m.label }}</span>
                <span class="text-[12px] font-bold text-gray-700">{{ m.code }}</span>
              </div>
              <div class="mt-1.5 flex items-baseline justify-between">
                <span class="text-[11px] text-gray-400">期货价</span>
                <span class="text-[13px] font-semibold text-gray-700">{{ fmt(m.price) }}</span>
              </div>
              <div class="mt-0.5 flex items-baseline justify-between">
                <span class="text-[11px] text-gray-400">升贴水</span>
                <span class="text-[15px] font-black leading-tight" :class="pinColor(m.basis)">{{ fmt(m.basis) }}</span>
              </div>
              <div class="mt-0.5 flex items-baseline justify-between">
                <span class="text-[11px] text-gray-400">折合/月</span>
                <span class="text-[12px] font-semibold" :class="pinColor(m.perMonth)">{{ fmt(m.perMonth) }}</span>
              </div>
            </div>
          </div>

          <!-- 期限结构折线图 -->
          <div class="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <div class="mb-1 flex flex-wrap items-center justify-between gap-1 text-[11px] text-gray-500">
              <span>期货价格 · 期限结构（按距当前月数）</span>
              <span class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1"><i class="inline-block h-[2px] w-3 rounded bg-[#2f6fd0]"></i>期货</span>
                <span v-if="c && c.spotY != null" class="inline-flex items-center gap-1">
                  <i class="inline-block w-3 border-t border-dashed border-[#c8862a]"></i>现货
                </span>
              </span>
            </div>
            <svg
              v-if="c"
              :viewBox="`0 0 ${c.W} ${c.H}`"
              preserveAspectRatio="xMidYMid meet"
              class="mx-auto block h-auto w-full max-w-[540px]"
            >
              <g v-for="(t, i) in c.yTicks" :key="'y' + i">
                <line :x1="c.padL" :x2="c.W - c.padR" :y1="t.y" :y2="t.y" stroke="#eef2f7" stroke-width="1" />
                <text :x="c.padL - 6" :y="t.y + 3" text-anchor="end" font-size="9" fill="#98a6b8">{{ t.label }}</text>
              </g>
              <line :x1="c.padL" :x2="c.W - c.padR" :y1="c.H - c.padB" :y2="c.H - c.padB" stroke="#d7dee8" stroke-width="1" />
              <g v-for="(t, i) in c.xTicks" :key="'x' + i">
                <line :x1="t.x" :x2="t.x" :y1="c.H - c.padB" :y2="c.H - c.padB + 3" stroke="#d7dee8" stroke-width="1" />
                <text :x="t.x" :y="c.H - c.padB + 13" text-anchor="middle" font-size="9" fill="#98a6b8">{{ t.label }}</text>
              </g>
              <text :x="(c.padL + (c.W - c.padR)) / 2" :y="c.H - 2" text-anchor="middle" font-size="9" fill="#b3bfcd">距当前（月）</text>
              <line v-if="c.spotY != null" :x1="c.padL" :x2="c.W - c.padR" :y1="c.spotY" :y2="c.spotY" stroke="#c8862a" stroke-width="1" stroke-dasharray="3 3" />
              <polyline :points="c.line" fill="none" stroke="#2f6fd0" stroke-width="1.6" />
              <g v-for="pt in c.pts" :key="pt.code">
                <circle :cx="pt.x" :cy="pt.y" r="2.4" fill="#2f6fd0" />
                <text :x="pt.x" :y="pt.y - 7" text-anchor="middle" font-size="9" fill="#2f6fd0">{{ pt.value.toFixed(1) }}</text>
              </g>
            </svg>
            <div v-else class="py-4 text-center text-[12px] text-gray-400">暂无数据</div>
          </div>

          <!-- 季月连续基差走势 -->
          <div class="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <div class="mb-1 flex items-center justify-between text-[11px] text-gray-500">
              <span>季月连续基差走势（当季 − 现货）</span><span>样本 {{ p.rolling.sample }} 天</span>
            </div>
            <svg v-if="p.rolling.series && p.rolling.series.length > 1" viewBox="0 0 100 32" preserveAspectRatio="none" class="h-[70px] w-full">
              <polyline :points="sparkPoints(p.rolling.series)" fill="none" :stroke="sparkColor(p.level)" stroke-width="0.8" />
              <line v-if="p.rolling.ref.p50 != null" x1="0" x2="100" :y1="yOf(p.rolling.series, p.rolling.ref.p50)" :y2="yOf(p.rolling.series, p.rolling.ref.p50)" stroke="#c8862a" stroke-width="0.4" stroke-dasharray="2 2" />
              <circle v-if="p.featured.basis != null" :cx="100" :cy="yOf(p.rolling.series, p.featured.basis)" r="1.4" :fill="sparkColor(p.level)" />
            </svg>
            <div v-else class="py-4 text-center text-[12px] text-gray-400">暂无足够历史数据</div>
            <div class="mt-1 flex justify-between text-[10px] text-gray-400">
              <span>{{ p.rolling.series?.[0]?.date }}</span>
              <span>{{ p.rolling.series?.[p.rolling.series.length - 1]?.date }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="mx-auto mt-4 max-w-[1100px] text-center text-[11px] text-gray-400">
      数据来源：新浪财经 · {{ tab === "calendar" ? "价差为近月减远月" : "升贴水为期货减现货" }} · 分位数仅供参考，不构成投资建议
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

useHead({ title: "股指期货价差" });

const TABS = [
  { key: "calendar", name: "跨期价差" },
  { key: "basis", name: "期现升贴水" },
];

const tab = ref("calendar");
const data = ref(null);
const loading = ref(false);
const error = ref(null);
const updatedAt = ref("");
const expandAll = ref(false);

const nearYm = ref("");
const farYm = ref("");

const options = computed(() => data.value?.options || []);
const farOptions = computed(() => options.value.filter((m) => m > nearYm.value));
const products = computed(() => data.value?.products || []);
const basisCards = computed(() => products.value.map((p) => ({ p, c: buildTermChart(p) })));
const windowYear = computed(() => (data.value?.windowMonths ? (data.value.windowMonths / 12).toFixed(1) : "1.5"));
const monthsApart = computed(() => data.value?.selected?.monthsApart ?? "—");

const QUARTER = [3, 6, 9, 12];
function monthLabel(m) {
  const mm = Number(String(m).slice(2));
  return `20${String(m).slice(0, 2)}年${mm}月${QUARTER.includes(mm) ? "（季）" : ""}`;
}

function fmt(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return Number(v).toFixed(2);
}
function sign(v) {
  return v > 0 ? "+" : "";
}

/* ---- 颜色 ---- */
function levelText(level) {
  if (level === "good" || level === "up") return "text-[#cf3b3b]";
  if (level === "bad" || level === "down") return "text-[#2e9e6b]";
  return "text-gray-800";
}
function levelBadge(level) {
  if (level === "good") return "bg-[#e3f5e6] text-[#2e9e6b]";
  if (level === "bad") return "bg-[#fdeaea] text-[#cf3b3b]";
  return "bg-gray-100 text-gray-600";
}
function levelBar(level) {
  if (level === "good") return "bg-[#e3f5e6] text-[#2e9e6b]";
  if (level === "bad") return "bg-[#fdeaea] text-[#cf3b3b]";
  return "bg-gray-100 text-gray-500";
}
function sparkColor(level) {
  if (level === "good") return "#2e9e6b";
  if (level === "bad") return "#cf3b3b";
  return "#2f6fd0";
}
function levelFromPct(pct) {
  if (pct == null) return "neutral";
  if (pct >= 75) return "good";
  if (pct <= 25) return "bad";
  return "neutral";
}
/** 升贴水配色：升水(正)红、贴水(负)绿 */
function pinColor(v) {
  if (v == null || Number.isNaN(Number(v))) return "text-gray-400";
  if (Number(v) > 0) return "text-[#cf3b3b]";
  if (Number(v) < 0) return "text-[#2e9e6b]";
  return "text-gray-600";
}

/* ---- 迷你走势映射 ---- */
function scaleOf(series) {
  const vals = series.map((s) => s.spread);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return { min, span: max - min || 1 };
}
function sparkPoints(series) {
  const { min, span } = scaleOf(series);
  return series
    .map((s, i) => {
      const x = series.length > 1 ? (i / (series.length - 1)) * 100 : 0;
      const y = 30 - ((s.spread - min) / span) * 28;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
function yOf(series, value) {
  const { min, span } = scaleOf(series);
  return (30 - ((value - min) / span) * 28).toFixed(1);
}

/* ---- 期限结构折线图：x = 距当前月数（连续数值轴），y = 期货价 ---- */
function buildTermChart(p) {
  const months = (p?.months || []).filter((m) => m.price != null);
  if (!months.length) return null;
  const W = 340;
  const H = 168;
  const padL = 48;
  const padR = 24;
  const padT = 18;
  const padB = 30;

  const diffs = months.map((m) => m.monthDiff);
  const xMin = Math.min(...diffs);
  const xMax = Math.max(...diffs);

  const vals = months.map((m) => m.price);
  if (p.spot?.price != null) vals.push(p.spot.price);
  let yMin = Math.min(...vals);
  let yMax = Math.max(...vals);
  const pad = (yMax - yMin || 1) * 0.14;
  yMin -= pad;
  yMax += pad;

  const xScale = (v) => padL + (xMax === xMin ? 0.5 : (v - xMin) / (xMax - xMin)) * (W - padL - padR);
  const yScale = (v) => H - padB - ((v - yMin) / (yMax - yMin)) * (H - padT - padB);

  // x 轴刻度：逐月连续（1、2、3、4、5…）
  const xTicks = [];
  for (let n = Math.ceil(xMin); n <= Math.floor(xMax); n++) xTicks.push({ x: xScale(n), label: String(n) });

  // y 轴刻度
  const yTicks = [];
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const v = yMin + ((yMax - yMin) * i) / steps;
    yTicks.push({ y: yScale(v), label: v.toFixed(0) });
  }

  const pts = months.map((m) => ({ x: xScale(m.monthDiff), y: yScale(m.price), value: m.price, code: m.code }));
  const line = pts.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
  const spotY = p.spot?.price != null ? yScale(p.spot.price) : null;

  return { W, H, padL, padR, padT, padB, xTicks, yTicks, pts, line, spotY };
}

/* ---- 交互 ---- */
function switchTab(t) {
  if (tab.value === t) return;
  tab.value = t;
  expandAll.value = false;
  load(true);
}
function onNearChange() {
  if (farYm.value <= nearYm.value) farYm.value = farOptions.value[0] || "";
  load(false);
}
function onFarChange() {
  if (farYm.value <= nearYm.value) return;
  load(false);
}

/* ---- 取数 ---- */
async function load(force) {
  loading.value = true;
  error.value = null;
  try {
    const query = { mode: tab.value };
    if (tab.value === "calendar") {
      query.near = nearYm.value || undefined;
      query.far = farYm.value || undefined;
    }
    if (force) query._t = Date.now();
    const res = await $fetch("/api/futspread", { query });
    if (res && res.products) {
      data.value = res;
      if (tab.value === "calendar") {
        nearYm.value = res.selected.near;
        farYm.value = res.selected.far;
      }
      updatedAt.value = new Date(res.updatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    } else {
      error.value = "返回数据为空";
    }
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

let timer = null;
onMounted(() => {
  load(false);
  timer = setInterval(() => load(false), 60 * 1000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>
