### 获取STOCK-CODE_最近30天_1分钟K线_新浪
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
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings("ignore")

def get_stock_recent_1month_1min_kline(stock_code="510500"):
    """
    新浪财经数据源获取指定股票最近30个自然日的1分钟K线数据
    基于原代码优化：批量获取+日期范围筛选，无需每日循环调用
    """
    try:
        # 计算时间范围：最近30天
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        print(f"📅 数据时间范围：{start_date} 至 {end_date}（最近30天）")
        
        # 自动识别市场并添加前缀（新浪接口必须）
        if stock_code.startswith(('6', '5', '9')):
            symbol = f"sh{stock_code}"
        elif stock_code.startswith(('0', '1', '2', '3')):
            symbol = f"sz{stock_code}"
        else:
            print(f"错误：不支持的股票代码格式 {stock_code}")
            return pd.DataFrame()
        
        print(f"正在通过新浪财经获取 {stock_code}({symbol}) 的1分钟K线数据...")
        
        # 新浪接口默认返回最近1-2个月的全部分钟级数据，一次性获取
        df = ak.stock_zh_a_minute(
            symbol=symbol,
            period="1",
            adjust=""
        )
        
        if df.empty:
            print(f"警告：新浪财经未返回任何数据")
            return pd.DataFrame()
        
        # 第一步：统一转换数据类型（关键修复，避免字符串运算错误）
        df['day'] = pd.to_datetime(df['day'])
        df['open'] = pd.to_numeric(df['open'], errors='coerce')
        df['high'] = pd.to_numeric(df['high'], errors='coerce')
        df['low'] = pd.to_numeric(df['low'], errors='coerce')
        df['close'] = pd.to_numeric(df['close'], errors='coerce')
        df['volume'] = pd.to_numeric(df['volume'], errors='coerce').astype('Int64')  # 支持空值整数
        
        # 第二步：筛选最近30天的数据
        df = df[(df['day'].dt.date >= start_date) & (df['day'].dt.date <= end_date)]
        
        if df.empty:
            print(f"警告：最近30天内无有效交易数据（可能为非交易日或超出新浪数据保留范围）")
            return pd.DataFrame()
        
        # 第三步：数据清洗
        df.dropna(inplace=True)  # 删除缺失值行
        df['amount'] = (df['close'] * df['volume'] * 100).round(2)  # 计算成交额（元）
        
        # 第四步：格式化与排序
        df.rename(columns={'day': 'datetime'}, inplace=True)
        df.sort_values('datetime', inplace=True)
        df.reset_index(drop=True, inplace=True)
        
        # 统计交易日数量
        trade_days = df['datetime'].dt.date.nunique()
        print(f"✅ 获取成功！共 {len(df)} 条1分钟K线数据，覆盖 {trade_days} 个交易日")
        return df[['datetime', 'open', 'high', 'low', 'close', 'volume', 'amount']]
        
    except Exception as e:
        print(f"获取数据失败：{str(e)}")
        return pd.DataFrame()

def save_to_csv(df, stock_code="510500"):
    """将合并后的数据保存为单个CSV文件"""
    if not df.empty:
        # 文件名包含结束日期，便于区分不同批次
        end_date_str = datetime.now().strftime("%Y-%m-%d")
        filename = f"{stock_code}_最近30天_1分钟K线_新浪_{end_date_str}.csv"
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"\n📁 全部数据已合并保存到：{filename}")

if __name__ == "__main__":
    # 固定获取510500，如需修改可直接改这里
    target_stock = "510500"
    
    # 带重试机制
    max_retries = 3
    kline_data = pd.DataFrame()
    
    for attempt in range(1, max_retries + 1):
        kline_data = get_stock_recent_1month_1min_kline(target_stock)
        if not kline_data.empty:
            break
        if attempt < max_retries:
            print(f"⏳ 第 {attempt} 次获取失败，2秒后重试...")
            time.sleep(2)
    
    # 显示结果统计
    if not kline_data.empty:
        print("\n📊 数据预览（前10条）：")
        print(kline_data.head(10).to_string(index=False))
        
        first_datetime = kline_data['datetime'].iloc[0]
        last_datetime = kline_data['datetime'].iloc[-1]
        total_volume = kline_data['volume'].sum()
        total_amount = kline_data['amount'].sum()
        
        print(f"\n📈 数据时间跨度：{first_datetime} 至 {last_datetime}")
        print(f"💹 区间开盘：{kline_data['open'].iloc[0]:.4f} | 区间收盘：{kline_data['close'].iloc[-1]:.4f}")
        print(f"📉 区间最高：{kline_data['high'].max():.4f} | 区间最低：{kline_data['low'].min():.4f}")
        print(f"📦 区间总成交量：{total_volume:,} 手 | 区间总成交额：{total_amount:,.2f} 元")
        
        # 自动保存（无需手动确认，如需确认可取消注释下面两行）
        save_to_csv(kline_data, target_stock)
        # save_choice = input("\n是否保存为CSV文件？(y/n)：").strip().lower()
        # if save_choice == 'y':
        #     save_to_csv(kline_data, target_stock)
    else:
        print(f"\n❌ 经过 {max_retries} 次尝试，仍无法获取数据")
        print("可能的原因：")
        print("1. 网络连接不稳定")
        print("2. 新浪财经接口临时故障")
        print("3. 超出新浪数据保留范围（仅支持最近1-2个月）")