/**
 * 手动实现误差函数 erf(x)（有理逼近法，兼容不支持 ES6 Math.erf 的环境）
 * 精度：误差 < 1e-7，满足金融计算要求
 * @param {number} x - 输入值
 * @returns {number} 误差函数计算结果
 */
function erf(x) {
  // 定义常数（有理逼近所需参数）
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  // 处理正负值：erf(-x) = -erf(x)（奇函数性质）
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  // 有理逼近计算
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  // 返回带符号的结果
  return sign * y;
}
/**
 * 标准正态分布累积分布函数 N(x)
 * @param {number} x - 输入值（d1 或 d2）
 * @returns {number} 累积概率值（0 ~ 1 之间）
 */
function standardNormalCdf(x) {
  // 利用误差函数 erf 推导：N(x) = 0.5 * [1 + erf(x / √2)]
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}
/**
 * 布莱克-斯科尔斯（BS）期权定价公式计算
 * @param {number} S - 标的资产当前价格
 * @param {number} K - 期权执行价格
 * @param {number} r - 无风险利率（年化，连续复利）
 * @param {number} T - 到期时间（年）
 * @param {number} sigma - 标的资产年化波动率
 * @param {string} optionType - 期权类型（'call' 看涨 / 'put' 看跌）
 * @returns {number} 期权的理论价值（保留 4 位小数，便于阅读）
 * @throws {Error} 入参合法性校验失败时抛出异常
 */
export function blackScholesOptionPrice(S, K, r, T, sigma, optionType) {
  // 1. 入参合法性校验
  if (S <= 0 || K <= 0 || sigma <= 0 || T < 0 || r < 0) {
    throw new Error("入参非法：S、K、sigma 必须大于 0，T、r 必须大于等于 0");
  }
  if (T === 0) {
    // 到期时，期权价值为内在价值
    if (optionType === "call") {
      return Math.max(S - K, 0).toFixed(4);
    } else {
      return Math.max(K - S, 0).toFixed(4);
    }
  }
  if (optionType !== "call" && optionType !== "put") {
    throw new Error("期权类型仅支持 'call'（看涨）或 'put'（看跌）");
  }

  // 2. 计算 d1 和 d2（BS 公式核心中间变量）
  const lnSK = Math.log(S / K); // 自然对数 ln(S/K)
  const sigmaSqrtT = sigma * Math.sqrt(T);
  const d1 = (lnSK + (r + 0.5 * sigma * sigma) * T) / sigmaSqrtT;
  const d2 = d1 - sigmaSqrtT;

  // 3. 计算标准正态分布累积概率
  const N_d1 = standardNormalCdf(d1);
  const N_d2 = standardNormalCdf(d2);
  const N_negD1 = standardNormalCdf(-d1);
  const N_negD2 = standardNormalCdf(-d2);

  // 4. 分别计算看涨、看跌期权价值
  let optionPrice;
  const KExpRt = K * Math.exp(-r * T); // K * e^(-rT)（现值因子）

  if (optionType === "call") {
    // 看涨期权公式：C = S*N(d1) - K*e^(-rT)*N(d2)
    optionPrice = S * N_d1 - KExpRt * N_d2;
  } else {
    // 看跌期权公式：P = K*e^(-rT)*N(-d2) - S*N(-d1)
    optionPrice = KExpRt * N_negD2 - S * N_negD1;
  }

  // 5. 返回保留 4 位小数的结果（金融数据常规精度）
  return parseFloat(optionPrice.toFixed(4));
}

// 获取一条期权
// S: 输入当前资产标的价格(变量1)
// K: 期权行权价(不变)
// r: 无风险利率(不变)
// T: 到期时间 / 365(变量2)
// sigma: 隐含波动率(变量3)
// optionType: call / put
// 输出: 期权理论价格
