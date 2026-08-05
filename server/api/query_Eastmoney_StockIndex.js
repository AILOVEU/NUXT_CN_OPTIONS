// import dayjs from "dayjs";

const COOKIE_LIST = {
  _: "qgqp_b_id=fb5df5b6e0a7997070f2db46d13f174b; st_nvi=DrSjGaplkwRgStWrxhuFN63a6; st_si=23195997070155; st_pvi=89950240211233; st_sp=2026-08-05%2022%3A23%3A18; st_inirUrl=; st_sn=1; st_psi=20260805222318578-113200301321-4659853510; st_asi=delete; nid18=004e74e9232417c75418fe255a1df0bb; nid18_create_time=1785939799589; gviem=4ns1Z0YySI2u6NRKZ8lmeab2c; gviem_create_time=1785939799589",
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
