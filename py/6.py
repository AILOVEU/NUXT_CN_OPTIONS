import os
import requests
import time

# ========== 强制禁用所有代理 ==========
for proxy_var in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy']:
    os.environ.pop(proxy_var, None)
requests.Session().trust_env = False
# ======================================

import akshare as ak
import pandas as pd
from datetime import datetime
import warnings
warnings.filterwarnings("ignore")

def get_stock_1min_kline(stock_code, query_date):
    """
    新浪财经数据源获取指定股票在指定日期的1分钟K线数据
    已修复字符串相乘错误
    """
    try:
        # 验证日期格式
        target_date = datetime.strptime(query_date, "%Y-%m-%d").date()
        
        # 自动识别市场并添加前缀（新浪接口必须）
        if stock_code.startswith(('6', '5', '9')):
            symbol = f"sh{stock_code}"
        elif stock_code.startswith(('0', '1', '2', '3')):
            symbol = f"sz{stock_code}"
        else:
            print(f"错误：不支持的股票代码格式 {stock_code}")
            return pd.DataFrame()
        
        print(f"正在通过新浪财经获取 {stock_code}({symbol}) 在 {query_date} 的1分钟K线数据...")
        
        # 获取最近的分钟级数据
        df = ak.stock_zh_a_minute(
            symbol=symbol,
            period="1",
            adjust=""
        )
        
        if df.empty:
            print(f"警告：新浪财经未返回任何数据")
            return pd.DataFrame()
        
        # 第一步：先转换数据类型（关键修复！）
        df['day'] = pd.to_datetime(df['day'])
        df['open'] = pd.to_numeric(df['open'], errors='coerce')
        df['high'] = pd.to_numeric(df['high'], errors='coerce')
        df['low'] = pd.to_numeric(df['low'], errors='coerce')
        df['close'] = pd.to_numeric(df['close'], errors='coerce')
        df['volume'] = pd.to_numeric(df['volume'], errors='coerce').astype('Int64')  # 支持空值的整数类型
        
        # 第二步：筛选指定日期的数据
        df = df[df['day'].dt.date == target_date]
        
        if df.empty:
            print(f"警告：{query_date} 不是交易日或无数据（新浪仅保留最近1-2个月数据）")
            return pd.DataFrame()
        
        # 第三步：删除有缺失值的行
        df.dropna(inplace=True)
        
        # 第四步：再计算成交额（此时都是数值类型了）
        df['amount'] = (df['close'] * df['volume'] * 100).round(2)
        
        # 重命名列名
        df.rename(columns={'day': 'datetime'}, inplace=True)
        
        # 按时间排序
        df.sort_values('datetime', inplace=True)
        df.reset_index(drop=True, inplace=True)
        
        print(f"✅ 获取成功！共 {len(df)} 条1分钟K线数据")
        return df[['datetime', 'open', 'high', 'low', 'close', 'volume', 'amount']]
        
    except ValueError as e:
        print(f"日期格式错误，请使用'YYYY-MM-DD'格式：{e}")
        return pd.DataFrame()
    except Exception as e:
        print(f"获取数据失败：{str(e)}")
        return pd.DataFrame()

def save_to_csv(df, stock_code, query_date):
    """将数据保存为CSV文件"""
    if not df.empty:
        filename = f"{stock_code}_{query_date}_1min_kline_sina.csv"
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"📁 数据已保存到：{filename}")

if __name__ == "__main__":
    stock_code = input("请输入股票代码（如510500）：") or "510500"
    query_date = input("请输入查询日期（如2026-06-05）：") or "2026-05-28"
    
    # 带重试机制
    max_retries = 3
    kline_data = pd.DataFrame()
    
    for attempt in range(1, max_retries + 1):
        kline_data = get_stock_1min_kline(stock_code, query_date)
        if not kline_data.empty:
            break
        if attempt < max_retries:
            print(f"⏳ 第 {attempt} 次获取失败，2秒后重试...")
            time.sleep(2)
    
    # 显示结果
    if not kline_data.empty:
        print("\n📊 数据预览（前10条）：")
        print(kline_data.head(10).to_string(index=False))
        
        print(f"\n📈 交易时段：{kline_data['datetime'].iloc[0]} 至 {kline_data['datetime'].iloc[-1]}")
        print(f"💹 当日开盘：{kline_data['open'].iloc[0]:.4f} | 收盘：{kline_data['close'].iloc[-1]:.4f}")
        print(f"📉 当日最高：{kline_data['high'].max():.4f} | 最低：{kline_data['low'].min():.4f}")
        print(f"📦 总成交量：{kline_data['volume'].sum():,} 手 | 总成交额：{kline_data['amount'].sum():,.2f} 元")
        
        save_choice = input("\n是否保存为CSV文件？(y/n)：").strip().lower()
        if save_choice == 'y':
            save_to_csv(kline_data, stock_code, query_date)
    else:
        print(f"\n❌ 经过 {max_retries} 次尝试，仍无法获取数据")
        print("可能的原因：")
        print("1. 查询日期不是交易日（周末或节假日）")
        print("2. 日期超出新浪财经数据保留范围（仅最近1-2个月）")
        print("3. 股票代码输入错误")
        print("4. 网络连接不稳定")