// import dayjs from "dayjs";

const COOKIE_LIST = {
  _: "qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=ehBRERETB5AziWsmo_56J50e3; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1770363124344; gviem=d91rwQx_GAAIFrcWWx3gvfcab; gviem_create_time=1770363124345; fullscreengg=1; fullscreengg2=1; st_si=28340020454269; st_asi=delete; wsc_checkuser_ok=1; st_pvi=33871840292620; st_sp=2026-02-06%2015%3A32%3A04; st_inirUrl=; st_sn=2; st_psi=20260209151709114-113200301321-6561723262",
};
export default eventHandler(async (event) => {
  let cookie = COOKIE_LIST[getQuery(event)["fs"]] || COOKIE_LIST["_"];
  const res = await $fetch("https://push2.eastmoney.com/api/qt/clist/get", {
    method: "get",
    params: getQuery(event),
    headers: {
      host: "push2.eastmoney.com",
      pragma: "no-cache",
      // 'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      // `sec-ch-ua-mobile`: '?0',
      "sec-ch-ua-platform": '"Windows"',
      // `sec-fetch-dest`: 'script',
      // `sec-fetch-mode`: 'no-cors',
      // `sec-fetch-site`: `same-site`,
      referer: "https://quote.eastmoney.com/center/gridlist.html",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      // "connection": 'keep-alive',
      // `cache-control`: 'no-cache',
      "accept-language": "zh-CN,zh;q=0.9",
      "accept-encoding": "gzip, deflate, br, zstd",
      accept: "*/*",
      cookie,
    },
  });
  return res;
});
