import requests
import json
import os
import time
import random
import re
import ssl
from datetime import datetime, timedelta

# ========== 彻底禁用所有代理 ==========
os.environ['NO_PROXY'] = '*'
os.environ['no_proxy'] = '*'
for key in ['HTTP_PROXY','HTTPS_PROXY','http_proxy','https_proxy','ALL_PROXY','all_proxy']:
    os.environ.pop(key, None)

# 关闭SSL警告
ssl._create_default_https_context = ssl._create_unverified_context
requests.packages.urllib3.disable_warnings()

# ========== 配置区 ==========
ETF_LIST = {
    "510050": "上证50ETF",
    "510300": "沪深300ETF",
    "510500": "沪500ETF",
    "159922": "深500ETF",
    "159915": "创业板ETF",
    "588000": "科创50ETF",
}

OUTPUT_DIR = "..//public/etf-data"
REQUEST_DELAY = (0.5, 1.5)
MAX_RETRY = 1

# 请求配置
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://finance.sina.com.cn/"
}
PROXIES = {"http": None, "https": None}
# ============================


def parse_jsonp(text: str):
    """解析新浪可能返回的JSONP格式"""
    match = re.search(r'\((.*)\)', text, re.S)
    if match:
        return json.loads(match.group(1))
    return json.loads(text)


def get_prev_close(code: str, date_str: str) -> float:
    """获取前一交易日收盘价（新浪日线接口）"""
    prefix = "sh" if code.startswith("5") else "sz"
    symbol = f"{prefix}{code}"
    target_date = datetime.strptime(date_str, "%Y-%m-%d").date()

    for attempt in range(MAX_RETRY):
        try:
            url = "https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketData.getKLineData"
            params = {
                "symbol": symbol,
                "scale": 240,  # 240分钟=日线
                "ma": "no",
                "datalen": 20  # 取近20天足够找到前一个交易日
            }

            resp = requests.get(
                url,
                params=params,
                headers=HEADERS,
                proxies=PROXIES,
                verify=False,
                timeout=10
            )
            resp.raise_for_status()
            data = parse_jsonp(resp.text)

            if not data:
                return 0.0

            # 修复：日线数据day仅为 YYYY-MM-DD，不带时分秒
            prev_close = 0.0
            for item in data:
                day_str = item["day"].strip()
                day = datetime.strptime(day_str, "%Y-%m-%d").date()
                if day < target_date:
                    prev_close = float(item["close"])
                elif day == target_date:
                    break

            return round(prev_close, 4)

        except Exception as e:
            if attempt < MAX_RETRY - 1:
                time.sleep(random.uniform(2, 4) * (attempt + 1))
            else:
                print(f"  获取前收盘价失败 {code}: {str(e)[:60]}")
                return 0.0


def fetch_etf_1min(code: str, name: str, date_str: str) -> dict:
    """获取单只ETF指定日期的1分钟数据（新浪财经接口）"""
    prefix = "sh" if code.startswith("5") else "sz"
    symbol = f"{prefix}{code}"
    target_date = datetime.strptime(date_str, "%Y-%m-%d").date()

    for attempt in range(MAX_RETRY):
        try:
            url = "https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketData.getKLineData"
            params = {
                "symbol": symbol,
                "scale": 1,    # 1分钟线
                "ma": "no",
                "datalen": 480 # 取足够条数覆盖单日
            }

            resp = requests.get(
                url,
                params=params,
                headers=HEADERS,
                proxies=PROXIES,
                verify=False,
                timeout=15
            )
            resp.raise_for_status()
            data = parse_jsonp(resp.text)

            if not data:
                print(f"  {code} {name} 当日无数据")
                return None

            # 筛选目标日期的数据
            day_data = []
            for item in data:
                dt_str = item["day"]
                dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
                if dt.date() == target_date:
                    time_str = dt.strftime("%H:%M")
                    day_data.append([
                        time_str,
                        round(float(item["open"]), 4),
                        round(float(item["high"]), 4),
                        round(float(item["low"]), 4),
                        round(float(item["close"]), 4),
                        int(float(item["volume"]))
                    ])

            if not day_data:
                print(f"  {code} {name} 当日无数据")
                return None

            prev_close = get_prev_close(code, date_str)

            return {
                "name": name,
                "prevClose": prev_close,
                "data": day_data
            }

        except Exception as e:
            print(f"  第{attempt+1}次获取 {code} 失败: {str(e)[:80]}")
            if attempt < MAX_RETRY - 1:
                sleep_time = random.uniform(2, 5) * (attempt + 1)
                time.sleep(sleep_time)
            else:
                return None


def save_daily_data(date_str: str):
    """采集并保存单日所有ETF数据"""
    print(f"开始采集 {date_str} 的ETF 1分钟数据...")

    result = {
        "date": date_str,
        "etfs": {}
    }

    for code, name in ETF_LIST.items():
        print(f"  正在获取 {code} {name}...")
        etf_data = fetch_etf_1min(code, name, date_str)
        if etf_data:
            result["etfs"][code] = etf_data
            print(f"    成功，共 {len(etf_data['data'])} 条分钟数据")
        else:
            print(f"    获取失败，跳过")

        time.sleep(random.uniform(*REQUEST_DELAY))

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    filepath = os.path.join(OUTPUT_DIR, f"{date_str}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    print(f"\n数据已保存到 {filepath}")
    print(f"成功采集 {len(result['etfs'])} 只ETF")


def save_notes_template():
    """生成笔记模板文件"""
    notes_path = os.path.join(OUTPUT_DIR, "notes.json")
    if not os.path.exists(notes_path):
        with open(notes_path, "w", encoding="utf-8") as f:
            json.dump({}, f, ensure_ascii=False, indent=2)
        print(f"已创建笔记模板: {notes_path}")


if __name__ == "__main__":
    import sys

    save_notes_template()

    if len(sys.argv) > 1:
        target_date = sys.argv[1]
    else:
        target_date = datetime.now().strftime("%Y-%m-%d")

    save_daily_data(target_date)