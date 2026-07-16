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


def get_7_days_range(date_str: str) -> list[str]:
    """根据输入日期，生成包含当天在内的连续7天（当天+往前6天），升序排列"""
    target_dt = datetime.strptime(date_str, "%Y-%m-%d").date()
    day_list = []
    # 往前推6天 + 当天，共7天
    for offset in range(6, -1, -1):
        cur_day = target_dt - timedelta(days=offset)
        day_list.append(cur_day.strftime("%Y-%m-%d"))
    return day_list


def parse_jsonp(text: str):
    """解析新浪可能返回的JSONP格式"""
    match = re.search(r'\((.*)\)', text, re.S)
    if match:
        return json.loads(match.group(1))
    return json.loads(text)


def get_prev_close(raw_kline_list: list, target_date: str) -> float:
    """
    从一次性拉取的全量分钟K线提取前一日收盘价
    item["day"] 格式：2026-07-13 14:49:0，带时分秒
    """
    target_date_obj = datetime.strptime(target_date, "%Y-%m-%d").date()
    prev_close = 0.0
    for item in raw_kline_list:
        day_full_str = item["day"].strip()
        # 分割只取日期部分
        day_str = day_full_str.split(" ")[0]
        day = datetime.strptime(day_str, "%Y-%m-%d").date()
        if day < target_date_obj:
            prev_close = float(item["close"])
        elif day == target_date_obj:
            break
    return round(prev_close, 4)


def fetch_etf_week_all_data(code: str, name: str) -> dict | None:
    """
    一次性拉取该ETF大量分钟K线，覆盖连续7天数据
    重要：新浪此接口【不支持传入起止日期参数】，只能用datalen拉最新N条
    """
    prefix = "sh" if code.startswith("5") else "sz"
    symbol = f"{prefix}{code}"

    for attempt in range(MAX_RETRY):
        try:
            url = "https://quotes.sina.cn/cn/api/json_v2.php/CN_MarketData.getKLineData"
            # 参数仅支持品种、周期、条数，无start/end日期字段
            # 7个交易日每天最多240根分钟线，预留余量
            params = {
                "symbol": symbol,
                "scale": 1,    # 1分钟线
                "ma": "no",
                "datalen": 240 * 7
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
            all_raw_data = parse_jsonp(resp.text)

            if not all_raw_data:
                print(f"  {code} {name} 无原始分钟数据")
                return None

            # 按日期分组：key=YYYY-MM-DD, value=当日分钟K线列表
            date_group = {}
            for item in all_raw_data:
                dt_str = item["day"]
                dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
                day_key = dt.strftime("%Y-%m-%d")
                if day_key not in date_group:
                    date_group[day_key] = []
                date_group[day_key].append({
                    "time_obj": dt,
                    "time_str": dt.strftime("%H:%M"),
                    "open": round(float(item["open"]), 4),
                    "high": round(float(item["high"]), 4),
                    "low": round(float(item["low"]), 4),
                    "close": round(float(item["close"]), 4),
                    "volume": int(float(item["volume"])),
                    "raw_day": item["day"],
                    "raw_close": float(item["close"])
                })

            return {
                "raw_all": all_raw_data,
                "grouped_by_date": date_group
            }

        except Exception as e:
            print(f"  第{attempt+1}次拉取 {code} 7天数据失败: {str(e)[:80]}")
            if attempt < MAX_RETRY - 1:
                sleep_time = random.uniform(2, 5) * (attempt + 1)
                time.sleep(sleep_time)
            else:
                return None


def build_single_day_file_data(etf_week_info: dict, target_day: str) -> dict | None:
    """根据缓存数据，构造单日期完整json结构，无数据返回None"""
    grouped = etf_week_info["grouped_by_date"]
    raw_all = etf_week_info["raw_all"]

    if target_day not in grouped or len(grouped[target_day]) == 0:
        return None

    day_minute_list = []
    for bar in grouped[target_day]:
        day_minute_list.append([
            bar["time_str"],
            bar["open"],
            bar["high"],
            bar["low"],
            bar["close"],
            bar["volume"]
        ])

    # 计算前收盘价
    prev_close = get_prev_close(raw_all, target_day)
    return {
        "prevClose": prev_close,
        "data": day_minute_list
    }


def save_7days_data(base_date_str: str):
    """
    主逻辑：
    1. 获取输入日期 + 往前6天，连续7天日期列表
    2. 每只ETF只请求一次接口拉足量分钟线，7天共用缓存，无重复请求
    3. 分别组装7天独立文件，当日无任何ETF数据则跳过不生成文件
    """
    seven_day_list = get_7_days_range(base_date_str)
    print(f"目标7天日期列表(含输入日及前6天): {seven_day_list}")

    # 存储每只ETF一次性拉取的缓存数据，避免重复请求
    etf_cache = {}

    # 第一步：一次性拉取所有ETF完整K线数据（每只仅请求1次接口）
    for code, name in ETF_LIST.items():
        print(f"\n正在一次性拉取 {code} {name} 多日分钟数据...")
        week_data = fetch_etf_week_all_data(code, name)
        if week_data is None:
            print(f"  {code} 数据拉取失败，后续该ETF所有日期跳过")
            etf_cache[code] = None
        else:
            etf_cache[code] = {
                "name": name,
                "week_info": week_data
            }
        time.sleep(random.uniform(*REQUEST_DELAY))

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 第二步：循环7天，分别生成独立文件
    for day_str in seven_day_list:
        daily_result = {
            "date": day_str,
            "etfs": {}
        }
        has_any_data = False

        print(f"\n===== 处理日期 {day_str} =====")
        for code, cache_info in etf_cache.items():
            if cache_info is None:
                continue
            name = cache_info["name"]
            week_info = cache_info["week_info"]

            day_etf_data = build_single_day_file_data(week_info, day_str)
            if day_etf_data is not None:
                daily_result["etfs"][code] = {
                    "name": name,
                    "prevClose": day_etf_data["prevClose"],
                    "data": day_etf_data["data"]
                }
                has_any_data = True
                print(f"  {code} {name}: {len(day_etf_data['data'])} 条分钟数据")
            else:
                print(f"  {code} {name}: {day_str} 无交易数据，跳过")

        # 当前日期无任何ETF数据，不生成文件
        if not has_any_data:
            print(f"  {day_str} 无有效ETF数据，不输出文件")
            continue

        # 写入单日json文件
        filepath = os.path.join(OUTPUT_DIR, f"{day_str}.json")
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(daily_result, f, ensure_ascii=False)
        print(f"  {day_str} 文件已保存: {filepath}，共采集 {len(daily_result['etfs'])} 只ETF")


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
        input_date = sys.argv[1]
    else:
        input_date = datetime.now().strftime("%Y-%m-%d")

    print(f"输入基准日期: {input_date}")
    save_7days_data(input_date)