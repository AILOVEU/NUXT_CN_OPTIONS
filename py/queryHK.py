import requests
import pandas as pd
import os
import urllib3
import time
import random
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# 关闭证书警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

"""
Date: 2023/3/20 15:20
Desc: 东方财富网-数据中心-特色数据-期权风险分析
https://data.eastmoney.com/other/riskanal.html
"""

fields_dict = {
    "f2": "最新价",
    "f3": "涨跌幅",
    "f5": "成交量",
    "f6": "成交额",
    "f12": "代码",
    "f14": "正股",
    "f103": "标签",
    "f133": '股息率TTM',
    "f502": "单手数量",
}

# for i in range(999):
#     name = 'f' + str(i+1)
#     if name not in fields_dict:
#         fields_dict[name] = name
print(fields_dict)
def query():
    curr_page = 1
    data = []
    url = "https://push2.eastmoney.com/api/qt/clist/get"

    session = requests.Session()
    session.trust_env = False
    retry_strategy = Retry(
        total=5,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "cookie": "qgqp_b_id=83a7366c474092ee17159c3b5e107e9e; st_nvi=bqbe4p9AP7rVfYT7l1FXmfb5d; st_si=17171424678046; st_asi=delete; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1782401131802; gviem=EbkZ0riWgG2BlK9DADHsKa7b8; gviem_create_time=1782401131802; st_pvi=32713917823078; st_sp=2026-06-25%2023%3A25%3A31; st_inirUrl=; st_sn=2; st_psi=20260625232536405-113200301321-9603128263; wsc_checkuser_ok=1"
    }

    while curr_page < 200:
        params = {
            "fid": "f3",
            "po": "1",
            "pz": "20",
            "pn": str(curr_page),
            "np": "1",
            "fltt": "2",
            "invt": "2",
            "ut": "b2884a393a59ad64002292a3e90d46a5",
            "fields": ",".join(fields_dict.keys()),
            "fs": "b:DLMK0146,b:DLMK0144"
        }
        try:
            r = session.get(url, params=params, verify=False, headers=headers, timeout=15)
            data_json = r.json()
            print(curr_page)
        except Exception as e:
            print(f"第{curr_page}页请求失败：{e}")
            curr_page += 1
            # 出错同样等待
            time.sleep(random.uniform(3, 5))
            continue

        if not data_json.get("data"):
            break
        res_data = data_json["data"]["diff"]
        for _ in res_data:
            line_dict = {}
            for key in fields_dict.keys():
                if fields_dict[key] in line_dict:
                    line_dict[fields_dict[key]] = _[key]
            data.append(line_dict)
        curr_page += 1

        # 核心：每次请求完成，随机暂停3~5秒
        sleep_sec = random.uniform(3, 5)
        print(f"等待{round(sleep_sec,1)}秒后请求下一页")
        time.sleep(sleep_sec)

    result_df = pd.DataFrame(data=data, columns=fields_dict.values())
    print(result_df)
    return result_df


temp_df = query()
numeric_list = [x for x in fields_dict.values() if x not in ["正股", "标签", "代码"]]
for key in numeric_list:
    temp_df[key] = pd.to_numeric(temp_df[key], errors="coerce")

temp_df["一手金额"] = temp_df.apply(
    lambda x: x["单手数量"] * x["最新价"],
    axis=1,
)
temp_df = temp_df.query("一手金额 > 0").query('股息率TTM > 0')
# 按股息率TTM降序
temp_df = temp_df.sort_values(by=["股息率TTM"], ascending=[False])

with pd.ExcelWriter(os.path.join("./", "港股数据.xlsx")) as writer:
    temp_df.to_excel(writer, sheet_name="港股", index=False)