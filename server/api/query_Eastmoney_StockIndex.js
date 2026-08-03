// import dayjs from "dayjs";

const COOKIE_LIST = {
  _: "qgqp_b_id=fb5df5b6e0a7997070f2db46d13f174b; st_nvi=L1yWEeMo0BhKl3nWNh5Tb07e2; nid18=0f4f961de20f18db67adee4fe5e66cff; nid18_create_time=1785402357622; gviem=xvoxpNTEUNy_P-et58JHJ1c92; gviem_create_time=1785402357622; st_si=52397539261779; st_asi=delete; st_pvi=85216879439588; st_sp=2026-07-30%2017%3A05%3A56; st_inirUrl=https%3A%2F%2Fwww.google.com.hk%2F; st_sn=3; st_psi=20260803203616753-113200301321-5053314820",
};
export default eventHandler(async (event) => {
  let cookie = COOKIE_LIST[getQuery(event)["fs"]] || COOKIE_LIST["_"];
  const res = await $fetch("https://push2." + "eastmoney.com" + "/api/qt/" + "clist/get", {
    method: "get",
    params: getQuery(event),
    headers: {
      // host: "push2.eastmoney.com",
      // pragma: "no-cache",
      // 'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      // // `sec-ch-ua-mobile`: '?0',
      // "sec-ch-ua-platform": '"Windows"',
      // // `sec-fetch-dest`: 'script',
      // // `sec-fetch-mode`: 'no-cors',
      // // `sec-fetch-site`: `same-site`,
      // referer: "https://quote.eastmoney.com/center/gridlist.html",
      // "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      // "connection": 'keep-alive',
      // // `cache-control`: 'no-cache',
      // "accept-language": "zh-CN,zh;q=0.9",
      // "accept-encoding": "gzip, deflate, br, zstd",
      // accept: "*/*",
      cookie,
    },
  });
  // console.log(res);
  return res;
});
