# -*- coding: utf-8 -*-
"""将 public/vixs_data 下的所有 .xls 文件合并生成 public/vixs2.csv。

原始 .xls 实为 GBK 编码的制表符分隔文本文件，结构为：
  第1行: 标题，含代码（如 "(TZ004)"）
  第2行: 表头（时间、开盘、最高、最低、收盘 ...）
  其余行: 数据

代码映射字典：
  TZ004 => 1000
  V050Z => 510050
  V300Z => 510300
  V500Z => 510500
  V800Z => 588000
  V901Z => 159901
  V915Z => 159915
"""
import csv
import glob
import os
import re

CODE_MAP = {
    'TZ004': '1000',
    'V050Z': '510050',
    'V300Z': '510300',
    'V500Z': '510500',
    'V800Z': '588000',
    'V901Z': '159901',
    'V915Z': '159915',
}

SRC_DIR = os.path.join('public', 'vixs_data')
OUT_FILE = os.path.join('public', 'vixs2.csv')
COLS = ['code', 'time', 'open', 'high', 'low', 'close']


def main():
    rows = []
    for f in sorted(glob.glob(os.path.join(SRC_DIR, '*.xls'))):
        raw = open(f, 'rb').read().decode('gbk', errors='replace')
        lines = raw.split('\n')
        if not lines:
            continue
        m = re.search(r'\(([^)]+)\)', lines[0])
        raw_code = m.group(1) if m else ''
        code = CODE_MAP.get(raw_code, raw_code)
        for line in lines[2:]:
            line = line.strip('\r')
            if not line.strip():
                continue
            parts = [p.strip() for p in line.split('\t')]
            if len(parts) < 5:
                continue
            time, op, hi, lo, cl = parts[0], parts[1], parts[2], parts[3], parts[4]
            rows.append([code, time, op, hi, lo, cl])

    with open(OUT_FILE, 'wb') as out:
        out.write('\xef\xbb\xbf')  # UTF-8 BOM
        w = csv.writer(out)
        w.writerow(COLS)
        w.writerows(rows)

    print('total rows:', len(rows))
    print('files:', len(glob.glob(os.path.join(SRC_DIR, '*.xls'))))


if __name__ == '__main__':
    main()
