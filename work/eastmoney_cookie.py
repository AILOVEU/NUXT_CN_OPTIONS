#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""隐身模式打开东方财富期权页面，获取 cookie 并保存。

用法:
    cd 项目根目录
    python3 work/fetch_eastmoney_cookie.py

依赖:
    pip3 install playwright
    playwright install chromium
"""

import os
from playwright.sync_api import sync_playwright

URL = "https://quote.eastmoney.com/center/gridlist.html#options_sz50etf_all"
COOKIE_FILE = os.path.join("app", "data", "eastmoney_cookie.dat")


def main():
    with sync_playwright() as p:
        # 隐身模式：每次新建独立上下文，不共享 cookie / 缓存
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        print(f"正在打开: {URL}")
        page.goto(URL, wait_until="networkidle", timeout=30000)

        # 等待页面 JS 完全执行
        page.wait_for_timeout(5000)

        cookies = context.cookies()
        cookie_str = "; ".join(f"{c['name']}={c['value']}" for c in cookies)

        os.makedirs(os.path.dirname(COOKIE_FILE), exist_ok=True)
        with open(COOKIE_FILE, "w", encoding="utf-8") as f:
            f.write(cookie_str)

        print(f"Cookie 已保存到 {COOKIE_FILE}（{len(cookies)} 个 cookie）")
        browser.close()


if __name__ == "__main__":
    main()