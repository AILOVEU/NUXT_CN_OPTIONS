# -*- coding: utf-8 -*-
"""生成 public/vixs.csv。

参考 akshare 的 index_option_5etf_qvix 系列方法（实为 index_option_{50etf,300etf,
500etf,cyb,kcb}_qvix），获取以下 5 个 ETF 期权标的的历史隐含波动率（QVIX）数据，
并保存为与 public/vixs.csv 相同格式的 CSV 文件：

    510050 -> index_option_50etf_qvix   (50ETF)
    510300 -> index_option_300etf_qvix  (300ETF)
    510500 -> index_option_500etf_qvix  (500ETF)
    588000 -> index_option_kcb_qvix     (科创板/科创50ETF)
    159915 -> index_option_cyb_qvix     (创业板ETF)

输出格式: code,time,open,high,low,close
要求:
    - 日期统一为 YYYY/MM/DD
    - 丢弃含 NaN 的行
    - 先按 code 再按 date 排序
    - 文件名为 public/vixs.csv
"""
import csv
import math
import os
import warnings
from datetime import datetime

import akshare as ak

# code -> akshare qvix 函数名
MAP = {
    '510050': 'index_option_50etf_qvix',
    '510300': 'index_option_300etf_qvix',
    '510500': 'index_option_500etf_qvix',
    '588000': 'index_option_kcb_qvix',
    '159915': 'index_option_cyb_qvix',
    '159901': 'index_option_100etf_qvix',     # 100ETF（深证100ETF）
    '1000': 'index_option_1000index_qvix',  # 中证1000 指数
    '300': 'index_option_300index_qvix',   # 沪深300 指数
    '50': 'index_option_50index_qvix',    # 上证50 指数
}

OUT_FILE = os.path.join('public', 'vixs.csv')


def main():
    warnings.filterwarnings('ignore')  # 屏蔽 akshare 内部的 SettingWithCopyWarning
    rows = []
    total_raw = 0
    nan_dropped = 0

    for code, fn in MAP.items():
        df = getattr(ak, fn)()
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

    with open(OUT_FILE, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['code', 'time', 'open', 'high', 'low', 'close'])
        w.writerows(rows)

    print(f'raw={total_raw}, nan_dropped={nan_dropped}, kept={len(rows)} -> {OUT_FILE}')


if __name__ == '__main__':
    main()
