// import dayjs from "dayjs";

const COOKIE_LIST = {
  _: "qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=y7BYR8q1U2SHGwn1-GzUK7bf4; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1770793551438; gviem=A9bdiUwg-I7EnaGd0w9Gi3808; gviem_create_time=1770793551438; EMFUND1=null; EMFUND2=null; EMFUND3=null; EMFUND4=null; EMFUND5=null; EMFUND6=null; EMFUND7=null; EMFUND8=null; EMFUND0=null; EMFUND9=02-11 16:22:07@#$%u5BCC%u56FD%u4E2D%u8BC1%u6E2F%u80A1%u901A%u4E92%u8054%u7F51ETF@%23%24159792; fullscreengg=1; fullscreengg2=1; st_si=38293442910260; st_pvi=05596905424376; st_sp=2026-02-11%2015%3A05%3A51; st_inirUrl=https%3A%2F%2Fwww.google.com.hk%2F; st_sn=1; st_psi=20260214114231859-113200301321-3443320868; st_asi=delete",
};
export default eventHandler(async (event) => {
  let cookie = COOKIE_LIST[getQuery(event)["fs"]] || COOKIE_LIST["_"];
  const res = await $fetch("https://push2." + "eastmoney.com" + "/api/qt/" + "clist/get", {
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
