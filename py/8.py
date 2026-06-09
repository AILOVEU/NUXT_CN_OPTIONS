import os
# 清除所有系统代理环境变量
os.environ.pop('HTTP_PROXY', None)
os.environ.pop('HTTPS_PROXY', None)
os.environ.pop('ALL_PROXY', None)

# 然后再导入akshare和其他库
import akshare as ak
import pandas as pd

# 你的原有代码
df = ak.fund_etf_hist_min_em(
    symbol="sh510500",
    period="1",
    adjust="qfq",
    start_date="2026-01-01",
    end_date="2026-06-08"
)

df.to_csv("510500_1min_202605_202606.csv", index=False, encoding="utf-8-sig")
print("数据获取成功！")