/**
 * 股指期货价差接口  GET /api/futspread
 *
 * 数据源：新浪财经
 *  - 期货实时：https://hq.sinajs.cn/list=nf_IF2612,nf_IF2703        （需 Referer）
 *  - 期货日线：https://stock2.finance.sina.com.cn/futures/api/jsonp.php/var%20t=/InnerFuturesNewService.getDailyKLine?symbol=IF2612
 *  - 现货实时：https://hq.sinajs.cn/list=s_sh000300                 （需 Referer）
 *  - 现货日线：https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=sh000300&scale=240&ma=no&datalen=500
 *
 * 两种模式（mode）：
 *  1) mode=calendar（默认）跨期价差
 *     - 对比两个期货月份：near / far（far 必须晚于 near），不传则默认最近两个季月
 *     - 当前价差 = 近月 − 远月；折合价差 = 价差 ÷ 相差月数
 *     - 主分位 = 「季月连续」序列（近1.5年每交易日 当季−下季 的价差）中的百分位
 *  2) mode=basis 期现升贴水
 *     - 各挂牌月份期货 与 对应现货指数 对比：升贴水 = 期货 − 现货（升水为正）
 *     - 折合 = 升贴水 ÷ 与当前的月份差
 *     - 主分位 = 「季月连续基差」序列（每交易日 当季合约 − 现货指数）中的百分位
 *
 * 仅本文件 + pages/futspread/index.vue。
 */

const PRODUCTS = [
  { key: "IH", name: "上证50", spot: "sh000016" },
  { key: "IF", name: "沪深300", spot: "sh000300" },
  { key: "IC", name: "中证500", spot: "sh000905" },
  { key: "IM", name: "中证1000", spot: "sh000852" },
];

const WINDOW_MONTHS = 18; // 近 1.5 年
const QUARTER_MONTHS = [3, 6, 9, 12]; // 季月
const SLOT_LABELS = ["当月", "下月", "当季", "下季"]; // 挂牌月份槽位
const SPOT_DAILY_LEN = 500; // 现货日线取最近 500 个交易日（约 2 年）

const DAILY_TTL = 6 * 3600 * 1000; // 日线缓存 6 小时
const RT_TTL = 30 * 1000; // 实时缓存 30 秒
const RESULT_TTL = 30 * 1000; // 结果缓存 30 秒

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

/* ---------------- 工具 ---------------- */
const pad2 = (n) => String(n).padStart(2, "0");
const round = (v, d = 2) => (v == null || Number.isNaN(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const ymStr = (y, m) => String(y).slice(2) + pad2(m);
const isQuarter = (m) => QUARTER_MONTHS.includes(m);
const ymToNum = (ym) => (2000 + Number(String(ym).slice(0, 2))) * 12 + Number(String(ym).slice(2));

/** 合约交割日：合约月的第三个周五（UTC 00:00） */
function thirdFriday(year, month) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (5 - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month - 1, 1 + offset + 14));
}

function addMonth(y, m, delta) {
  const total = y * 12 + (m - 1) + delta;
  return { y: Math.floor(total / 12), m: (total % 12) + 1 };
}

/** 生成前后若干年的全部季月合约 {y, m, ym, expiry} */
function quarterList(centerYear) {
  const list = [];
  for (let y = centerYear - 2; y <= centerYear + 2; y++) {
    for (const m of QUARTER_MONTHS) {
      list.push({ y, m, ym: ymStr(y, m), expiry: thirdFriday(y, m) });
    }
  }
  return list.sort((a, b) => a.expiry - b.expiry);
}

/**
 * 当前可对比的挂牌月份：当月 / 下月 / 随后两个季月（中金所股指期货挂牌规则）
 * 例：2026-09-23 → ["2610","2611","2612","2703"]
 */
function listedMonths(today) {
  const findNext = (y, m) => {
    let cy = y;
    let cm = m;
    for (let i = 0; i < 36; i++) {
      if (thirdFriday(cy, cm) >= today) return { y: cy, m: cm };
      ({ y: cy, m: cm } = addMonth(cy, cm, 1));
    }
    return { y, m };
  };
  const near = findNext(today.getUTCFullYear(), today.getUTCMonth() + 1);
  const next = addMonth(near.y, near.m, 1);
  const quarters = [];
  let cur = addMonth(next.y, next.m, 1);
  while (quarters.length < 2) {
    if (isQuarter(cur.m)) quarters.push({ ...cur });
    cur = addMonth(cur.y, cur.m, 1);
  }
  const set = new Set([ymStr(near.y, near.m), ymStr(next.y, next.m), ...quarters.map((q) => ymStr(q.y, q.m))]);
  return [...set].sort();
}

/** 线性插值分位数，p ∈ [0,1] */
function quantile(sorted, p) {
  if (!sorted.length) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/** 由序列与当前值计算 分位 / 样本 / 30-50-75 分位参照 */
function statsOf(series, currentValue) {
  const arr = series.map((s) => s.spread).sort((a, b) => a - b);
  const sample = arr.length;
  const percentile =
    currentValue != null && sample
      ? Math.round((100 * series.filter((s) => s.spread <= currentValue).length) / sample)
      : null;
  return {
    percentile,
    sample,
    ref: { p30: round(quantile(arr, 0.3)), p50: round(quantile(arr, 0.5)), p75: round(quantile(arr, 0.75)) },
  };
}

/** 跨期口径结论 */
function calendarLevelOf(percentile) {
  if (percentile == null) return { level: "neutral", banner: "样本不足" };
  if (percentile >= 75) return { level: "good", banner: "适合移仓" };
  if (percentile <= 25) return { level: "bad", banner: "不宜移仓" };
  return { level: "neutral", banner: "中性观望" };
}

/** 期现口径结论：升水越高越偏贵，贴水越深越偏便宜 */
function basisLevelOf(percentile) {
  if (percentile == null) return { level: "neutral", banner: "样本不足" };
  if (percentile >= 75) return { level: "bad", banner: "升水偏高" };
  if (percentile <= 25) return { level: "good", banner: "贴水偏深" };
  return { level: "neutral", banner: "升贴水常态" };
}

async function fetchText(url, withReferer) {
  return $fetch(url, {
    responseType: "text",
    headers: {
      "User-Agent": UA,
      ...(withReferer ? { Referer: "https://finance.sina.com.cn/" } : {}),
    },
    timeout: 15000,
  });
}

/* ---------------- 缓存 ---------------- */
const cache = {
  daily: {}, // 期货 symbol -> { ts, rows }
  spotDaily: {}, // 现货 symbol -> { ts, rows }
  realtime: { ts: 0, map: {} },
  result: {}, // key -> { ts, data }
};

/** 期货日线 */
async function getDaily(symbol) {
  const hit = cache.daily[symbol];
  if (hit && Date.now() - hit.ts < DAILY_TTL) return hit.rows;
  let rows = [];
  try {
    const text = await fetchText(
      `https://stock2.finance.sina.com.cn/futures/api/jsonp.php/var%20t=/InnerFuturesNewService.getDailyKLine?symbol=${symbol}`
    );
    const a = text.indexOf("[");
    const b = text.lastIndexOf("]");
    if (a >= 0 && b > a) {
      const arr = JSON.parse(text.slice(a, b + 1));
      rows = (arr || [])
        .filter((x) => x && x.d && x.c != null && x.c !== "")
        .map((x) => ({ d: x.d, c: Number(x.c) }));
    }
  } catch (e) {
    console.warn("[futspread] daily fail", symbol, e?.message || e);
  }
  cache.daily[symbol] = { ts: Date.now(), rows };
  return rows;
}

/** 现货指数日线 */
async function getSpotDaily(symbol) {
  const hit = cache.spotDaily[symbol];
  if (hit && Date.now() - hit.ts < DAILY_TTL) return hit.rows;
  let rows = [];
  try {
    const text = await fetchText(
      `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=240&ma=no&datalen=${SPOT_DAILY_LEN}`
    );
    const a = text.indexOf("[");
    const b = text.lastIndexOf("]");
    if (a >= 0 && b > a) {
      const arr = JSON.parse(text.slice(a, b + 1));
      rows = (arr || [])
        .filter((x) => x && x.day && x.close != null)
        .map((x) => ({ d: x.day, c: Number(x.close) }));
    }
  } catch (e) {
    console.warn("[futspread] spot daily fail", symbol, e?.message || e);
  }
  cache.spotDaily[symbol] = { ts: Date.now(), rows };
  return rows;
}

/** 期货实时（一次批量） */
async function getRealtime(codes) {
  const map = {};
  try {
    const text = await fetchText(`https://hq.sinajs.cn/list=${codes.map((c) => "nf_" + c).join(",")}`, true);
    for (const line of text.split("\n")) {
      const m = /hq_str_nf_([A-Za-z]+\d+)\s*=\s*"([^"]*)"/.exec(line);
      if (!m) continue;
      const f = m[2].split(",");
      const price = Number(f[3]);
      const prevClose = Number(f[13]);
      map[m[1]] = {
        code: m[1],
        price: Number.isFinite(price) ? price : null,
        prevClose: Number.isFinite(prevClose) ? prevClose : null,
        open: Number(f[0]) || null,
        high: Number(f[1]) || null,
        low: Number(f[2]) || null,
        volume: Number(f[4]) || null,
        hold: Number(f[6]) || Number(f[15]) || null,
        change: Number.isFinite(price) && Number.isFinite(prevClose) ? round(price - prevClose) : null,
        changePct:
          Number.isFinite(price) && Number.isFinite(prevClose) && prevClose
            ? round((100 * (price - prevClose)) / prevClose)
            : null,
      };
    }
  } catch (e) {
    console.warn("[futspread] realtime fail", e?.message || e);
  }
  if (Object.keys(map).length) cache.realtime = { ts: Date.now(), map: { ...cache.realtime.map, ...map } };
  return cache.realtime.map;
}

/** 现货实时（一次批量） */
async function getSpotRealtime(codes) {
  const map = {};
  try {
    const text = await fetchText(`https://hq.sinajs.cn/list=${codes.map((c) => "s_" + c).join(",")}`, true);
    for (const line of text.split("\n")) {
      const m = /hq_str_s_([a-z]{2}\d{6})\s*=\s*"([^"]*)"/.exec(line);
      if (!m) continue;
      const f = m[2].split(",");
      const price = Number(f[1]);
      const change = Number(f[2]);
      map[m[1]] = {
        code: m[1],
        name: f[0],
        price: Number.isFinite(price) ? price : null,
        change: Number.isFinite(change) ? change : null,
        changePct: Number(f[3]) || null,
        prevClose: Number.isFinite(price) && Number.isFinite(change) ? round(price - change) : null,
      };
    }
  } catch (e) {
    console.warn("[futspread] spot realtime fail", e?.message || e);
  }
  return map;
}

/* ---------------- 序列构造 ---------------- */
/** 季月合约日线：窗口起点 ~ 当前远月季 */
async function getQuarterCloses(product, quarters, windowStartStr, todayStr) {
  const todayDt = new Date(todayStr);
  const activeNow = quarters.filter((q) => q.expiry >= todayDt);
  const farQuarter = activeNow[1] || activeNow[0];
  const neededQ = quarters.filter((q) => q.expiry > new Date(windowStartStr) && q.expiry <= farQuarter.expiry);
  const rowsQ = await Promise.all(neededQ.map((q) => getDaily(product.key + q.ym)));
  const quarterCloses = {};
  neededQ.forEach((q, i) => {
    quarterCloses[q.ym] = new Map(rowsQ[i].map((r) => [r.d, r.c]));
  });
  return { neededQ, quarterCloses };
}

/** 季月连续「跨期价差」序列：每交易日 当季 − 下季 */
function buildRollingSpreadSeries(quarters, windowStartStr, todayStr, quarterCloses) {
  const dates = new Set();
  for (const q of quarters) {
    const m = quarterCloses[q.ym];
    if (m) for (const d of m.keys()) dates.add(d);
  }
  const series = [];
  for (const d of [...dates].filter((x) => x >= windowStartStr && x <= todayStr).sort()) {
    const dt = new Date(d + "T00:00:00Z");
    const act = quarters.filter((q) => q.expiry >= dt);
    if (act.length < 2) continue;
    const nc = quarterCloses[act[0].ym]?.get(d);
    const fc = quarterCloses[act[1].ym]?.get(d);
    if (nc == null || fc == null) continue;
    series.push({ date: d, spread: round(nc - fc), near: act[0].ym, far: act[1].ym });
  }
  return series;
}

/** 季月连续「基差」序列：每交易日 当季合约 − 现货 */
function buildRollingBasisSeries(quarters, windowStartStr, todayStr, quarterCloses, spotCloses) {
  const series = [];
  for (const d of [...spotCloses.keys()].filter((x) => x >= windowStartStr && x <= todayStr).sort()) {
    const dt = new Date(d + "T00:00:00Z");
    const act = quarters.filter((q) => q.expiry >= dt);
    if (!act.length) continue;
    const nc = quarterCloses[act[0].ym]?.get(d);
    const sc = spotCloses.get(d);
    if (nc == null || sc == null) continue;
    series.push({ date: d, spread: round(nc - sc), near: act[0].ym });
  }
  return series;
}

/** 指定合约自身的升贴水序列（合约与现货都有数据的交易日） */
function buildPairBasisSeries(contractRows, spotCloses, windowStartStr, todayStr) {
  const out = [];
  for (const r of contractRows) {
    if (r.d < windowStartStr || r.d > todayStr) continue;
    const sc = spotCloses.get(r.d);
    if (sc == null) continue;
    out.push({ date: r.d, spread: round(r.c - sc) });
  }
  return out;
}

/* ---------------- 模式一：跨期价差 ---------------- */
async function computeCalendarProduct(product, ctx) {
  const { quarters, windowStartStr, todayStr, nearYm, farYm, monthsApart, realtimeMap } = ctx;
  const { neededQ, quarterCloses } = await getQuarterCloses(product, quarters, windowStartStr, todayStr);
  const rollingSeries = buildRollingSpreadSeries(neededQ, windowStartStr, todayStr, quarterCloses);

  const selectedSeries = await pairSeries(product, nearYm, farYm, windowStartStr, todayStr);

  const nq = realtimeMap[product.key + nearYm];
  const fq = realtimeMap[product.key + farYm];
  const last = selectedSeries[selectedSeries.length - 1];
  let currentSpread = null;
  if (nq?.price != null && fq?.price != null) currentSpread = round(nq.price - fq.price);
  else if (last) currentSpread = last.spread;

  const rolling = { nearYm: neededQ[neededQ.length - 2]?.ym, farYm: neededQ[neededQ.length - 1]?.ym, span: 3, ...statsOf(rollingSeries, currentSpread) };
  const pair = { nearYm, farYm, span: monthsApart, ...statsOf(selectedSeries, currentSpread) };
  const { level, banner } = calendarLevelOf(rolling.percentile);

  return {
    key: product.key,
    name: product.name,
    near: { code: product.key + nearYm, ...(nq || { price: null }) },
    far: { code: product.key + farYm, ...(fq || { price: null }) },
    monthsApart,
    currentSpread,
    spreadPerMonth: currentSpread != null && monthsApart ? round(currentSpread / monthsApart) : null,
    rolling: { ...rolling, series: rollingSeries },
    pair: { ...pair, series: selectedSeries },
    level,
    banner,
  };
}

/** 指定合约对自身的历史价差序列 */
async function pairSeries(product, nearYm, farYm, windowStartStr, todayStr) {
  const [nd, fd] = await Promise.all([getDaily(product.key + nearYm), getDaily(product.key + farYm)]);
  const fm = new Map(fd.map((r) => [r.d, r.c]));
  const out = [];
  for (const r of nd) {
    if (r.d < windowStartStr || r.d > todayStr) continue;
    const c = fm.get(r.d);
    if (c == null) continue;
    out.push({ date: r.d, spread: round(r.c - c) });
  }
  return out;
}

/* ---------------- 模式二：期现升贴水 ---------------- */
async function computeBasisProduct(product, ctx) {
  const { quarters, windowStartStr, todayStr, options, realtimeMap, spotRealtime, currentYm } = ctx;

  const spot = spotRealtime[product.spot] || { code: product.spot, name: product.name, price: null };
  const spotRows = await getSpotDaily(product.spot);
  const spotCloses = new Map(spotRows.map((r) => [r.d, r.c]));

  const { neededQ, quarterCloses } = await getQuarterCloses(product, quarters, windowStartStr, todayStr);
  const rollingSeries = buildRollingBasisSeries(neededQ, windowStartStr, todayStr, quarterCloses, spotCloses);

  // 各挂牌月份：期货价 vs 现货
  const months = [];
  for (const ym of options) {
    const code = product.key + ym;
    const rt = realtimeMap[code];
    const price = rt?.price ?? null;
    const monthDiff = ymToNum(ym) - currentYm;
    const basis = price != null && spot.price != null ? round(price - spot.price) : null;
    const rt2 = await getDaily(code);
    const ownSeries = buildPairBasisSeries(rt2, spotCloses, windowStartStr, todayStr);
    const own = statsOf(ownSeries, basis);
    months.push({
      ym,
      code,
      label: SLOT_LABELS[options.indexOf(ym)] || "远月",
      isQuarter: isQuarter(Number(String(ym).slice(2))),
      monthDiff,
      price,
      prevClose: rt?.prevClose ?? null,
      change: rt?.change ?? null,
      changePct: rt?.changePct ?? null,
      basis,
      perMonth: basis != null && monthDiff ? round(basis / monthDiff) : null,
      percentile: own.percentile,
      sample: own.sample,
    });
  }

  // 主指标：季月（取第一个季月，即当季）
  const featured = months.find((m) => m.isQuarter) || months[0];
  const rolling = { ym: featured?.ym, span: featured?.monthDiff, ...statsOf(rollingSeries, featured?.basis ?? null) };
  const { level, banner } = basisLevelOf(rolling.percentile);

  return {
    key: product.key,
    name: product.name,
    spot: { code: product.spot, name: spot.name, price: spot.price, change: spot.change, changePct: spot.changePct, prevClose: spot.prevClose },
    featured,
    months,
    rolling: { ...rolling, series: rollingSeries },
    level,
    banner,
  };
}

/* ---------------- 入口 ---------------- */
export default eventHandler(async (event) => {
  const q = getQuery(event);
  const mode = q.mode === "basis" ? "basis" : "calendar";
  const today = new Date();
  const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const todayStr = todayStart.toISOString().slice(0, 10);
  const windowStart = new Date(todayStart);
  windowStart.setUTCMonth(windowStart.getUTCMonth() - WINDOW_MONTHS);
  const windowStartStr = windowStart.toISOString().slice(0, 10);

  const options = listedMonths(todayStart);
  const quartersInOptions = options.filter((m) => isQuarter(Number(m.slice(2))));

  // 校验所选月份（仅跨期模式用）
  let nearYm = String(q.near || "");
  let farYm = String(q.far || "");
  const valid = options.includes(nearYm) && options.includes(farYm) && farYm > nearYm;
  if (!valid) {
    nearYm = quartersInOptions[0] || options[0];
    farYm = quartersInOptions[1] || options[1];
  }

  const cacheKey = `${mode}-${nearYm}-${farYm}`;
  const hit = cache.result[cacheKey];
  if (hit && Date.now() - hit.ts < RESULT_TTL && q._t === undefined) return hit.data;

  const quarters = quarterList(todayStart.getUTCFullYear());
  const currentYm = ymToNum(ymStr(todayStart.getUTCFullYear(), todayStart.getUTCMonth() + 1));
  const monthsApart = ymToNum(farYm) - ymToNum(nearYm);

  const codes = [];
  for (const p of PRODUCTS) codes.push(p.key + nearYm, p.key + farYm);

  let products;
  if (mode === "basis") {
    for (const p of PRODUCTS) for (const ym of options) codes.push(p.key + ym);
    const realtimeMap = await getRealtime(codes);
    const spotRealtime = await getSpotRealtime(PRODUCTS.map((p) => p.spot));
    const ctx = { quarters, windowStartStr, todayStr, options, realtimeMap, spotRealtime, currentYm };
    products = await Promise.all(PRODUCTS.map((p) => computeBasisProduct(p, ctx)));
  } else {
    const realtimeMap = await getRealtime(codes);
    const ctx = { quarters, windowStartStr, todayStr, nearYm, farYm, monthsApart, realtimeMap };
    products = await Promise.all(PRODUCTS.map((p) => computeCalendarProduct(p, ctx)));
  }

  const data = {
    mode,
    updatedAt: new Date().toISOString(),
    windowMonths: WINDOW_MONTHS,
    options,
    selected: mode === "basis" ? { near: quartersInOptions[0] || options[0] } : { near: nearYm, far: farYm, monthsApart },
    products,
  };
  cache.result[cacheKey] = { ts: Date.now(), data };
  return data;
});
