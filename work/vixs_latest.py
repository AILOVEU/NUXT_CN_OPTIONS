# -*- coding: utf-8 -*-
"""生成 public/vixs.csv。

参考 akshare 的 index_option_5etf_qvix 系列方法（实为 index_option_{50etf,300etf,
500etf,cyb,kcb,100etf}_qvix），获取以下 ETF 期权标的的历史隐含波动率（QVIX）数据，
并保存为与 public/vixs.csv 相同格式的 CSV 文件：

    510050 -> index_option_50etf_qvix   (50ETF)
    510300 -> index_option_300etf_qvix  (300ETF)
    510500 -> index_option_500etf_qvix  (500ETF)
    588000 -> index_option_kcb_qvix     (科创板/科创50ETF)
    159915 -> index_option_cyb_qvix     (创业板ETF)
    159901 -> index_option_100etf_qvix  (100ETF / 深证100ETF)

数据源: http://1.optbbs.com/d/csv/d/k.csv (akshare 内部 __get_optbbs_daily 使用)

重要: 该外部站点可能不可达。本脚本已做以下防护，避免"卡住无提示":
    1. 使用带超时(默认 20s)的 requests 下载，而非 pd.read_csv(url) 直接挂起;
    2. 每次运行强制重新下载数据源(不读本地缓存)，处理完成后删除本地 k.csv;
    3. 下载/解析失败会打印清晰报错并退出，不会无限等待;
    4. 每个 code 单独 try/except 并打印进度，单个失败不影响其余。

输出格式: code,time,open,high,low,close
要求:
    - 日期统一为 YYYY/MM/DD
    - 丢弃含 NaN 的行
    - 先按 code 再按 date 排序
    - 文件名为 public/vixs.csv
"""
import csv
import io
import math
import os
import sys
import warnings
from datetime import datetime

import akshare as ak
import pandas as pd
import requests
from functools import lru_cache

# code -> akshare qvix 函数名
MAP = {
    '510050': 'index_option_50etf_qvix',
    '510300': 'index_option_300etf_qvix',
    '510500': 'index_option_500etf_qvix',
    '588000': 'index_option_kcb_qvix',
    '159915': 'index_option_cyb_qvix',
    '159901': 'index_option_100etf_qvix',     # 100ETF（深证100ETF）
    # '1000': 'index_option_1000index_qvix',  # 中证1000 指数
    # '300': 'index_option_300index_qvix',   # 沪深300 指数
    # '50': 'index_option_50index_qvix',    # 上证50 指数
}

OUT_FILE = os.path.join('public', 'vixs.csv')
LOCAL_KCSV = os.path.join('work', 'k.csv')     # 临时下载文件, 处理完成后删除
OPTBBS_URL = "http://1.optbbs.com/d/csv/d/k.csv"
DOWNLOAD_TIMEOUT = 20


@lru_cache(maxsize=1)
def get_optbbs_daily():
    """带超时地下载 optbbs 原始大表，替换 akshare 内部的无超时实现。

    多个 qvix 函数共用同一数据源, 用 lru_cache 保证每次运行只下载一次。
    不读/不写本地缓存: 每次运行都强制重新获取最新数据。
    """
    print("  下载数据源: {} (超时 {}s)".format(OPTBBS_URL, DOWNLOAD_TIMEOUT))
    try:
        r = requests.get(OPTBBS_URL, timeout=DOWNLOAD_TIMEOUT)
        r.raise_for_status()
    except requests.exceptions.Timeout:
        raise RuntimeError(
            "下载超时({}s): 数据源 {} 不可达。请检查网络后重试。".format(
                DOWNLOAD_TIMEOUT, OPTBBS_URL))
    except requests.exceptions.RequestException as e:
        raise RuntimeError(
            "无法下载 QVIX 数据源 ({}: {}). 请检查网络后重试。".format(
                type(e).__name__, e))

    try:
        # 用原始字节 + gbk 解码, 避免 requests 按 latin-1 猜编码导致中文乱码
        df = pd.read_csv(io.BytesIO(r.content), encoding='gbk')
    except Exception as e:
        raise RuntimeError("解析数据源失败 ({}: {})".format(type(e).__name__, e))
    return df


def patch_akshare_source():
    """monkeypatch akshare 的 __get_optbbs_daily 为带超时的版本。

    所有 index_option_*_qvix 函数共享同一模块全局 __get_optbbs_daily, 替换一次即可。
    """
    target = None
    for fn in MAP.values():
        f = getattr(ak, fn, None)
        if f is None:
            print("[WARN] akshare 中不存在函数: {} (跳过)".format(fn))
            continue
        g = f.__globals__
        if '__get_optbbs_daily' in g:
            target = g
            break
    if target is None:
        raise RuntimeError("未能定位 akshare 内部的 __get_optbbs_daily, 无法注入带超时数据源。")
    target['__get_optbbs_daily'] = get_optbbs_daily
    # 清掉原 lru_cache 的缓存, 避免命中旧的无超时实现
    old = target.get('__get_optbbs_daily')
    if hasattr(old, 'cache_clear'):
        try:
            old.cache_clear()
        except Exception:
            pass


def main():
    warnings.filterwarnings('ignore')  # 屏蔽 akshare 内部的 SettingWithCopyWarning
    patch_akshare_source()

    # 先获取一次共用数据源: 所有 qvix 函数共用 optbbs 大表,
    # 若源不可达应尽早明确报错并退出, 避免逐 code 重复超时, 且不破坏现有 vixs.csv。
    print("获取共用 QVIX 数据源(optbbs) ...")
    try:
        get_optbbs_daily()
    except Exception as e:
        print("[FATAL] 无法获取 QVIX 数据源: {}".format(e))
        print("        未修改现有文件 {}, 保留上次成功结果。".format(OUT_FILE))
        return 2

    rows = []
    total_raw = 0
    nan_dropped = 0
    failed = []

    for code, fn in MAP.items():
        f = getattr(ak, fn, None)
        if f is None:
            print("[SKIP] {}: akshare 无函数 {}".format(code, fn))
            failed.append(code)
            continue
        print("处理 {} ({}) ...".format(code, fn))
        try:
            df = f()
        except Exception as e:
            print("[ERROR] {} 获取失败: {}: {}".format(code, type(e).__name__, e))
            failed.append(code)
            continue

        for _, r in df.iterrows():
            total_raw += 1
            d = r['date']
            if d is None:
                nan_dropped += 1
                continue
            try:
                dt = datetime.strptime(str(d), '%Y-%m-%d').date()
            except ValueError:
                nan_dropped += 1
                continue
            try:
                op, hi, lo, cl = float(r['open']), float(r['high']), float(r['low']), float(r['close'])
            except (ValueError, TypeError):
                nan_dropped += 1
                continue
            if any(math.isnan(x) for x in (op, hi, lo, cl)):
                nan_dropped += 1
                continue
            rows.append([
                code,
                dt.strftime('%Y/%m/%d'),
                f'{op:.2f}',
                f'{hi:.2f}',
                f'{lo:.2f}',
                f'{cl:.2f}',
            ])

    # 先按 code（字典序）再按 date 排序
    rows.sort(key=lambda x: (x[0], x[1]))

    if failed:
        # 存在失败项: 不覆盖现有文件, 保留上次成功结果, 仅报错告知
        print("[WARN] 以下 code 处理失败, 已跳过: {}".format(", ".join(failed)))
        print("       未修改现有文件 {}, 保留上次成功结果。".format(OUT_FILE))
        return 1

    with open(OUT_FILE, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['code', 'time', 'open', 'high', 'low', 'close'])
        w.writerows(rows)

    # 处理完成, 删除临时下载的 k.csv(下次运行会重新获取)
    try:
        if os.path.exists(LOCAL_KCSV):
            os.remove(LOCAL_KCSV)
            print("  已删除临时数据源: {}".format(LOCAL_KCSV))
    except OSError as e:
        print("  [WARN] 删除 {} 失败: {}".format(LOCAL_KCSV, e))

    print(f'raw={total_raw}, nan_dropped={nan_dropped}, kept={len(rows)} -> {OUT_FILE}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
