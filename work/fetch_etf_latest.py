# -*- coding: utf-8 -*-
"""获取 ETF 不复权/前复权日线数据并保存为 CSV。

数据源:
  - 不复权日线: 新浪财经 fund_etf_hist_sina (成交量单位与参考文件一致, 为股数)
  - 前复权所需复权因子(累计分红): 新浪财经 hfq.js (字段 u 为截至该日累计每份分红)
ETF 前复权公式: 前复权价 = 不复权价 - (截至当前累计分红 - 截至当日累计分红)
接口超时或连接异常时最多重试一次。
"""
import csv
import re
import sys
import time
from datetime import datetime

import akshare as ak
import requests

CODES = ["510050", "510300", "510500", "588000", "159915", "159922", "159901"]
COLUMNS = ["code", "date", "open", "high", "low", "close", "volumn"]

SESSION = requests.Session()
SESSION.trust_env = False


def fetch_json(url):
    """请求 JSON 接口，超时/连接异常最多重试一次。"""
    try:
        r = SESSION.get(url, timeout=(10, 30))
    except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
        print("    首次请求超时/失败 ({}), 重试一次...".format(type(e).__name__))
        time.sleep(1.0)
        r = SESSION.get(url, timeout=(10, 30))
    r.raise_for_status()
    return r


def fetch_cum_dividend(prefix_code):
    """从新浪 hfq.js 获取每只 ETF 的累计分红序列。

    返回按日期升序的列表: [(date_str, cum_div), ...]
    """
    url = "https://finance.sina.com.cn/realstock/company/{}/hfq.js".format(prefix_code)
    try:
        r = fetch_json(url)
    except requests.exceptions.HTTPError as e:
        # 该 ETF 在新浪无复权(分红)记录, 视为无分红, 前复权=不复权
        print("    无分红记录 ({}), 前复权按不复权处理".format(e))
        return []
    m = re.search(r"var \w+=(\{.*\})", r.text)
    if not m:
        print("    分红数据解析失败, 前复权按不复权处理")
        return []
    import json
    obj = json.loads(m.group(1))
    data = obj.get("data", [])
    rows = []
    for item in data:
        d = item.get("d")
        u = item.get("u")
        if not d or d == "1900-01-01" or u is None:
            continue
        rows.append((d, float(u)))
    rows.sort(key=lambda x: x[0])
    return rows


def build_qfq_adjust(rows):
    """根据累计分红序列构建每个交易日的 '前复权调整值'。

    前复权价 = 不复权价 - (累计分红_latest - 累计分红_截至当日)
    返回 dict: date_str -> 调整值(=u_latest - u_t), 并附带 u_latest
    """
    if not rows:
        return {}, 0.0, []
    u_latest = rows[-1][1]
    # 便于查询: 给定交易日 t, 取不超过 t 的最近 ex-date 的累计分红
    by_date = {d: u for d, u in rows}
    sorted_dates = [d for d, _ in rows]
    return by_date, u_latest, sorted_dates  # noqa


def main():
    bufuquan_rows = []
    qianfuquan_rows = []

    for code in CODES:
        prefix = "sh" + code if code[0] in ("5", "6") else "sz" + code
        print("处理 {} ({}) ...".format(code, prefix))

        # ---- 不复权 ----
        try:
            df = ak.fund_etf_hist_sina(symbol=prefix)
        except Exception as e:
            print("  fund_etf_hist_sina 失败, 重试一次... ({})".format(e))
            time.sleep(1.0)
            df = ak.fund_etf_hist_sina(symbol=prefix)

        raw = []
        for _, row in df.iterrows():
            raw.append({
                "date": str(row["date"]),
                "open": float(row["open"]),
                "high": float(row["high"]),
                "low": float(row["low"]),
                "close": float(row["close"]),
                "volumn": float(row["volume"]),
            })
        for r in raw:
            bufuquan_rows.append({"code": code, **r})

        # ---- 前复权 ----
        div_rows = fetch_cum_dividend(prefix)
        by_date, u_latest, sorted_dates = build_qfq_adjust(div_rows)

        for r in raw:
            d = r["date"]
            # 取不超过 d 的最近 ex-date 的累计分红
            u_t = None
            for sd in sorted_dates:
                if sd <= d:
                    u_t = by_date[sd]
                else:
                    break
            if u_t is None:
                u_t = 0.0
            adjust = u_latest - u_t  # 前复权需扣减的未来累计分红
            qianfuquan_rows.append({
                "code": code,
                "date": d,
                "open": round(r["open"] - adjust, 4),
                "high": round(r["high"] - adjust, 4),
                "low": round(r["low"] - adjust, 4),
                "close": round(r["close"] - adjust, 4),
                "volumn": r["volumn"],
            })

        print("  {} 不复权 {} 条, 前复权 {} 条 (累计分红最新值 {})".format(
            code, len(raw), len(raw), u_latest))

    write_csv("public/etf_bufuquan.csv", bufuquan_rows)
    write_csv("public/etf_qianfuquan.csv", qianfuquan_rows)
    print("完成。")


def write_csv(path, rows):
    rows_sorted = sorted(rows, key=lambda r: (r["code"], r["date"]))
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        for r in rows_sorted:
            writer.writerow(r)
    print("已写入 {} ({} 行)".format(path, len(rows_sorted)))


if __name__ == "__main__":
    sys.exit(main())
