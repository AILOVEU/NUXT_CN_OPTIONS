import os
import requests
import time
from datetime import datetime
from dateutil.relativedelta import relativedelta

# ========== 强制禁用所有代理 ==========
for proxy_var in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy']:
    os.environ.pop(proxy_var, None)
requests.Session().trust_env = False
# ======================================

import akshare as ak
import pandas as pd
import warnings
warnings.filterwarnings("ignore")

# 尝试导入进度条库
try:
    from tqdm import tqdm
    USE_TQDM = True
except ImportError:
    USE_TQDM = False
    print("提示：安装tqdm可显示更美观的进度条：pip install tqdm")

# ====================== 配置项 ======================
STOCK_CODE = "510500"  # 要获取的股票代码
GET_MONTHS = 3         # 获取最近几个月的数据
SAVE_FILENAME = f"{STOCK_CODE}_最近{GET_MONTHS}个月_1分钟K线_腾讯.csv"
PROGRESS_FILE = f".{STOCK_CODE}_progress_tencent.txt"
MAX_RETRIES_PER_DAY = 3  # 增加重试次数提高成功率
# ===================================================

def get_trading_days(start_date, end_date):
    """获取指定日期范围内的A股交易日列表"""
    try:
        print("正在获取A股交易日历...")
        calendar_df = ak.tool_trade_date_hist_sina()
        calendar_df['trade_date'] = pd.to_datetime(calendar_df['trade_date'])
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date)
        
        mask = (calendar_df['trade_date'] >= start_dt) & (calendar_df['trade_date'] <= end_dt)
        trading_days = calendar_df[mask]['trade_date'].dt.strftime("%Y-%m-%d").tolist()
        
        return sorted(trading_days)
    except Exception as e:
        print(f"交易日历获取失败，使用备选方案：{str(e)}")
        dates = pd.date_range(start=start_date, end=end_date, freq='D')
        trading_days = dates[dates.weekday < 5].strftime("%Y-%m-%d").tolist()
        return sorted(trading_days)

def get_stock_1min_kline_tencent(stock_code, query_date):
    """
    腾讯财经数据源获取单日1分钟K线数据（2026年6月最新可用）
    支持A股、ETF，数据保留最近约3个月
    """
    try:
        # 自动识别市场并添加前缀（腾讯接口格式：sh600000, sz000001）
        if stock_code.startswith(('6', '5', '9')):
            symbol = f"sh{stock_code}"
        elif stock_code.startswith(('0', '1', '2', '3')):
            symbol = f"sz{stock_code}"
        else:
            print(f"不支持的股票代码：{stock_code}")
            return pd.DataFrame()
        
        # 获取分钟级数据（腾讯接口返回最近多日数据）
        df = ak.stock_zh_a_minute_tx(
            symbol=symbol,
            period="1min",  # 腾讯接口使用"1min"而不是"1"
            adjust=""       # 不复权
        )
        
        if df.empty:
            return pd.DataFrame()
        
        # 数据类型转换
        df['time'] = pd.to_datetime(df['time'])
        df['open'] = pd.to_numeric(df['open'], errors='coerce')
        df['high'] = pd.to_numeric(df['high'], errors='coerce')
        df['low'] = pd.to_numeric(df['low'], errors='coerce')
        df['close'] = pd.to_numeric(df['close'], errors='coerce')
        df['volume'] = pd.to_numeric(df['volume'], errors='coerce').astype('Int64')
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
        
        # 筛选指定日期的数据
        target_date = datetime.strptime(query_date, "%Y-%m-%d").date()
        df = df[df['time'].dt.date == target_date]
        
        if df.empty:
            return pd.DataFrame()
        
        # 数据清洗
        df.dropna(inplace=True)
        df.rename(columns={'time': 'datetime'}, inplace=True)
        df.sort_values('datetime', inplace=True)
        df.reset_index(drop=True, inplace=True)
        
        # 统一输出列顺序
        return df[['datetime', 'open', 'high', 'low', 'close', 'volume', 'amount']]
        
    except Exception as e:
        # print(f"腾讯接口错误：{str(e)}")  # 调试时打开
        return pd.DataFrame()

def load_progress():
    """加载断点续传进度"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            completed_dates = f.read().splitlines()
        return set(completed_dates)
    return set()

def save_progress(date):
    """保存已完成的日期到进度文件"""
    with open(PROGRESS_FILE, 'a', encoding='utf-8') as f:
        f.write(f"{date}\n")

def batch_get_1min_kline():
    """批量获取最近N个月的1分钟K线数据"""
    # 计算日期范围
    end_date = datetime.now().date()
    start_date = end_date - relativedelta(months=GET_MONTHS)
    
    print(f"="*60)
    print(f"📅 开始批量获取 {STOCK_CODE} 的1分钟K线数据")
    print(f"📆 日期范围：{start_date.strftime('%Y-%m-%d')} 至 {end_date.strftime('%Y-%m-%d')}")
    print(f"🌐 数据源：腾讯财经（目前唯一可用的免费分钟级数据源）")
    print(f"⚠️  数据保留时间：最近约3个月")
    print(f"="*60)
    
    # 获取交易日列表
    trading_days = get_trading_days(start_date, end_date)
    if not trading_days:
        print("❌ 无法获取交易日历，程序退出")
        return
    
    print(f"📋 共找到 {len(trading_days)} 个交易日")
    
    # 加载已完成的进度
    completed_dates = load_progress()
    remaining_dates = [d for d in trading_days if d not in completed_dates]
    
    if not remaining_dates:
        print("✅ 所有日期的数据已获取完成")
        return
    
    print(f"📌 已完成 {len(completed_dates)} 天，剩余 {len(remaining_dates)} 天待获取")
    print("-"*60)
    
    all_data = []
    failed_dates = []
    
    # 遍历剩余日期获取数据
    date_iterator = tqdm(remaining_dates) if USE_TQDM else remaining_dates
    
    for date in date_iterator:
        if not USE_TQDM:
            print(f"正在获取 {date}...", end=" ", flush=True)
        
        # 单日重试机制
        day_success = False
        for attempt in range(MAX_RETRIES_PER_DAY + 1):
            df = get_stock_1min_kline_tencent(STOCK_CODE, date)
            if not df.empty:
                all_data.append(df)
                save_progress(date)
                day_success = True
                if not USE_TQDM:
                    print(f"✅ 成功 ({len(df)}条)")
                break
            if attempt < MAX_RETRIES_PER_DAY:
                time.sleep(1.5)  # 失败后等待1.5秒重试
        
        if not day_success:
            failed_dates.append(date)
            if not USE_TQDM:
                print("❌ 失败")
    
    # 合并所有数据
    if all_data:
        final_df = pd.concat(all_data, ignore_index=True)
        final_df.sort_values('datetime', inplace=True)
        
        # 保存到CSV
        final_df.to_csv(SAVE_FILENAME, index=False, encoding='utf-8-sig')
        
        print("\n" + "="*60)
        print(f"🎉 批量获取完成！")
        print(f"📊 成功获取 {len(all_data)} 天数据，共 {len(final_df)} 条1分钟K线")
        print(f"❌ 失败 {len(failed_dates)} 天")
        if failed_dates:
            print(f"失败日期：{failed_dates}")
        print(f"💾 数据已保存到：{os.path.abspath(SAVE_FILENAME)}")
        print("="*60)
        
        # 显示数据统计
        print("\n📈 数据统计：")
        print(f"最早时间：{final_df['datetime'].iloc[0]}")
        print(f"最晚时间：{final_df['datetime'].iloc[-1]}")
        print(f"总成交量：{final_df['volume'].sum():,} 手")
        print(f"总成交额：{final_df['amount'].sum():,.2f} 元")
        
        # 清理进度文件（全部完成时）
        if not failed_dates:
            os.remove(PROGRESS_FILE)
            print("\n✅ 全部完成，进度文件已清理")
    else:
        print("\n❌ 没有获取到任何数据")
        print("\n💡 可能的原因：")
        print("1. 股票代码输入错误")
        print("2. 网络连接不稳定")
        print("3. 腾讯财经接口临时波动，请稍后再试")

if __name__ == "__main__":
    # 先升级akshare到最新版本（必须！）
    print("正在检查并升级Akshare到最新版本...")
    os.system("pip install akshare --upgrade -q")
    print("升级完成，开始获取数据...\n")
    
    batch_get_1min_kline()