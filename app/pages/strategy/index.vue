<template>
  <div v-if="loaded" class="mx-auto max-w-[1560px] px-5 pb-16 pt-[18px] text-[#1f2329]"
       style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;font-size:13px;line-height:1.55;-webkit-font-smoothing:antialiased">
    <header class="mb-3.5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-[20px] font-[650] tracking-[-.2px]">ETF 期权策略分析看板
          <span class="ml-1 rounded bg-[#eef2fb] px-2 py-0.5 text-[11px] font-semibold text-[#2f6feb]">{{ model.valuationDate || '—' }}</span>
        </h1>
        <div v-if="U && E" class="mt-1 text-[12px] text-[#8f95a1]">
          {{ U.name }} · 现价 <b class="font-semibold text-[#1f2329]">{{ fmt(U.spot, 3) }}</b> ·
          近17日 <span :class="(U.hv.ret17 || 0) >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ sign(U.hv.ret17 || 0) }}{{ fmt(U.hv.ret17 || 0, 2) }}%</span>
          · 当前合约 {{ fmtExp(E.exp) }}（剩余 {{ E.days }} 天）
        </div>
      </div>
      <div class="text-right text-[11.5px] leading-[1.7] text-[#8f95a1]">
        数据源 data_etfoption.csv · {{ model.underlyings.length }} 标的 / {{ totalContracts }} 合约<br />
        历史：vixs.csv + 标的日线（截至 {{ maxTradeDate || '—' }}）
      </div>
    </header>

    <!-- 标的 / 到期月 切换 -->
    <div class="mb-3.5 flex flex-wrap items-center gap-8">
      <div class="w-full max-w-[640px]">
        <div class="mb-1.5 text-[11.5px] tracking-[.4px] text-[#8f95a1]">标的</div>
        <TabSelect :options="tabUOptions" v-model="selU" />
      </div>
      <div v-if="U" class="w-full max-w-[640px]">
        <div class="mb-1.5 text-[11.5px] tracking-[.4px] text-[#8f95a1]">到期月</div>
        <TabSelect :options="tabEOptions" v-model="selE" />
      </div>
    </div>

    <!-- 结论 -->
    <div v-if="verdictObj" class="mb-3.5 overflow-hidden rounded-[12px] border border-[#e3e6ea]"
         style="background:linear-gradient(135deg,#fff 0%,#fbfcfe 100%)">
      <div class="flex flex-wrap border-b border-[#eef0f3]">
        <div class="min-w-[180px] flex-1 border-r border-[#eef0f3] p-[16px_18px]">
          <div class="mb-1 text-[11.5px] text-[#8f95a1]">方向评分</div>
          <div class="text-[26px] font-bold tracking-[-1px]" :style="{ color: dirColor }">{{ sign(dirScore.score) }}{{ fmt(dirScore.score, 0) }}</div>
          <div class="mt-0.5 text-[12.5px] font-semibold" :style="{ color: dirColor }">{{ verdictObj.vd.D }}</div>
          <div class="relative mt-2.5 h-1.5 overflow-hidden rounded bg-[#eef0f3]">
            <i class="absolute top-0 h-full rounded" :style="{ left: dirMeter.left + '%', width: dirMeter.w + '%', background: dirColor }"></i>
          </div>
          <div class="mt-1.5 text-[11.5px] leading-[1.7] text-[#8f95a1]">－100 极空 ｜ 0 中性 ｜ +100 极多</div>
        </div>
        <div class="min-w-[180px] flex-1 border-r border-[#eef0f3] p-[16px_18px]">
          <div class="mb-1 text-[11.5px] text-[#8f95a1]">波动率评分</div>
          <div class="text-[26px] font-bold tracking-[-1px]" :style="{ color: volColor }">{{ sign(volScore.score) }}{{ fmt(volScore.score, 0) }}</div>
          <div class="mt-0.5 text-[12.5px] font-semibold" :style="{ color: volColor }">{{ verdictObj.vd.V }}</div>
          <div class="relative mt-2.5 h-1.5 overflow-hidden rounded bg-[#eef0f3]">
            <i class="absolute top-0 h-full rounded" :style="{ left: volMeter.left + '%', width: volMeter.w + '%', background: volColor }"></i>
          </div>
          <div class="mt-1.5 text-[11.5px] leading-[1.7] text-[#8f95a1]">－100 卖波动率 ｜ 0 中性 ｜ +100 买波动率</div>
        </div>
        <div class="min-w-[200px] flex-[1.6] p-[16px_18px]">
          <div class="mb-1 text-[11.5px] text-[#8f95a1]">核心判断</div>
          <div class="mt-0.5 text-[13px] leading-[1.75]">
            IV 历史分位 <b class="font-semibold">{{ U.ivPct ? fmt(U.ivPct.pct, 0) + '%' : '—' }}</b>，
            当前 ATM IV <b class="font-semibold">{{ fmt(E.atmIV, 2) }}</b> vs 预期实现波动率 <b class="font-semibold">{{ fmt(verdictObj.hf, 2) }}</b>，
            风险溢价 <b :style="{ color: verdictObj.vrp > 0 ? C_UP : C_DN }">{{ sign(verdictObj.vrp) }}{{ fmt(verdictObj.vrp, 2) }}</b> 点；
            期限结构 <b class="font-semibold">{{ verdictObj.far.atmIV < E.atmIV ? '倒挂' : '正向' }}</b>（{{ fmt(E.atmIV, 1) }}→{{ fmt(verdictObj.far.atmIV, 1) }}）；
            实现波动率近5日较17日 <b :style="{ color: (U.hv.rvTrend || 0) < 0 ? C_DN : C_UP }">{{ sign((U.hv.rvTrend || 0) * 100) }}{{ fmt((U.hv.rvTrend || 0) * 100, 1) }}%</b>。
          </div>
        </div>
      </div>
      <div class="p-[16px_18px]">
        <div class="mb-2 flex gap-2.5 rounded-[9px] border border-[#eef0f3] bg-[#f8f9fb] p-[11px_13px]">
          <div class="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px] bg-[#2f6feb] text-[11.5px] font-bold text-white">1</div>
          <div>
            <div class="text-[13px] font-semibold">首选：{{ STRATEGIES[verdictObj.vd.key].n }}</div>
            <div class="mt-0.5 text-[12px] text-[#5f6672]">{{ STRATEGIES[verdictObj.vd.key].d }}</div>
            <div class="mt-1 text-[12px] text-[#2f6feb]">建议腿：{{ verdictObj.legs1.map(legLabel).join('　｜　') }}</div>
          </div>
        </div>
        <div class="mb-2 flex gap-2.5 rounded-[9px] border border-[#eef0f3] bg-[#f8f9fb] p-[11px_13px]">
          <div class="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px] bg-[#8f95a1] text-[11.5px] font-bold text-white">2</div>
          <div>
            <div class="text-[13px] font-semibold">备选：{{ STRATEGIES[verdictObj.vd.alt].n }}</div>
            <div class="mt-0.5 text-[12px] text-[#5f6672]">{{ STRATEGIES[verdictObj.vd.alt].d }}</div>
          </div>
        </div>
        <div v-if="verdictObj.vd.caution" class="flex gap-2.5 rounded-[9px] border border-[#f6e2bd] p-[11px_13px]" style="background:#fffaf0">
          <div class="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px] bg-[#f5a623] text-[11.5px] font-bold text-white">!</div>
          <div>
            <div class="text-[13px] font-semibold">执行提醒</div>
            <div class="mt-0.5 text-[12px] text-[#5f6672]">{{ verdictObj.vd.caution }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- KPI -->
    <div class="mt-3.5 grid grid-cols-4 gap-3.5" v-if="kpiCards.length">
      <div v-for="(c, i) in kpiCards" :key="i" class="rounded-[9px] border border-[#e3e6ea] bg-white p-[11px_13px]">
        <div class="flex items-center justify-between text-[11.5px] text-[#8f95a1]"><span>{{ c[0] }}</span></div>
        <div class="mt-0.5 text-[20px] font-[650] tabular-nums tracking-[-.5px]" :class="c[3]">{{ c[1] }}</div>
        <div class="mt-px text-[11px] text-[#8f95a1]">{{ c[2] }}</div>
      </div>
    </div>

    <!-- 信号明细 -->
    <div class="mt-3.5 grid grid-cols-2 gap-3.5">
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold">
          <span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>方向信号分解
        </div>
        <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">正分看多、负分看空；加权后得到方向评分</div>
        <table>
          <thead><tr><th style="text-align: left">信号</th><th>取值</th><th>权重</th><th>得分</th><th style="width: 120px">强度</th></tr></thead>
          <tbody>
            <tr class="sigrow" v-for="(r, i) in dirRows" :key="i">
              <td :title="r.tip">{{ r.n }}</td><td>{{ r.v }}</td><td>{{ (r.w * 100).toFixed(0) }}%</td>
              <td :style="{ color: r.color, fontWeight: 600 }">{{ r.sLabel }}</td>
              <td><div style="display: flex; justify-content: center"><span class="bar" :style="{ width: r.barW + '%', background: r.color }"></span></div></td>
            </tr>
            <tr style="font-weight: 700">
              <td>加权方向评分</td><td colspan="2"></td>
              <td :style="{ color: dirColor }">{{ sign(dirScore.score) }}{{ fmt(dirScore.score, 1) }}</td><td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold">
          <span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>波动率信号分解
        </div>
        <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">负分＝卖波动率占优，正分＝买波动率占优</div>
        <table>
          <thead><tr><th style="text-align: left">信号</th><th>取值</th><th>权重</th><th>得分</th><th style="width: 120px">强度</th></tr></thead>
          <tbody>
            <tr class="sigrow" v-for="(r, i) in volRows" :key="i">
              <td :title="r.tip">{{ r.n }}</td><td>{{ r.v }}</td><td>{{ (r.w * 100).toFixed(0) }}%</td>
              <td :style="{ color: r.color, fontWeight: 600 }">{{ r.sLabel }}</td>
              <td><div style="display: flex; justify-content: center"><span class="bar" :style="{ width: r.barW + '%', background: r.color }"></span></div></td>
            </tr>
            <tr style="font-weight: 700">
              <td>加权波动率评分</td><td colspan="2"></td>
              <td :style="{ color: volColor }">{{ sign(volScore.score) }}{{ fmt(volScore.score, 1) }}</td><td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 图表网格 -->
    <div class="mt-3.5 grid grid-cols-2 gap-3.5">
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>波动率微笑 / 偏斜</div>
        <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">同一到期日下各行权价隐含波动率。左低右高＝看跌保护贵，曲线越弯＝尾部越贵</div>
        <VChart :option="smileOpt" autoresize class="chart" /></div>
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>波动率期限结构</div>
        <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">近月高于远月＝倒挂（市场紧张，近月贵）；反之为正向（Contango）</div>
        <VChart :option="termOpt" autoresize class="chart" /></div>
    </div>

    <div class="mt-3.5 grid grid-cols-2 gap-3.5">
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>波动率锥 Volatility Cone</div>
        <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">历史各窗口实现波动率分布（近3年）＋ 当前 IV 与近期实现波动率定位</div>
        <VChart :option="coneOpt" autoresize class="chart" /></div>
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>隐含波动率历史走势</div>
        <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">该标的 IV 指数历史序列（vixs.csv），红线为当前 ATM IV 所处水平</div>
        <VChart :option="ivHistOpt" autoresize class="chart" /></div>
    </div>

    <div class="mt-3.5 grid grid-cols-2 gap-3.5">
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#f5a623]"></span>持仓量分布与最大痛点</div>
        <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">认购向右、认沽向左；黄线为到期日全市场买方总亏损（最大痛点＝亏损最小处）</div>
        <VChart :option="oiOpt" autoresize class="chart tall" /></div>
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#f5a623]"></span>日增仓分布（资金流向）</div>
        <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">当日新增持仓，反映资金在哪些行权价上新建头寸</div>
        <VChart :option="doiOpt" autoresize class="chart tall" /></div>
    </div>

    <div class="mt-3.5 grid grid-cols-2 gap-3.5">
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#12a05c]"></span>Gamma 敞口 GEX</div>
        <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">按“做市商多认购、空认沽”假设。累计为正＝做市商多 Gamma，会抑制波动；为负＝放大波动</div>
        <VChart :option="gexOpt" autoresize class="chart tall" /></div>
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#12a05c]"></span>希腊字母沿行权价分布</div>
        <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">Delta / Gamma / Vega / Theta（每张每日元）随行权价的变化</div>
        <VChart :option="greeksOpt" autoresize class="chart tall" /></div>
    </div>

    <div class="mt-3.5 grid grid-cols-2 gap-3.5">
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>标的近期走势与波动</div>
        <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">近 17 个交易日日线（红涨绿跌）与成交量</div>
        <VChart :option="spotOpt" autoresize class="chart" /></div>
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>六标的横截面：IV vs 实现波动率</div>
        <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">位于对角线上方＝IV 高于实现波动率（卖方有溢价）；气泡大小＝总持仓量</div>
        <VChart :option="crossOpt" autoresize class="chart" /></div>
    </div>

    <div class="mt-3.5 grid grid-cols-2 gap-3.5">
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>策略象限图</div>
        <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">横轴方向评分、纵轴波动率评分，六个标的所处象限决定策略类型</div>
        <VChart :option="quadOpt" autoresize class="chart tall" /></div>
      <div class="rounded-[10px] border border-[#e3e6ea] bg-white p-4">
        <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>策略到期损益图</div>
        <div class="mb-2 flex flex-wrap items-center gap-2.5 pl-[11px]">
          <select v-model="selStg" class="rounded-[7px] border border-[#e3e6ea] bg-white px-2.5 py-1.5 text-[12.5px]">
            <option v-for="(s, k) in STRATEGIES" :key="k" :value="k">{{ s.n }}{{ k === recommendedKey ? '　★推荐' : '' }}</option>
          </select>
          <span class="text-[11.5px] leading-[1.7] text-[#8f95a1]">{{ legsC.map(legLabel).join('　') }}</span>
        </div>
        <VChart :option="payoffOpt" autoresize class="chart" style="height: 288px" /></div>
    </div>

    <!-- 策略排行 -->
    <div class="mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
      <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#7a5af8]"></span>六标的策略排行（近月合约）</div>
      <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">按波动率评分绝对值排序，越靠前越适合执行对应的波动率策略</div>
      <table>
        <thead><tr>
          <th style="text-align: left">标的</th><th>现价</th><th>近17日</th><th>平值IV</th><th>预期HV</th>
          <th>风险溢价</th><th>IV分位</th><th>期限结构</th><th>PCR</th><th>方向分</th><th>波动率分</th>
          <th style="text-align: left">建议策略</th>
        </tr></thead>
        <tbody>
          <tr v-for="r in rankRows" :key="r.u.code" :style="r.u.code === selU ? 'background:#f2f6ff;font-weight:600' : ''">
            <td style="text-align: left">{{ r.u.code === selU ? '▶ ' : '' }}{{ r.u.short }}</td>
            <td>{{ fmt(r.u.spot, 3) }}</td>
            <td :class="(r.u.hv.ret17 || 0) >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ sign(r.u.hv.ret17 || 0) }}{{ fmt(r.u.hv.ret17 || 0, 1) }}%</td>
            <td>{{ fmt(r.e.atmIV, 2) }}</td>
            <td>{{ fmt(r.hf, 2) }}</td>
            <td :class="r.vrp > 0 ? 'text-[#e02020]' : 'text-[#12a05c]'"><b>{{ sign(r.vrp) }}{{ fmt(r.vrp, 2) }}</b></td>
            <td>{{ r.u.ivPct ? fmt(r.u.ivPct.pct, 0) + '%' : '—' }}</td>
            <td :class="r.slope < 0 ? 'text-[#12a05c]' : 'text-[#e02020]'">{{ sign(r.slope * 100) }}{{ fmt(r.slope * 100, 1) }}%</td>
            <td>{{ fmt(r.e.oiPCR, 2) }}</td>
            <td :class="r.d > 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ sign(r.d) }}{{ fmt(r.d, 0) }}</td>
            <td :style="{ color: r.v < 0 ? C_PUR : C_WARN, fontWeight: 700 }">{{ sign(r.v) }}{{ fmt(r.v, 0) }}</td>
            <td style="text-align: left">{{ STRATEGIES[r.vd.key].n }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 策略 KPI -->
    <div class="mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
      <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>策略风险收益指标</div>
      <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">按当前盘口中值计价，合约乘数 {{ MULT }}，单位：元/组</div>
      <div class="grid grid-cols-4 gap-2.5" v-if="stgKpi.length">
        <div v-for="(k, i) in stgKpi" :key="i" class="rounded-[9px] border border-[#e3e6ea] bg-white p-[9px_11px]">
          <div class="text-[11.5px] text-[#8f95a1]">{{ k[0] }}</div>
          <div class="mt-0.5 text-[16px] font-[650] tabular-nums tracking-[-.5px]" :class="k[2]">{{ k[1] }}</div>
        </div>
      </div>
    </div>

    <!-- T 型报价表 -->
    <div class="mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
      <div class="mb-0.5 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#2f6feb]"></span>T 型报价表</div>
      <div class="mb-2 pl-[11px] text-[11.5px] text-[#8f95a1]">左侧认购 / 右侧认沽，黄色行为平值。杠杆＝真实杠杆，Theta 为每张每日时间价值损耗（元）</div>
      <div class="tw">
      <table>
        <thead>
          <tr>
            <th colspan="8" style="text-align: center; background: #fdeeee; color: #e02020">认购 CALL</th>
            <th style="text-align: center; background: #eef0f3">行权价</th>
            <th colspan="8" style="text-align: center; background: #eaf7f1; color: #12a05c">认沽 PUT</th>
          </tr>
          <tr>
            <th>Θ元/日</th><th>Vega</th><th>Γ</th><th>Δ</th><th>杠杆</th><th>日增仓</th><th>持仓量</th><th>最新/IV</th>
            <th class="kcol">K</th>
            <th>最新/IV</th><th>持仓量</th><th>日增仓</th><th>杠杆</th><th>Δ</th><th>Γ</th><th>Vega</th><th>Θ元/日</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in tRows" :key="b.K" :class="{ atm: b.K === E.atmK }">
            <td class="cside">{{ fmt(b.cTheta, 1) }}</td><td class="cside">{{ fmt(b.cVega, 3) }}</td>
            <td class="cside">{{ fmt(b.cGamma, 2) }}</td><td class="cside">{{ fmt(b.cDelta, 3) }}</td>
            <td class="cside">{{ fmt(b.cLev, 1) }}</td>
            <td class="cside" :class="b.cDOI >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ b.cDOI ? sign(b.cDOI) + b.cDOI : '—' }}</td>
            <td class="cside">{{ b.cOI || '—' }}</td>
            <td class="cside"><b :class="b.cChg >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ fmt(b.cLast, 4) }}</b> <span class="text-[#8f95a1]">{{ fmt(b.cIV, 1) }}</span></td>
            <td class="kcol">{{ fmt(b.K, 3) }}</td>
            <td class="pside"><b :class="b.pChg >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ fmt(b.pLast, 4) }}</b> <span class="text-[#8f95a1]">{{ fmt(b.pIV, 1) }}</span></td>
            <td class="pside">{{ b.pOI || '—' }}</td>
            <td class="pside" :class="b.pDOI >= 0 ? 'text-[#e02020]' : 'text-[#12a05c]'">{{ b.pDOI ? sign(b.pDOI) + b.pDOI : '—' }}</td>
            <td class="pside">{{ fmt(b.pLev, 1) }}</td><td class="pside">{{ fmt(b.pDelta, 3) }}</td>
            <td class="pside">{{ fmt(b.pGamma, 2) }}</td><td class="pside">{{ fmt(b.pVega, 3) }}</td>
            <td class="pside">{{ fmt(b.pTheta, 1) }}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- 口径 -->
    <div class="mt-3.5 rounded-[10px] border border-[#e3e6ea] bg-white p-4">
      <div class="mb-2 flex items-center gap-2 text-[13.5px] font-semibold"><span class="h-[13px] w-[3px] rounded-[2px] bg-[#8f95a1]"></span>指标口径与风险提示</div>
      <div class="text-[11.5px] leading-[1.7] text-[#8f95a1]">
        <div class="grid grid-cols-2 gap-[18px]">
          <div>
            <b class="text-[#5f6672]">波动率口径</b><br />
            · <b class="text-[#5f6672]">预期实现波动率</b> = 0.6 × 近5日已实现波动率 + 0.4 × 综合HV（Parkinson 50% / 收盘 20%），当前 {{ fmt(verdictObj ? verdictObj.hf : 0, 2) }}。<br />
            · <b class="text-[#5f6672]">VRP</b> = 平值 IV － 预期实现波动率。为正说明期权卖方收到的溢价高于标的实际波动，是卖波动率的安全垫。<br />
            · <b class="text-[#5f6672]">IV 历史分位</b> 取自 vixs.csv 近 3 年分布（序列截至 {{ maxTradeDate || '—' }}）。<br />
            · <b class="text-[#5f6672]">波动率锥</b> 用标的日线（截至 {{ maxTradeDate || '—' }}）近 3 年滚动 HV 的分位数绘制。<br /><br />
            <b class="text-[#5f6672]">希腊字母口径</b><br />
            · Vega 为 IV 变动 100% 的价格变化，图表中 <b class="text-[#5f6672]">Vega×100</b> 即 IV 每上升 1 个点每张合约的盈亏（元）。<br />
            · Theta 原始值为年化，表中已换算为 <b class="text-[#5f6672]">每张每日</b>（÷365×10000）。<br />
            · Gamma 为标的每变动 1 元 Delta 的变化量。
          </div>
          <div>
            <b class="text-[#5f6672]">结构指标</b><br />
            · <b class="text-[#5f6672]">最大痛点</b>：使全体期权买方到期总内在价值最小的行权价，常被视为到期日的“引力位”。<br />
            · <b class="text-[#5f6672]">GEX</b>：Σ(Γ<sub>认购</sub>×持仓 － Γ<sub>认沽</sub>×持仓)×10000×S²×1%，采用“做市商多认购、空认沽”的常规假设。<br />
            · <b class="text-[#5f6672]">25Δ 风险逆转</b>：|Δ|=0.25 处认购 IV － 认沽 IV，用 Delta 线性插值得到。股指期权常态在 ATM 的 −10% 左右。<br /><br />
            <b style="color: #e02020">风险提示</b><br />
            本页所有评分为基于单日快照的量化打分，不构成投资建议。缺失历史数据的标的，相关波动率图表会显示“无历史数据”。卖出波动率策略存在无限风险，务必使用价差结构或严格止损。
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="mx-auto max-w-[1560px] px-5 py-20 text-center text-[#8f95a1]">
    <div v-if="loadError" style="color: #e02020">{{ loadError }}</div>
    <div v-else>数据加载中…（若作为页面独立运行，将自动拉取 /data_etfoption.csv 与历史文件）</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import Papa from 'papaparse'
import TabSelect from '~/components/TabSelect.vue'
import { OPTIONS_MAP, fields_dict } from '~/data'

const props = defineProps({
  // 经 CSV + 字典处理后的期权链，元素形如 { 最新价, 期权名称, 隐波, 行权价, 到期日, Delta, ... }
  data: { type: Array, default: () => [] },
  // 可选：直接传入历史数据 { [code]: { closes:[{d,o,h,l,c,v}], ivHist:[{d,v}], longHV:{cone} } }
  history: { type: Object, default: null },
  valuationDate: { type: String, default: '' },
  multiplier: { type: Number, default: 10000 },
})

/* ============ 常量 ============ */
const MULT = computed(() => props.multiplier || 10000)
const C_UP = '#e02020', C_DN = '#12a05c', C_ACC = '#2f6feb', C_PUR = '#7a5af8', C_WARN = '#f5a623'
const AXIS = { axisLine: { lineStyle: { color: '#dfe3e8' } }, axisLabel: { color: '#8f95a1', fontSize: 11 },
  splitLine: { lineStyle: { color: '#f0f2f5' } }, nameTextStyle: { color: '#8f95a1', fontSize: 11 } }
const BASE_OPT = { grid: { left: 52, right: 52, top: 34, bottom: 34 },
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#e3e6ea', borderWidth: 1,
    textStyle: { color: '#1f2329', fontSize: 12 }, extraCssText: 'box-shadow:0 4px 18px rgba(0,0,0,.09);border-radius:8px' },
  legend: { top: 2, textStyle: { color: '#5f6672', fontSize: 11 }, itemWidth: 14, itemHeight: 8, itemGap: 14 } }

/* ============ 工具 ============ */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const fmt = (v, d = 2) => (v === null || v === undefined || isNaN(v)) ? '—' : Number(v).toFixed(d)
const wan = (v) => Math.abs(v) >= 1e8 ? (v / 1e8).toFixed(2) + '亿' : Math.abs(v) >= 1e4 ? (v / 1e4).toFixed(1) + '万' : Math.round(v)
const sign = (v) => (v > 0 ? '+' : '')
const pstdev = (a) => { if (!a.length) return 0; const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length) }
const parseDate = (s) => { if (!s) return null; s = String(s).replace(/-/g, ''); if (s.length >= 8) return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)); return null }
const daysBetween = (a, b) => { const da = parseDate(a), db = parseDate(b); if (!da || !db) return 30; return Math.round((db - da) / 86400000) }

function ncdf(x) {
  const a1 = .254829592, a2 = -.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = .3275911
  const s = x < 0 ? -1 : 1; x = Math.abs(x) / Math.SQRT2; const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return .5 * (1 + s * y)
}
function bs(S, K, T, sig, type, r = 0.015) {
  if (T <= 1e-6 || sig <= 0) return type === 'C' ? Math.max(0, S - K) : Math.max(0, K - S)
  const d1 = (Math.log(S / K) + (r + sig * sig / 2) * T) / (sig * Math.sqrt(T))
  const d2 = d1 - sig * Math.sqrt(T)
  return type === 'C' ? S * ncdf(d1) - K * Math.exp(-r * T) * ncdf(d2) : K * Math.exp(-r * T) * ncdf(-d2) - S * ncdf(-d1)
}

/* ============ 字段解析（业务字段 -> 中文名，中文名由 fields_dict 映射为 f 编号） ============ */
const CODE2F = Object.fromEntries(Object.entries(fields_dict).map(([f, cn]) => [cn, f]))
const MAP = {
  name: '期权名称', code: '期权代码', last: '最新价', prev: '昨收', bid: '买一', ask: '卖一',
  oi: '持仓量', doi: '日增量', iv: '隐波', prem: '溢价率', K: '行权价', exp: '到期日',
  lev: '杠杆', delta: 'Delta', gamma: 'Gamma', vega: 'Vega', theta: 'Theta',
  spot: '正股价格', uname: '正股',
}
// 业务字段 -> f 编号（fields_dict 未覆盖的字段回退为其中文名）
const F = (key) => CODE2F[MAP[key]]
const pick = (row, key, d = null) => {
  const names = [F(key), MAP[key]].filter(Boolean)
  for (const n of names) {
    const raw = row[n]
    if (raw !== undefined && raw !== null && raw !== '') { const num = parseFloat(raw); if (!isNaN(num)) return num }
  }
  return d
}
const pickStr = (row, key, d = '') => {
  const names = [F(key), MAP[key]].filter(Boolean)
  for (const n of names) { const raw = row[n]; if (raw !== undefined && raw !== null && raw !== '') return String(raw) }
  return d
}

const NAME2CODE = {
  '上证50ETF华夏': '510050', '沪深300ETF华泰柏瑞': '510300', '中证500ETF南方': '510500',
  '中证500ETF嘉实': '159922', '创业板ETF易方达': '159915', '科创50ETF华夏': '588000',
}
const SHORT = { '510050': '上证50ETF', '510300': '沪深300ETF', '510500': '沪500ETF', '159922': '深500ETF', '159915': '创业板ETF', '588000': '科创50ETF' }

/* ============ 状态 ============ */
const model = ref({ underlyings: [], chain: [], valuationDate: '', multiplier: 10000 })
const loaded = ref(false)
const loadError = ref('')
const valDate = ref(props.valuationDate || '')
const maxTradeDate = ref('')
const selU = ref(null)
const selE = ref(null)
const selStg = ref(null)
const ivHistStore = reactive({})
const dailyStore = reactive({})

const tabUOptions = computed(() => {
  const order = OPTIONS_MAP.map(o => o.code)
  return [...model.value.underlyings]
    .sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code))
    .map(u => ({ value: u.code, label: u.short }))
})
const tabEOptions = computed(() =>
  (U.value ? U.value.expiries : []).map(e => ({ value: e.exp, label: `${fmtExp(e.exp)} · ${e.days}天` }))
)

const totalContracts = computed(() => model.value.chain.length)
const U = computed(() => model.value.underlyings.find(x => x.code === selU.value) || model.value.underlyings[0] || null)
const E = computed(() => { const u = U.value; if (!u) return null; return u.expiries.find(x => x.exp === selE.value) || u.expiries[0] || null })

/* ============ 解析期权链 ============ */
function parseChain(rows) {
  const chain = []
  rows.forEach((r) => {
    const name = pickStr(r, 'name')
    let type = null
    if (name.includes('购')) type = 'C'; else if (name.includes('沽')) type = 'P'
    if (!type) return
    const uname = pickStr(r, 'uname')
    const code = pickStr(r, 'code') || NAME2CODE[uname] || null
    const K = pick(r, 'K'), last = pick(r, 'last'), prev = pick(r, 'prev')
    const bid = pick(r, 'bid'), ask = pick(r, 'ask')
    const oi = pick(r, 'oi'), doi = pick(r, 'doi')
    const iv = pick(r, 'iv'), prem = pick(r, 'prem')
    const exp = pickStr(r, 'exp'), lev = pick(r, 'lev')
    const delta = pick(r, 'delta'), gamma = pick(r, 'gamma'), vega = pick(r, 'vega'), theta = pick(r, 'theta')
    const spot = pick(r, 'spot')
    let L = last; if (L == null || isNaN(L)) L = (!isNaN(bid) && bid != null) ? bid : (!isNaN(ask) && ask != null) ? ask : (prev || 0)
    let P = prev; if (P == null || isNaN(P)) P = L
    const chg = P ? (L - P) / P * 100 : 0
    const intrinsic = Math.max(0, (spot - K) * (type === 'C' ? 1 : -1))
    const timeval = L - intrinsic
    const thetaYuan = (theta || 0) / 365 * MULT.value
    const vegaYuan = (vega || 0) * MULT.value * 0.01
    chain.push({ u: code, uname, name, type, K, L, P, bid, ask, oi: oi || 0, doi: doi || 0, iv, prem,
      exp, lev, delta: delta || 0, gamma: gamma || 0, vega: vega || 0, theta: theta || 0, spot,
      intrinsic, timeval, chg, thetaYuan, vegaYuan })
  })
  const byU = {}
  chain.forEach(c => { (byU[c.u] = byU[c.u] || []).push(c) })
  const underlyings = Object.keys(byU).map((code) => {
    const items = byU[code]; const uname = items[0].uname; const spot = items[0].spot
    const expiries = [...new Set(items.map(x => x.exp))].sort().map((exp) => {
      const sub = items.filter(x => x.exp === exp)
      const strikes = [...new Set(sub.map(x => x.K))].sort((a, b) => a - b)
      const cmap = {}, pmap = {}
      sub.forEach(x => { (x.type === 'C' ? cmap : pmap)[x.K] = x })
      const atmK = strikes.reduce((a, b) => Math.abs(b - spot) < Math.abs(a - spot) ? b : a, strikes[0])
      const cc = cmap[atmK], pp = pmap[atmK]
      const ivs = [cc, pp].filter(x => x && x.iv).map(x => x.iv)
      const atmIV = ivs.length ? ivs.reduce((a, b) => a + b, 0) / ivs.length : null
      const ivc25 = interpDelta(sub.filter(x => x.type === 'C').map(x => [Math.abs(x.delta), x.iv]))
      const ivp25 = interpDelta(sub.filter(x => x.type === 'P').map(x => [Math.abs(x.delta), x.iv]))
      const rr25 = (ivc25 != null && ivp25 != null) ? ivc25 - ivp25 : null
      const bf25 = (ivc25 != null && ivp25 != null && atmIV != null) ? (ivc25 + ivp25) / 2 - atmIV : null
      const callOI = sub.filter(x => x.type === 'C').reduce((a, x) => a + x.oi, 0)
      const putOI = sub.filter(x => x.type === 'P').reduce((a, x) => a + x.oi, 0)
      const callDOI = sub.filter(x => x.type === 'C').reduce((a, x) => a + x.doi, 0)
      const putDOI = sub.filter(x => x.type === 'P').reduce((a, x) => a + x.doi, 0)
      const pain = strikes.map(K => { let pay = 0; sub.forEach(x => { pay += (x.type === 'C' ? Math.max(0, K - x.K) : Math.max(0, x.K - K)) * x.oi }); return { K, pain: pay * MULT.value } })
      const maxPain = pain.reduce((a, b) => a.pain < b.pain ? a : b).K
      const byStrike = strikes.map(K => {
        const c_ = cmap[K], p_ = pmap[K]
        const gexC = (c_ && c_.gamma) ? c_.gamma * c_.oi * MULT.value * spot * spot * 0.01 : 0
        const gexP = (p_ && p_.gamma) ? p_.gamma * p_.oi * MULT.value * spot * spot * 0.01 : 0
        return { K,
          cIV: c_ ? c_.iv : null, pIV: p_ ? p_.iv : null,
          cOI: c_ ? c_.oi : 0, pOI: p_ ? p_.oi : 0, cDOI: c_ ? c_.doi : 0, pDOI: p_ ? p_.doi : 0,
          cLast: c_ ? c_.L : null, pLast: p_ ? p_.L : null,
          cChg: c_ ? +c_.chg.toFixed(2) : null, pChg: p_ ? +p_.chg.toFixed(2) : null,
          cDelta: c_ ? c_.delta : null, pDelta: p_ ? p_.delta : null,
          cGamma: c_ ? c_.gamma : null, pGamma: p_ ? p_.gamma : null,
          cVega: c_ ? c_.vega : null, pVega: p_ ? p_.vega : null,
          cTheta: c_ ? +c_.thetaYuan.toFixed(2) : null, pTheta: p_ ? +p_.thetaYuan.toFixed(2) : null,
          cLev: c_ ? c_.lev : null, pLev: p_ ? p_.lev : null,
          cPrem: c_ ? c_.prem : null, pPrem: p_ ? p_.prem : null,
          cTV: c_ ? +c_.timeval.toFixed(4) : null, pTV: p_ ? +p_.timeval.toFixed(4) : null,
          gexC, gexP, netGex: gexC - gexP }
      })
      const netDelta = sub.reduce((a, x) => a + (x.delta || 0) * x.oi, 0)
      const netGex = byStrike.reduce((a, b) => a + b.netGex, 0)
      let cum = 0, flip = null, pr = null
      byStrike.forEach(b => { cum += b.netGex; if (pr != null && pr < 0 && cum >= 0) flip = b.K; pr = cum })
      return { exp, days: valDate.value ? daysBetween(valDate.value, exp) : 30, atmK, atmIV, ivc25, ivp25, rr25, bf25,
        callOI, putOI, oiPCR: callOI ? putOI / callOI : null, callDOI, putDOI, doiPCR: callDOI > 0 ? putDOI / callDOI : null,
        maxPain, painCurve: pain, byStrike, netDelta, netGex, gammaFlip: flip, totalOI: callOI + putOI }
    })
    const totalOI = expiries.reduce((a, e) => a + e.totalOI, 0)
    return { code, name: uname, short: SHORT[code] || uname, spot, hv: {}, longHV: null, ivHist: [], ivPct: null, expiries, totalOI }
  })
  underlyings.sort((a, b) => b.totalOI - a.totalOI)
  return { underlyings, chain, valuationDate: valDate.value || props.valuationDate || '', multiplier: MULT.value }
}
function interpDelta(pts, target = 0.25) {
  const a = pts.filter(p => p[0] && p[1] && p[0] > 0.01 && p[0] < 0.99).sort((x, y) => x[0] - y[0])
  if (a.length < 2) return a.length ? a[0][1] : null
  if (target <= a[0][0]) return a[0][1]
  if (target >= a[a.length - 1][0]) return a[a.length - 1][1]
  for (let i = 1; i < a.length; i++) {
    if (a[i][0] >= target) {
      const [a0, i0] = a[i - 1], [a1, i1] = a[i]
      if (a1 === a0) return i1
      return i0 + (i1 - i0) * (target - a0) / (a1 - a0)
    }
  }
  return null
}

/* ============ 历史数据加载与加工 ============ */
async function loadChain() {
  if (props.data && props.data.length) { buildFromRows(props.data); return }
  try {
    const res = await fetch('/data_etfoption.csv')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const txt = await res.text()
    const rows = Papa.parse(txt, { header: true, skipEmptyLines: true }).data
    buildFromRows(rows)
  } catch (e) { loadError.value = '无法加载期权链数据：' + e.message }
}
function buildFromRows(rows) {
  model.value = parseChain(rows)
  loaded.value = true
  if (selU.value == null && model.value.underlyings[0]) selU.value = model.value.underlyings[0].code
  const u = U.value
  if (u && !selE.value) selE.value = u.expiries[0].exp
}
async function loadHistory() {
  const codes = model.value.underlyings.map(u => u.code)
  try {
    const res = await fetch('/vixs.csv'); const txt = await res.text()
    const rows = Papa.parse(txt, { header: true, skipEmptyLines: true }).data
    rows.forEach((r) => {
      const d = r.time; if (!d) return
      const code = r.code
      const v = parseFloat(r.close)
      if (code && v > 1 && v < 200) (ivHistStore[code] = ivHistStore[code] || []).push({ d, v })
    })
  } catch (e) { /* IV 历史缺失则降级 */ }
  await Promise.all(codes.map(async (code) => {
    try {
      const res = await fetch('/' + code + '.csv'); if (!res.ok) return
      const txt = await res.text()
      const rows = Papa.parse(txt, { header: true, skipEmptyLines: true }).data.filter(r => r.close)
      dailyStore[code] = rows.map(r => ({ d: r.trade_date, o: +r.open, h: +r.high, l: +r.low, c: +r.close, v: +r.volume || 0 }))
    } catch (e) { /* 无日线则降级 */ }
  }))
  let md = null
  codes.forEach(c => (dailyStore[c] || []).forEach(x => { if (!md || x.d > md) md = x.d }))
  if (md) { maxTradeDate.value = md; valDate.value = md; recomputeDays() }
  model.value.underlyings.forEach(enrichUnderlying)
}
function recomputeDays() {
  if (!valDate.value) return
  model.value.underlyings.forEach(u => u.expiries.forEach(e => { e.days = daysBetween(valDate.value, e.exp) }))
}
function applyHistory(h) {
  Object.keys(h || {}).forEach((code) => {
    const u = model.value.underlyings.find(x => x.code === code); if (!u) return
    const o = h[code]
    if (o.closes) dailyStore[code] = o.closes
    if (o.ivHist) ivHistStore[code] = o.ivHist
    if (o.longHV) u.longHV = o.longHV
    enrichUnderlying(u)
  })
  let md = null
  model.value.underlyings.forEach(u => (dailyStore[u.code] || []).forEach(x => { if (!md || x.d > md) md = x.d }))
  if (md) { maxTradeDate.value = md; if (!valDate.value) { valDate.value = md; recomputeDays() } }
}
function enrichUnderlying(u) {
  const code = u.code
  const ds = (dailyStore[code] || []).slice().sort((a, b) => a.d < b.d ? -1 : 1)
  const hv = {}
  if (ds.length >= 5) {
    const cl = ds.map(x => x.c)
    const rets = []
    for (let i = 1; i < cl.length; i++) if (cl[i - 1] > 0) rets.push(Math.log(cl[i] / cl[i - 1]))
    hv.hvCC = pstdev(rets) * Math.sqrt(252) * 100
    const pk = ds.filter(x => x.l > 0).map(x => (Math.log(x.h / x.l) ** 2) / (4 * Math.log(2)))
    hv.hvPark = Math.sqrt(pk.reduce((a, b) => a + b, 0) / pk.length) * Math.sqrt(252) * 100
    if (rets.length >= 5) { hv.hv5 = pstdev(rets.slice(-5)) * Math.sqrt(252) * 100; hv.hv10 = pstdev(rets.slice(-10)) * Math.sqrt(252) * 100; hv.rv5 = hv.hv5 }
    hv.hvBlend = 0.5 * hv.hvPark + (hv.rv5 ? 0.3 * hv.rv5 : 0.3 * hv.hvPark) + 0.2 * (hv.hvCC || hv.hvPark)
    hv.rvTrend = (hv.rv5 && hv.hvCC) ? hv.rv5 / hv.hvCC - 1 : 0
    hv.ret17 = ds.length >= 17 ? (cl[cl.length - 1] / cl[cl.length - 17] - 1) * 100 : (cl[cl.length - 1] / cl[0] - 1) * 100
    hv.ma5 = cl.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, cl.length)
    hv.ma10 = cl.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, cl.length)
    hv.last = cl[cl.length - 1]
    hv.closes = ds.map(x => ({ d: x.d, o: x.o, h: x.h, l: x.l, c: x.c, v: x.v }))
  }
  u.hv = hv
  if (ds.length >= 400) {
    const cl = ds.map(x => x.c); const rets = []
    for (let i = 1; i < cl.length; i++) if (cl[i - 1] > 0) rets.push(Math.log(cl[i] / cl[i - 1]))
    const cone = [5, 10, 20, 40, 60, 120, 250].map((win) => {
      const hs = []
      for (let i = win; i < rets.length; i++) hs.push(pstdev(rets.slice(i - win, i)) * Math.sqrt(252) * 100)
      const tail = hs.slice(-750); const s = tail.slice().sort((a, b) => a - b); const n = s.length
      return { win, min: s[0], p10: s[Math.floor(n / 10)], p25: s[Math.floor(n / 4)], median: s[Math.floor(n / 2)],
        p75: s[Math.floor(3 * n / 4)], p90: s[Math.floor(9 * n / 10)], max: s[n - 1], cur: tail[tail.length - 1] }
    })
    u.longHV = { cone, endDate: ds[ds.length - 1].d }
  } else u.longHV = null
  const ih = (ivHistStore[code] || []).slice(-750)
  u.ivHist = ih
  if (ih.length && u.expiries[0] && u.expiries[0].atmIV != null) {
    const vals = ih.map(x => x.v); const s = vals.slice().sort((a, b) => a - b); const n = s.length
    const below = vals.filter(v => v < u.expiries[0].atmIV).length
    u.ivPct = { pct: below / n * 100, n, median: s[Math.floor(n / 2)], p10: s[Math.floor(n / 10)],
      p90: s[Math.floor(9 * n / 10)], min: s[0], max: s[n - 1], last: ih[ih.length - 1].v, lastDate: ih[ih.length - 1].d }
  } else u.ivPct = null
}

/* ============ 评分引擎 ============ */
function hvFair(u) { const h = u.hv || {}; const fast = h.rv5 || h.hvRV || h.hvPark || 0; const slow = h.hvBlend || h.hvPark || 0; return .6 * fast + .4 * slow }
function scoreDir(u, e) {
  const S = u.spot, h = u.hv || {}; const S_ = []
  const trend = (S / (h.ma10 || S) - 1)
  S_.push({ n: '趋势动量（现价 / MA10）', v: sign(trend * 100) + fmt(trend * 100, 2) + '%', w: .35, s: clamp(trend * 1500, -100, 100), t: '价格在均线下方＝下行趋势' })
  const mp = (e.maxPain / S - 1)
  S_.push({ n: '最大痛点引力', v: '最大痛点 ' + fmt(e.maxPain, 3) + '（' + sign(mp * 100) + fmt(mp * 100, 2) + '%）', w: .20, s: clamp(mp * 1500, -100, 100), t: '现价低于最大痛点，到期前有向上牵引' })
  const rrn = (e.rr25 != null && e.atmIV) ? e.rr25 / e.atmIV : null
  S_.push({ n: '25Δ 风险逆转（偏斜）', v: rrn == null ? '—' : fmt(e.rr25, 2) + '（/ATM＝' + fmt(rrn * 100, 1) + '%）', w: .20, s: rrn == null ? null : clamp((rrn + 0.10) * 800, -100, 100), t: '偏斜比常态(-10%)更陡＝恐慌，更平＝乐观' })
  const dp = e.doiPCR
  S_.push({ n: '新增持仓 PCR（认沽/认购）', v: (dp == null) ? '—' : fmt(dp, 2), w: .15, s: (dp == null) ? null : clamp((1 - dp) * 150, -100, 100), t: '＜1＝当日新开仓以认购为主' })
  const nd = e.netDelta / (e.totalOI || 1)
  S_.push({ n: '持仓加权净 Delta', v: wan(e.netDelta) + '（单位持仓 ' + fmt(nd, 3) + '）', w: .10, s: clamp(nd * 300, -100, 100), t: '全市场持仓的方向暴露' })
  let tot = 0, wt = 0; S_.forEach(x => { if (x.s != null) { tot += x.s * x.w; wt += x.w } })
  return { items: S_, score: wt ? tot / wt : 0 }
}
function scoreVol(u, e) {
  const S_ = [], far = u.expiries[u.expiries.length - 1], hf = hvFair(u)
  const p = u.ivPct ? u.ivPct.pct : null
  S_.push({ n: 'IV 历史分位（近3年）', v: p == null ? '无历史数据' : fmt(p, 0) + '%', w: .30, s: p == null ? null : -(p - 50) / 50 * 100, t: '分位越高，卖波动率越占优' })
  const vrp = e.atmIV - hf
  S_.push({ n: '波动率风险溢价 VRP', v: sign(vrp) + fmt(vrp, 2) + ' 点（IV ' + fmt(e.atmIV, 1) + ' － 预期HV ' + fmt(hf, 1) + '）', w: .30, s: -clamp(vrp / (e.atmIV || 1) * 400, -100, 100), t: 'IV 高于预期实现波动率＝卖方有安全垫' })
  const slope = (far.atmIV - e.atmIV) / e.atmIV
  S_.push({ n: '期限结构斜率', v: fmt(e.atmIV, 1) + ' → ' + fmt(far.atmIV, 1) + '（' + sign(slope * 100) + fmt(slope * 100, 1) + '%）', w: .20, s: clamp(slope * 400, -100, 100), t: '倒挂＝近月被抢，卖近月买远月占优' })
  const rt = (u.hv && u.hv.rvTrend) || 0
  S_.push({ n: '实现波动率动量（近5日 vs 17日）', v: sign(rt * 100) + fmt(rt * 100, 1) + '%', w: .20, s: clamp(rt * 500, -100, 100), t: '实现波动率回落中＝IV 后续大概率跟跌' })
  let tot = 0, wt = 0; S_.forEach(x => { if (x.s != null) { tot += x.s * x.w; wt += x.w } })
  return { items: S_, score: wt ? tot / wt : 0 }
}
function ctxOf(u, e) { const far = u.expiries[u.expiries.length - 1]; return { vrp: e.atmIV - hvFair(u), slope: (far.atmIV - e.atmIV) / e.atmIV, days: e.days } }
function verdictOf(d, v, ctx) {
  ctx = ctx || {}
  const D = Math.abs(d) < 18 ? '中性' : (d > 0 ? (d > 45 ? '偏多' : '略偏多') : (d < -45 ? '偏空' : '略偏空'))
  const V = Math.abs(v) < 18 ? '波动率中性' : (v < 0 ? (v < -45 ? '强烈做空波动率' : '做空波动率') : (v > 45 ? '强烈做多波动率' : '做多波动率'))
  const vrp = ctx.vrp === undefined ? 1 : ctx.vrp
  let key, alt, caution = ''
  if (Math.abs(d) < 18) {
    if (v <= -18) {
      if (vrp <= 0) { key = 'calendar'; alt = 'iron_condor'; caution = '该标的 IV 仍低于预期实现波动率，净卖出波动率没有安全垫。倒挂的期限结构才是可利用的部分，优先用卖近买远的日历结构，而不是直接卖 Gamma。' }
      else if (v <= -45) { key = 'iron_condor'; alt = 'short_strangle'; caution = '铁鹰是风险有限版本；若保证金充裕且愿意承担尾部风险，可用卖出宽跨式提高收益率，但必须设置止损。' }
      else { key = 'iron_condor'; alt = 'calendar' }
    } else if (v >= 18) { key = 'long_straddle'; alt = 'long_strangle'; caution = '买入波动率的最大敌人是时间价值损耗，需要标的在较短时间内出现方向性突破。' }
    else { key = 'iron_condor'; alt = 'calendar'; caution = '方向与波动率信号都不明确，建议轻仓或观望。' }
  } else if (d >= 18) {
    if (v <= -18) { key = 'bull_put'; alt = 'short_put'; caution = '看多且波动率贵：用卖出认沽价差同时赚方向与时间价值，比直接买认购更划算。' }
    else { key = 'long_call'; alt = 'call_spread' }
  } else {
    if (v <= -18) { key = 'bear_call'; alt = 'covered_call'; caution = '看空且波动率贵：卖出认购价差优于买入认沽。' }
    else { key = 'long_put'; alt = 'put_spread' }
  }
  return { D, V, key, alt, caution }
}

/* ============ 策略构造 ============ */
function pickByDelta(rows, type, target) {
  let best = null, bd = 9
  rows.forEach(r => {
    const dl = type === 'C' ? r.cDelta : r.pDelta; const px = type === 'C' ? r.cLast : r.pLast
    if (dl == null || px == null || !px) return
    const a = Math.abs(Math.abs(dl) - target)
    if (a < bd) { bd = a; best = r }
  })
  return best
}
function leg(row, type, qty, days) {
  if (!row) return null
  const px = type === 'C' ? row.cLast : row.pLast
  const iv = type === 'C' ? row.cIV : row.pIV
  const ivv = (iv != null ? iv : (type === 'C' ? row.pIV : row.cIV)) || 20
  return { type, K: row.K, px, qty, iv: ivv / 100, t: days }
}
function underLeg(u, qty) { return { type: 'S', K: 0, px: u.spot, qty, iv: 0, t: 1e9 } }
const STRATEGIES = {
  short_strangle: { n: '卖出宽跨式 Short Strangle', d: '同时卖出虚值认购与虚值认沽，赚取双边时间价值，需承担两侧尾部风险', build: (r, e) => [leg(pickByDelta(r, 'C', .25), 'C', -1), leg(pickByDelta(r, 'P', .25), 'P', -1)] },
  iron_condor: { n: '铁鹰式 Iron Condor', d: '卖宽跨式并买入更虚值的两翼作保护，风险有限、收益有限的做空波动率结构', build: (r, e) => [leg(pickByDelta(r, 'C', .25), 'C', -1), leg(pickByDelta(r, 'C', .10), 'C', 1), leg(pickByDelta(r, 'P', .25), 'P', -1), leg(pickByDelta(r, 'P', .10), 'P', 1)] },
  short_straddle: { n: '卖出跨式 Short Straddle', d: '卖出平值认购＋认沽，时间价值收入最大，Gamma 风险也最大', build: (r, e) => [leg(pickByDelta(r, 'C', .50), 'C', -1), leg(pickByDelta(r, 'P', .50), 'P', -1)] },
  long_straddle: { n: '买入跨式 Long Straddle', d: '买入平值认购＋认沽，做多波动率，需要标的大幅单边或波动率抬升', build: (r, e) => [leg(pickByDelta(r, 'C', .50), 'C', 1), leg(pickByDelta(r, 'P', .50), 'P', 1)] },
  long_strangle: { n: '买入宽跨式 Long Strangle', d: '买入虚值认购＋认沽，成本低于跨式，需要更大波幅', build: (r, e) => [leg(pickByDelta(r, 'C', .25), 'C', 1), leg(pickByDelta(r, 'P', .25), 'P', 1)] },
  bull_put: { n: '牛市看跌价差 Bull Put Spread', d: '卖出较高行权价认沽、买入较低行权价认沽，温和看多＋收时间价值，风险有限', build: (r, e) => [leg(pickByDelta(r, 'P', .35), 'P', -1), leg(pickByDelta(r, 'P', .15), 'P', 1)] },
  bear_call: { n: '熊市看涨价差 Bear Call Spread', d: '卖出较低行权价认购、买入较高行权价认购，温和看空＋收时间价值，风险有限', build: (r, e) => [leg(pickByDelta(r, 'C', .35), 'C', -1), leg(pickByDelta(r, 'C', .15), 'C', 1)] },
  long_call: { n: '买入认购 Long Call', d: '方向性做多，损失有限、收益无限，但需承受时间价值损耗与 IV 回落', build: (r, e) => [leg(pickByDelta(r, 'C', .45), 'C', 1)] },
  long_put: { n: '买入认沽 Long Put', d: '方向性做空 / 组合保险，损失有限', build: (r, e) => [leg(pickByDelta(r, 'P', .45), 'P', 1)] },
  call_spread: { n: '牛市看涨价差 Bull Call Spread', d: '买低卖高认购，降低权利金成本，适合 IV 偏高时的温和看多', build: (r, e) => [leg(pickByDelta(r, 'C', .45), 'C', 1), leg(pickByDelta(r, 'C', .20), 'C', -1)] },
  put_spread: { n: '熊市看跌价差 Bear Put Spread', d: '买高卖低认沽，降低成本的温和看空', build: (r, e) => [leg(pickByDelta(r, 'P', .45), 'P', 1), leg(pickByDelta(r, 'P', .20), 'P', -1)] },
  short_put: { n: '卖出认沽 Short Put', d: '看不跌，收时间价值，下方需备足资金准备接货', build: (r, e) => [leg(pickByDelta(r, 'P', .30), 'P', -1)] },
  covered_call: { n: '备兑开仓 Covered Call', d: '持有 10000 份标的＋卖出虚值认购，增强收益、降低持仓成本，放弃大涨空间', build: (r, e, u) => [underLeg(u, 1), leg(pickByDelta(r, 'C', .30), 'C', -1, e.days)] },
  butterfly: { n: '蝶式价差 Butterfly', d: '押注到期价钉在中心行权价附近，成本低、赔率高', build: (r, e) => [leg(pickByDelta(r, 'C', .35), 'C', 1), leg(pickByDelta(r, 'C', .50), 'C', -2), leg(pickByDelta(r, 'C', .65), 'C', 1)] },
  calendar: { n: '日历价差（卖近月买次月）', d: '期限结构倒挂时卖近月、买次月平值认购，赚取近月更快的时间价值衰减', build: (r, e, u) => { const nx = u.expiries.find(x => x.days > e.days); if (!nx) return []; return [leg(pickByDelta(r, 'C', .50), 'C', -1, e.days), leg(pickByDelta(nx.byStrike, 'C', .50), 'C', 1, nx.days)] } },
}
function buildLegs(u, e, key) {
  const s = STRATEGIES[key]; if (!s) return []
  let legs = []
  try { legs = s.build(e.byStrike, e, u) || [] } catch (err) { return [] }
  legs = legs.filter(l => l && l.px)
  legs.forEach(l => { if (l.t == null) l.t = e.days })
  return legs
}
function legLabel(l) {
  if (l.type === 'S') return (l.qty > 0 ? '买入' : '卖出') + ' 标的 ' + Math.abs(l.qty) * MULT.value + ' 份 @' + fmt(l.px, 3)
  return (l.qty > 0 ? '买入' : '卖出') + ' ' + Math.abs(l.qty) + ' 张 ' + (l.type === 'C' ? '认购' : '认沽') + ' ' + fmt(l.K, 3) + ' @' + fmt(l.px, 4)
}
function legValue(l, s, tEvalDays) {
  if (l.type === 'S') return s
  const rem = (l.t - tEvalDays) / 365
  if (rem <= 1e-6) return l.type === 'C' ? Math.max(0, s - l.K) : Math.max(0, l.K - s)
  return bs(s, l.K, rem, l.iv, l.type)
}

/* ============ 计算属性（评分 / 文本） ============ */
const dirScore = computed(() => (U.value && E.value) ? scoreDir(U.value, E.value) : { items: [], score: 0 })
const volScore = computed(() => (U.value && E.value) ? scoreVol(U.value, E.value) : { items: [], score: 0 })
const verdictObj = computed(() => {
  if (!U.value || !E.value) return null
  const ctx = ctxOf(U.value, E.value)
  const vd = verdictOf(dirScore.value.score, volScore.value.score, ctx)
  const hf = hvFair(U.value); const vrp = E.value.atmIV - hf
  const far = U.value.expiries[U.value.expiries.length - 1]
  const legs1 = buildLegs(U.value, E.value, vd.key)
  return { vd, hf, vrp, far, legs1, dirScore: dirScore.value.score, volScore: volScore.value.score }
})
const recommendedKey = computed(() => verdictObj.value ? verdictObj.value.vd.key : 'long_straddle')
const dirColor = computed(() => { const s = dirScore.value.score; return s > 0 ? C_UP : s < 0 ? C_DN : '#8f95a1' })
const volColor = computed(() => { const s = volScore.value.score; return s < 0 ? C_PUR : C_WARN })
const dirMeter = computed(() => { const v = dirScore.value.score; return { w: Math.abs(v) / 2, left: v >= 0 ? 50 : 50 - Math.abs(v) / 2 } })
const volMeter = computed(() => { const v = volScore.value.score; return { w: Math.abs(v) / 2, left: v >= 0 ? 50 : 50 - Math.abs(v) / 2 } })
function sigRow(x, col) {
  const s = x.s; const w = s == null ? 0 : Math.abs(s) / 2
  const c = s == null ? '#ccc' : (col === 'dir' ? (s > 0 ? C_UP : C_DN) : (s < 0 ? C_PUR : C_WARN))
  return { n: x.n, v: x.v, w: x.w, tip: x.t, sLabel: s == null ? '—' : sign(s) + fmt(s, 0), barW: w, color: c }
}
const dirRows = computed(() => dirScore.value.items.map(x => sigRow(x, 'dir')))
const volRows = computed(() => volScore.value.items.map(x => sigRow(x, 'vol')))
const kpiCards = computed(() => {
  const u = U.value, e = E.value; if (!u || !e) return []
  const h = u.hv || {}, hf = hvFair(u), vrp = e.atmIV - hf
  return [
    ['标的现价', fmt(u.spot, 3), `近17日 ${sign(h.ret17 || 0)}${fmt(h.ret17 || 0, 2)}%`, (h.ret17 || 0) >= 0 ? 'up' : 'dn'],
    ['平值 IV', fmt(e.atmIV, 2), `平值行权价 ${fmt(e.atmK, 3)}`, ''],
    ['IV 历史分位', u.ivPct ? fmt(u.ivPct.pct, 0) + '%' : '—', u.ivPct ? `中位 ${fmt(u.ivPct.median, 1)} / 区间 ${fmt(u.ivPct.min, 0)}~${fmt(u.ivPct.max, 0)}` : '该标的无 IV 历史', u.ivPct && u.ivPct.pct > 80 ? 'up' : ''],
    ['预期实现波动率', fmt(hf, 2), `近5日RV ${fmt(h.rv5 || 0, 1)} · 17日综合 ${fmt(h.hvBlend || 0, 1)}`, ''],
    ['波动率风险溢价', sign(vrp) + fmt(vrp, 2), vrp > 0 ? 'IV 贵于实现波动率，利于卖方' : 'IV 低于实现波动率，卖方无安全垫', vrp > 0 ? 'up' : 'dn'],
    ['持仓量 PCR', fmt(e.oiPCR, 2), `认购 ${wan(e.callOI)} / 认沽 ${wan(e.putOI)}`, ''],
    ['最大痛点', fmt(e.maxPain, 3), `偏离现价 ${sign((e.maxPain / u.spot - 1) * 100)}${fmt((e.maxPain / u.spot - 1) * 100, 2)}%`, e.maxPain > u.spot ? 'up' : 'dn'],
    ['净 Gamma 敞口', wan(e.netGex), e.netGex > 0 ? '做市商多 Gamma → 抑制波动' : '做市商空 Gamma → 放大波动', e.netGex > 0 ? 'dn' : 'up'],
  ]
})
const rankRows = computed(() => {
  return model.value.underlyings.map((u) => {
    const e = u.expiries[0], far = u.expiries[u.expiries.length - 1]
    const d = scoreDir(u, e).score, v = scoreVol(u, e).score, vd = verdictOf(d, v, ctxOf(u, e))
    const hf = hvFair(u), vrp = e.atmIV - hf, slope = (far.atmIV - e.atmIV) / e.atmIV
    return { u, e, d, v, vd, hf, vrp, slope }
  }).sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
})
const tRows = computed(() => E.value ? E.value.byStrike : [])
const fmtExp = (s) => (s && s.length >= 8) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}` : s

/* ============ 策略损益 ============ */
const legsC = computed(() => { const u = U.value, e = E.value; if (!u || !e) return []; return buildLegs(u, e, selStg.value || recommendedKey.value) })
const payoffData = computed(() => {
  const u = U.value, e = E.value; const legs = legsC.value
  if (!u || !e || !legs.length) return null
  const S = u.spot; const lo = S * 0.78, hi = S * 1.22, N = 140
  const xs = [], expPL = [], nowPL = []
  const cost = legs.reduce((a, l) => a + l.qty * l.px * MULT.value, 0)
  for (let i = 0; i <= N; i++) {
    const s = lo + (hi - lo) * i / N; xs.push(+s.toFixed(4))
    let pe = 0, pn = 0
    legs.forEach(l => { pe += l.qty * (legValue(l, s, e.days) - l.px) * MULT.value; pn += l.qty * (legValue(l, s, 0) - l.px) * MULT.value })
    expPL.push(+pe.toFixed(0)); nowPL.push(+pn.toFixed(0))
  }
  const mx = Math.max(...expPL), mn = Math.min(...expPL)
  const bes = []
  for (let i = 1; i < xs.length; i++) if (expPL[i - 1] * expPL[i] < 0) { const t = Math.abs(expPL[i - 1]) / (Math.abs(expPL[i - 1]) + Math.abs(expPL[i])); bes.push(+(xs[i - 1] + (xs[i] - xs[i - 1]) * t).toFixed(4)) }
  const rowOf = (l) => { if (l.type === 'S') return null; const ex = u.expiries.find(x => x.days === l.t) || e; return ex.byStrike.find(x => x.K === l.K) }
  const gk = (l, cf, pf, sv) => { if (l.type === 'S') return sv; const b = rowOf(l); if (!b) return 0; return (l.type === 'C' ? b[cf] : b[pf]) || 0 }
  const netD = legs.reduce((a, l) => a + l.qty * gk(l, 'cDelta', 'pDelta', 1), 0)
  const netT = legs.reduce((a, l) => a + l.qty * gk(l, 'cTheta', 'pTheta', 0), 0)
  const netV = legs.reduce((a, l) => a + l.qty * gk(l, 'cVega', 'pVega', 0) * MULT.value * 0.01, 0)
  const sig = e.atmIV / 100 * Math.sqrt(e.days / 365); let win = 0, tot = 0
  for (let i = 0; i < xs.length; i++) { const z = Math.log(xs[i] / S) / sig; const w = Math.exp(-z * z / 2); tot += w; if (expPL[i] > 0) win += w }
  const pop = tot ? win / tot * 100 : 0
  return { xs, expPL, nowPL, cost, mx, mn, bes, netD, netT, netV, pop, S }
})
const stgKpi = computed(() => {
  const p = payoffData.value; if (!p) return []
  return [
    ['净权利金', (p.cost < 0 ? '收入 ' : '支出 ') + wan(Math.abs(p.cost)) + ' 元', p.cost < 0 ? 'up' : 'dn'],
    ['最大盈利', (p.mx > 0 ? '+' : '') + wan(p.mx) + ' 元', 'up'],
    ['最大亏损', wan(p.mn) + ' 元', 'dn'],
    ['盈亏平衡点', p.bes.length ? p.bes.map(b => fmt(b, 3)).join(' / ') : '—', ''],
    ['到期获利概率', fmt(p.pop, 1) + '%', p.pop > 55 ? 'up' : ''],
    ['组合 Delta', sign(p.netD) + fmt(p.netD, 3), p.netD > 0 ? 'up' : 'dn'],
    ['组合 Theta', sign(p.netT) + fmt(p.netT, 1) + ' 元/日', p.netT > 0 ? 'up' : 'dn'],
    ['组合 Vega', sign(p.netV) + fmt(p.netV, 1) + ' 元/IV点', p.netV > 0 ? 'up' : 'dn'],
  ]
})
watch(selU, () => { const u = model.value.underlyings.find(x => x.code === selU.value); selE.value = u ? u.expiries[0].exp : null; selStg.value = null })

/* ============ 图表 options ============ */
const smileOpt = computed(() => {
  if (!E.value) return {}
  const ks = E.value.byStrike.map(b => b.K)
  return Object.assign({}, BASE_OPT, {
    grid: { left: 52, right: 52, top: 34, bottom: 44 },
    legend: { top: 2, data: ['认购 IV', '认沽 IV', '平均'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: ks, name: '行权价', axisLabel: { interval: 1, fontSize: 10, rotate: 35 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true }, AXIS),
    dataZoom: [{ type: 'inside', start: 0, end: 100 }, { type: 'slider', bottom: 0, height: 14, borderColor: '#e3e6ea', fillerColor: 'rgba(47,111,235,.08)' }],
    series: [
      { name: '认购 IV', type: 'line', data: E.value.byStrike.map(b => b.cIV), smooth: true, symbolSize: 5, lineStyle: { width: 2, color: C_UP }, itemStyle: { color: C_UP }, connectNulls: true },
      { name: '认沽 IV', type: 'line', data: E.value.byStrike.map(b => b.pIV), smooth: true, symbolSize: 5, lineStyle: { width: 2, color: C_DN }, itemStyle: { color: C_DN }, connectNulls: true },
      { name: '平均', type: 'line', data: E.value.byStrike.map(b => (b.cIV && b.pIV) ? (b.cIV + b.pIV) / 2 : null), smooth: true, symbol: 'none', lineStyle: { width: 1.5, color: C_ACC, type: 'dashed' }, connectNulls: true,
        markLine: { silent: true, symbol: 'none', label: { formatter: '平值 ' + E.value.atmK, position: 'insideEndTop', color: C_ACC, fontSize: 10 }, lineStyle: { color: C_ACC, type: 'dotted', width: 1.5 }, data: [{ xAxis: ks.indexOf(E.value.atmK) }] } },
    ],
  })
})
const termOpt = computed(() => {
  if (!U.value) return {}
  const xs = U.value.expiries.map(e => e.days + '天')
  return Object.assign({}, BASE_OPT, {
    legend: { top: 2, data: ['平值 IV', '25Δ 认购 IV', '25Δ 认沽 IV'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: xs, name: '剩余期限' }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true }, AXIS),
    series: [
      { name: '平值 IV', type: 'line', data: U.value.expiries.map(e => +fmt(e.atmIV, 2)), symbolSize: 8, lineStyle: { width: 3, color: C_ACC }, itemStyle: { color: C_ACC }, label: { show: true, color: '#5f6672', fontSize: 11, formatter: '{c}' }, areaStyle: { color: 'rgba(47,111,235,.07)' } },
      { name: '25Δ 认购 IV', type: 'line', data: U.value.expiries.map(e => +fmt(e.ivc25, 2)), symbolSize: 5, lineStyle: { width: 1.6, color: C_UP, type: 'dashed' }, itemStyle: { color: C_UP } },
      { name: '25Δ 认沽 IV', type: 'line', data: U.value.expiries.map(e => +fmt(e.ivp25, 2)), symbolSize: 5, lineStyle: { width: 1.6, color: C_DN, type: 'dashed' }, itemStyle: { color: C_DN } },
    ],
  })
})
const coneOpt = computed(() => {
  const u = U.value; if (!u) return {}
  const lh = u.longHV
  if (!lh || !lh.cone) return { title: { text: '该标的无日线历史数据', left: 'center', top: '45%', textStyle: { color: '#8f95a1', fontSize: 13, fontWeight: 400 } } }
  const xs = lh.cone.map(c => c.win + '日')
  const band = (a, b, color, name) => ([
    { name: name + '_base', type: 'line', stack: name, data: lh.cone.map(c => c[a]), symbol: 'none', lineStyle: { opacity: 0 }, silent: true, tooltip: { show: false } },
    { name, type: 'line', stack: name, data: lh.cone.map(c => c[b] - c[a]), symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color }, tooltip: { show: false } },
  ])
  const ivPts = u.expiries.map(ex => [ex.days * 250 / 365, ex.atmIV])
  return Object.assign({}, BASE_OPT, {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#e3e6ea', borderWidth: 1, textStyle: { color: '#1f2329', fontSize: 12 } },
    legend: { top: 2, data: ['中位数', '近期实现波动率', '当前各期限 IV'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: xs, name: '统计窗口' }, AXIS),
    yAxis: Object.assign({ type: 'value', name: '年化波动率 %', scale: true }, AXIS),
    series: [
      ...band('min', 'p10', 'rgba(122,90,248,.05)', 'r1'), ...band('p10', 'p25', 'rgba(122,90,248,.10)', 'r2'),
      ...band('p25', 'p75', 'rgba(122,90,248,.18)', 'r3'), ...band('p75', 'p90', 'rgba(122,90,248,.10)', 'r4'), ...band('p90', 'max', 'rgba(122,90,248,.05)', 'r5'),
      { name: '中位数', type: 'line', data: lh.cone.map(c => +fmt(c.median, 1)), symbol: 'none', lineStyle: { width: 2, color: C_PUR } },
      { name: '近期实现波动率', type: 'line', data: [+fmt(u.hv.hv5 || u.hv.rv5, 1), +fmt(u.hv.hv10, 1), +fmt(u.hv.hvCC, 1), null, null, null, null], symbolSize: 7, lineStyle: { width: 2, color: C_DN }, itemStyle: { color: C_DN }, connectNulls: false },
      { name: '当前各期限 IV', type: 'scatter', symbolSize: 12, itemStyle: { color: C_UP }, data: u.expiries.map(ex => { const w = ex.days * 250 / 365; let idx = 0, bd = 1e9; lh.cone.forEach((c, i) => { const a = Math.abs(c.win - w); if (a < bd) { bd = a; idx = i } }); return [idx, +fmt(ex.atmIV, 1)] }) },
    ],
  })
})
const ivHistOpt = computed(() => {
  const u = U.value; if (!u) return {}
  const d = u.ivHist
  if (!d || !d.length) return { title: { text: '该标的无 IV 历史序列', left: 'center', top: '45%', textStyle: { color: '#8f95a1', fontSize: 13, fontWeight: 400 } } }
  return Object.assign({}, BASE_OPT, {
    grid: { left: 52, right: 60, top: 26, bottom: 34 }, legend: { show: false },
    xAxis: Object.assign({ type: 'category', data: d.map(x => x.d), axisLabel: { color: '#8f95a1', fontSize: 10, formatter: v => v.replace(/^(\d{4})\/(\d+)\/\d+$/, '$1/$2') } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: 'IV %', scale: true }, AXIS),
    dataZoom: [{ type: 'inside', start: 40, end: 100 }, { type: 'slider', height: 14, bottom: 6, borderColor: '#e3e6ea', fillerColor: 'rgba(47,111,235,.08)' }],
    series: [{ type: 'line', data: d.map(x => x.v), symbol: 'none', lineStyle: { width: 1.4, color: C_PUR }, areaStyle: { color: 'rgba(122,90,248,.09)' },
      markLine: { silent: true, symbol: 'none', label: { fontSize: 10, position: 'insideEndTop' }, data: [
        { yAxis: +fmt(E.value.atmIV, 2), lineStyle: { color: C_UP, width: 1.6 }, label: { formatter: '当前 ' + fmt(E.value.atmIV, 1), color: C_UP } },
        { yAxis: +fmt(u.ivPct.median, 2), lineStyle: { color: '#8f95a1', type: 'dashed', width: 1 }, label: { formatter: '3年中位 ' + fmt(u.ivPct.median, 1), color: '#8f95a1' } },
      ] } }],
  })
})
const oiOpt = computed(() => {
  if (!E.value) return {}
  const ks = E.value.byStrike.map(b => b.K)
  const pain = E.value.painCurve.map(p => +(p.pain / 1e8).toFixed(2))
  return Object.assign({}, BASE_OPT, {
    grid: { left: 56, right: 64, top: 34, bottom: 44 },
    legend: { top: 2, data: ['认购持仓', '认沽持仓', '买方总亏损（亿）'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: ks, name: '行权价', axisLabel: { interval: 1, fontSize: 10, rotate: 35 } }, AXIS),
    yAxis: [Object.assign({ type: 'value', name: '持仓量（张）', axisLabel: { color: '#8f95a1', fontSize: 10, formatter: v => Math.abs(v) >= 1e4 ? (Math.abs(v) / 1e4).toFixed(0) + '万' : Math.abs(v) } }, AXIS),
      Object.assign({ type: 'value', name: '亏损（亿）', position: 'right', splitLine: { show: false }, axisLabel: { fontSize: 10 } }, AXIS)],
    dataZoom: [{ type: 'inside', start: 0, end: 100 }],
    series: [
      { name: '认购持仓', type: 'bar', data: E.value.byStrike.map(b => b.cOI), itemStyle: { color: C_UP, opacity: .8 }, barGap: '15%', barWidth: '38%', tooltip: { valueFormatter: v => v } },
      { name: '认沽持仓', type: 'bar', data: E.value.byStrike.map(b => b.pOI), itemStyle: { color: C_DN, opacity: .8 }, barWidth: '38%' },
      { name: '买方总亏损（亿）', type: 'line', yAxisIndex: 1, data: pain, symbol: 'none', lineStyle: { color: C_WARN, width: 2 }, tooltip: { valueFormatter: v => fmt(v, 1) + '亿' },
        markLine: { silent: true, symbol: 'none', label: { formatter: '最大痛点 ' + E.value.maxPain, position: 'insideEndTop', color: C_WARN, fontSize: 10 }, lineStyle: { color: C_WARN, type: 'dotted', width: 1.5 }, data: [{ xAxis: ks.indexOf(E.value.maxPain) }] } },
    ],
  })
})
const doiOpt = computed(() => {
  if (!E.value) return {}
  const ks = E.value.byStrike.map(b => b.K)
  return Object.assign({}, BASE_OPT, {
    grid: { left: 56, right: 30, top: 34, bottom: 44 },
    legend: { top: 2, data: ['认购增仓', '认沽增仓'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: ks, name: '行权价', axisLabel: { interval: 1, fontSize: 10, rotate: 35 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: '日增仓（张）', axisLabel: { color: '#8f95a1', fontSize: 10, formatter: v => Math.abs(v) >= 1e4 ? (v / 1e4).toFixed(0) + '万' : v } }, AXIS),
    dataZoom: [{ type: 'inside', start: 0, end: 100 }],
    series: [
      { name: '认购增仓', type: 'bar', data: E.value.byStrike.map(b => b.cDOI), itemStyle: { color: C_UP, opacity: .85 }, barWidth: '40%' },
      { name: '认沽增仓', type: 'bar', data: E.value.byStrike.map(b => b.pDOI), itemStyle: { color: C_DN, opacity: .85 }, barGap: '15%', barWidth: '40%' },
    ],
  })
})
const gexOpt = computed(() => {
  if (!E.value) return {}
  const ks = E.value.byStrike.map(b => b.K)
  let cum = 0; const cums = E.value.byStrike.map(b => { cum += b.netGex; return +(cum / 1e8).toFixed(3) })
  return Object.assign({}, BASE_OPT, {
    grid: { left: 56, right: 60, top: 34, bottom: 44 },
    legend: { top: 2, data: ['认购 Gamma', '认沽 Gamma', '累计净 Gamma'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: ks, name: '行权价', axisLabel: { interval: 1, fontSize: 10, rotate: 35 } }, AXIS),
    yAxis: [Object.assign({ type: 'value', name: 'Gamma 敞口（亿元/1%）' }, AXIS), Object.assign({ type: 'value', name: '累计（亿）', position: 'right', splitLine: { show: false } }, AXIS)],
    dataZoom: [{ type: 'inside', start: 0, end: 100 }],
    series: [
      { name: '认购 Gamma', type: 'bar', data: E.value.byStrike.map(b => +(b.gexC / 1e8).toFixed(3)), itemStyle: { color: C_UP, opacity: .75 }, barWidth: '40%' },
      { name: '认沽 Gamma', type: 'bar', data: E.value.byStrike.map(b => +(-b.gexP / 1e8).toFixed(3)), itemStyle: { color: C_DN, opacity: .75 }, barGap: '15%', barWidth: '40%' },
      { name: '累计净 Gamma', type: 'line', yAxisIndex: 1, data: cums, symbol: 'none', lineStyle: { width: 2, color: C_PUR }, markLine: { silent: true, symbol: 'none', data: [{ yAxis: 0, lineStyle: { color: '#c8cdd6', type: 'dashed' } }] } },
    ],
  })
})
const greeksOpt = computed(() => {
  if (!E.value) return {}
  const ks = E.value.byStrike.map(b => b.K)
  return Object.assign({}, BASE_OPT, {
    grid: { left: 52, right: 56, top: 34, bottom: 34 },
    legend: { top: 2, data: ['认购Δ', '认沽Δ', 'Γ', 'Vega', '认购Θ(元/日)'], textStyle: { color: '#5f6672', fontSize: 11 } },
    xAxis: Object.assign({ type: 'category', data: ks, name: '行权价' }, AXIS),
    yAxis: [Object.assign({ type: 'value', name: 'Δ / Γ / Vega' }, AXIS), Object.assign({ type: 'value', name: 'Θ 元/日', position: 'right', splitLine: { show: false } }, AXIS)],
    series: [
      { name: '认购Δ', type: 'line', data: E.value.byStrike.map(b => b.cDelta), symbol: 'none', lineStyle: { width: 2, color: C_UP }, connectNulls: true },
      { name: '认沽Δ', type: 'line', data: E.value.byStrike.map(b => b.pDelta), symbol: 'none', lineStyle: { width: 2, color: C_DN }, connectNulls: true },
      { name: 'Γ', type: 'line', data: E.value.byStrike.map(b => b.cGamma || b.pGamma), symbol: 'none', lineStyle: { width: 1.8, color: C_PUR }, areaStyle: { color: 'rgba(122,90,248,.10)' }, connectNulls: true },
      { name: 'Vega', type: 'line', data: E.value.byStrike.map(b => b.cVega || b.pVega), symbol: 'none', lineStyle: { width: 1.6, color: C_ACC, type: 'dashed' }, connectNulls: true },
      { name: '认购Θ(元/日)', type: 'bar', yAxisIndex: 1, data: E.value.byStrike.map(b => b.cTheta), itemStyle: { color: 'rgba(245,166,35,.5)' } },
    ],
  })
})
const spotOpt = computed(() => {
  const u = U.value; if (!u || !u.hv.closes || !u.hv.closes.length) return { title: { text: '该标的无日线历史数据', left: 'center', top: '45%', textStyle: { color: '#8f95a1', fontSize: 13, fontWeight: 400 } } }
  const cs = u.hv.closes
  return Object.assign({}, BASE_OPT, {
    grid: { left: 52, right: 56, top: 26, bottom: 34 }, legend: { show: false },
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#e3e6ea', borderWidth: 1, textStyle: { color: '#1f2329', fontSize: 12 } },
    xAxis: Object.assign({ type: 'category', data: cs.map(x => x.d.slice(5)) }, AXIS),
    yAxis: [Object.assign({ type: 'value', scale: true, name: '价格' }, AXIS), Object.assign({ type: 'value', position: 'right', splitLine: { show: false }, show: false }, AXIS)],
    series: [
      { name: '成交量', type: 'bar', yAxisIndex: 1, data: cs.map(x => x.v), itemStyle: { color: (p) => { const i = p.dataIndex; return (i > 0 && cs[i].c >= cs[i - 1].c) ? 'rgba(224,32,32,.20)' : 'rgba(18,160,92,.20)' } } },
      { name: 'K线', type: 'candlestick', data: cs.map(x => [x.o, x.c, x.l, x.h]), itemStyle: { color: C_UP, color0: '#fff', borderColor: C_UP, borderColor0: C_DN } },
      { name: 'MA5', type: 'line', data: cs.map((_, i) => i < 4 ? null : +(cs.slice(i - 4, i + 1).reduce((a, b) => a + b.c, 0) / 5).toFixed(4)), symbol: 'none', lineStyle: { width: 1.4, color: C_WARN } },
    ],
  })
})
const crossOpt = computed(() => {
  const pts = model.value.underlyings.map(u => {
    const e = u.expiries[0], hf = hvFair(u)
    const oi = u.expiries.reduce((a, b) => a + b.totalOI, 0)
    return { name: u.short, value: [+fmt(hf, 2), +fmt(e.atmIV, 2), oi] }
  })
  const maxOI = Math.max(...pts.map(p => p.value[2]))
  const mx = Math.max(...pts.map(p => Math.max(p.value[0], p.value[1]))) * 1.12
  const mn = Math.min(...pts.map(p => Math.min(p.value[0], p.value[1]))) * 0.85
  return Object.assign({}, BASE_OPT, {
    grid: { left: 56, right: 30, top: 26, bottom: 38 }, legend: { show: false },
    tooltip: { trigger: 'item', backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#e3e6ea', borderWidth: 1, textStyle: { color: '#1f2329', fontSize: 12 },
      formatter: p => `<b>${p.data.name}</b><br>预期实现波动率 ${p.value[0]}<br>近月 ATM IV ${p.value[1]}<br>风险溢价 ${sign(p.value[1] - p.value[0])}${fmt(p.value[1] - p.value[0], 2)}<br>总持仓 ${wan(p.value[2])} 张` },
    xAxis: Object.assign({ type: 'value', name: '预期实现波动率 %', min: mn, max: mx }, AXIS),
    yAxis: Object.assign({ type: 'value', name: '近月 ATM IV %', min: mn, max: mx }, AXIS),
    series: [
      { type: 'line', data: [[mn, mn], [mx, mx]], symbol: 'none', lineStyle: { color: '#c8cdd6', type: 'dashed', width: 1 }, silent: true, tooltip: { show: false } },
      { type: 'scatter', data: pts, symbolSize: v => 14 + 26 * Math.sqrt(v[2] / maxOI), itemStyle: { color: p => p.value[1] > p.value[0] ? C_UP : C_DN, opacity: .75, borderColor: '#fff', borderWidth: 2 }, label: { show: true, position: 'top', formatter: p => p.data.name, fontSize: 11, color: '#5f6672' } },
    ],
  })
})
const quadOpt = computed(() => {
  const pts = model.value.underlyings.map(u => {
    const e = u.expiries[0], d = scoreDir(u, e), v = scoreVol(u, e)
    return { name: u.short, value: [+fmt(d.score, 1), +fmt(v.score, 1)], cur: u.code === selU.value }
  })
  const label = (x, y, t, c) => ({ type: 'scatter', data: [{ value: [x, y] }], symbolSize: 1, silent: true, label: { show: true, formatter: t, fontSize: 11, color: c, fontWeight: 600 }, tooltip: { show: false } })
  return Object.assign({}, BASE_OPT, {
    grid: { left: 56, right: 30, top: 26, bottom: 40 }, legend: { show: false },
    tooltip: { trigger: 'item', backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#e3e6ea', borderWidth: 1, textStyle: { color: '#1f2329', fontSize: 12 },
      formatter: p => `<b>${p.data.name}</b><br>方向 ${sign(p.value[0])}${p.value[0]}<br>波动率 ${sign(p.value[1])}${p.value[1]}` },
    xAxis: Object.assign({ type: 'value', name: '方向评分（→ 看多）', min: -100, max: 100, splitLine: { lineStyle: { color: '#f2f4f7' } } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: '波动率评分（↑ 做多波动率）', min: -100, max: 100, splitLine: { lineStyle: { color: '#f2f4f7' } } }, AXIS),
    series: [
      label(-58, 72, '买入认沽', '#b9bfc9'), label(58, 72, '买入认购', '#b9bfc9'), label(-58, -72, '熊市看涨价差', '#b9bfc9'),
      label(58, -72, '牛市看跌价差', '#b9bfc9'), label(0, -88, '卖出宽跨 / 铁鹰', '#b9bfc9'), label(0, 88, '买入跨式', '#b9bfc9'),
      { type: 'scatter', data: pts, symbolSize: p => p.data && p.data.cur ? 22 : 14, itemStyle: { color: p => p.data.cur ? C_ACC : 'rgba(122,90,248,.55)', borderColor: '#fff', borderWidth: 2 },
        label: { show: true, position: 'right', formatter: p => p.data.name, fontSize: 11, color: '#5f6672' },
        markLine: { silent: true, symbol: 'none', lineStyle: { color: '#d8dce2' }, data: [{ xAxis: 0 }, { yAxis: 0 }] } },
    ],
  })
})
const payoffOpt = computed(() => {
  const p = payoffData.value
  if (!p) return { title: { text: '该策略在当前到期月无可用合约', left: 'center', top: '45%', textStyle: { color: '#8f95a1', fontSize: 13, fontWeight: 400 } } }
  const S = p.S
  const spotIdx = p.xs.reduce((a, b, i) => Math.abs(b - S) < Math.abs(p.xs[a] - S) ? i : a, 0)
  return Object.assign({}, BASE_OPT, {
    grid: { left: 62, right: 26, top: 30, bottom: 34 },
    legend: { top: 2, data: ['到期损益', '当前理论损益'], textStyle: { color: '#5f6672', fontSize: 11 } },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,.97)', borderColor: '#e3e6ea', borderWidth: 1, textStyle: { color: '#1f2329', fontSize: 12 },
      formatter: x => { let s = '标的 ' + x[0].axisValue + '<br>'; x.forEach(y => { s += y.marker + y.seriesName + ' <b>' + (y.value > 0 ? '+' : '') + Math.round(y.value) + '</b> 元<br>' }); return s } },
    xAxis: Object.assign({ type: 'category', data: p.xs, name: '到期标的价', axisLabel: { color: '#8f95a1', fontSize: 10, interval: 19 } }, AXIS),
    yAxis: Object.assign({ type: 'value', name: '盈亏（元）', axisLabel: { color: '#8f95a1', fontSize: 10, formatter: v => Math.abs(v) >= 1e4 ? (v / 1e4).toFixed(1) + '万' : v } }, AXIS),
    series: [
      { name: '到期损益', type: 'line', data: p.expPL, symbol: 'none', lineStyle: { width: 2.4, color: C_ACC },
        areaStyle: {}, markLine: { silent: true, symbol: 'none', data: [
          { yAxis: 0, lineStyle: { color: '#c8cdd6' } },
          { xAxis: spotIdx, lineStyle: { color: C_WARN, type: 'dashed', width: 1.5 }, label: { formatter: '现价 ' + fmt(S, 3), color: C_WARN, fontSize: 10, position: 'insideEndTop' } } ] } },
      { name: '当前理论损益', type: 'line', data: p.nowPL, symbol: 'none', lineStyle: { width: 1.8, color: C_PUR, type: 'dashed' } },
    ],
  })
})

/* ============ 生命周期 ============ */
onMounted(async () => {
  await loadChain()
  if (props.history) applyHistory(props.history)
  else await loadHistory()
})
</script>

<style scoped>
/* 以下为 Tailwind 难以表达或需动态行级控制的样式，其余布局已由 Tailwind 工具类实现 */
table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums }
th { background: #f7f8fa; color: #5f6672; font-weight: 600; padding: 7px 6px; border-bottom: 1px solid #e3e6ea; text-align: right; white-space: nowrap; font-size: 11.5px }
td { padding: 5px 6px; border-bottom: 1px solid #eef0f3; text-align: right; white-space: nowrap }
tbody tr:hover { background: #fafbfd }
.kcol { background: #f3f5f8 !important; font-weight: 700; text-align: center }
tr.atm td { background: #fff8e6 }
tr.atm .kcol { background: #ffeec2 !important }
.cside { background: #fefafa }
.pside { background: #f9fdfb }
.sigrow td:first-child { text-align: left; color: #5f6672 }
.bar { display: inline-block; height: 9px; border-radius: 2px; vertical-align: middle }
.tw { overflow: auto; border: 1px solid #e3e6ea; border-radius: 8px }
.chart { width: 100%; height: 290px }
.chart.tall { height: 360px }
</style>
