// import dayjs from "dayjs";

const COOKIE_LIST = {
  _: "st_nvi=-ollAyLhDblH2Saal4CSPe09d; qgqp_b_id=83a7366c474092ee17159c3b5e107e9e; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1781509479353; gviem=-k81-RVefoHxB2fHVnddm6a71; gviem_create_time=1781509479353; st_si=31817168737282; st_pvi=29152043302579; st_sp=2026-06-15%2015%3A44%3A39; st_inirUrl=; st_sn=1; st_psi=20260616151423969-113200301321-8787342868; st_asi=delete",
};
export default eventHandler(async (event) => {
  let cookie = COOKIE_LIST[getQuery(event)["fs"]] || COOKIE_LIST["_"];
  const res = await $fetch("https://push2." + "eastmoney.com" + "/api/qt/" + "clist/get", {
    method: "get",
    params: getQuery(event),
    headers: {
      host: "push2.eastmoney.com",
      pragma: "no-cache",
      'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      // `sec-ch-ua-mobile`: '?0',
      "sec-ch-ua-platform": '"Windows"',
      // `sec-fetch-dest`: 'script',
      // `sec-fetch-mode`: 'no-cors',
      // `sec-fetch-site`: `same-site`,
      referer: "https://quote.eastmoney.com/center/gridlist.html",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      "connection": 'keep-alive',
      // `cache-control`: 'no-cache',
      "accept-language": "zh-CN,zh;q=0.9",
      "accept-encoding": "gzip, deflate, br, zstd",
      accept: "*/*",
      cookie,
    },
  });
  return res;
});
