import akshare as ak
import adata
import mplfinance as mpf
import pandas as pd
from datetime import datetime, timedelta
import argparse  # 导入参数解析模块

# 设置中文显示（解决图表中文乱码问题）
import matplotlib.pyplot as plt
plt.rcParams["font.family"] = ["SimHei", "WenQuanYi Micro Hei", "Heiti TC"]
plt.rcParams["axes.unicode_minus"] = False  # 解决负号显示问题

def get_jan_data(fund_code):
    # 存储所有1月份数据
    df = adata.fund.market.get_market_etf(fund_code=fund_code, k_type=1, start_date='2000-01-01',end_date='2025-12-31')
    # if not df.empty:
    #     # 数据格式处理：转换日期格式，重命名列适配mplfinance
    #     df["trade_date"] = pd.to_datetime(df["trade_date"])
    #     df.rename(columns={
    #         'open': 'Open',
    #         'high': 'High',
    #         'low': 'Low',
    #         'close': 'Close',
    #         'volume': 'Volume',
    #         'trade_date': 'Date'
    #     }, inplace=True)
    #     # 确保数值列是浮点型（解决mplfinance数据类型报错）
    #     for col in ["Open", "High", "Low", "Close", "Volume"]:
    #         df[col] = pd.to_numeric(df[col], errors='coerce')
        
    #     # 删除空值行
    #     df = df.dropna(subset=["Open", "High", "Low", "Close"])
        
    #     # 设置Date为索引
    #     df.set_index("Date", inplace=True)
        
        # 添加年份标识，方便后续区分
    df['fund_code'] = fund_code
    df.to_csv(f'{fund_code}_基金日线数据.csv')

    return
# 主程序执行
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='绘制每年1月份的日线蜡烛图')
    parser.add_argument('--fund_code', type=str, default=None, 
                        help='基金code')
    args = parser.parse_args()
    fund_code = args.fund_code
    # 获取数据
    jan_data_list = get_jan_data(fund_code)