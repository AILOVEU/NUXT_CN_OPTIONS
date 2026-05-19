// import dayjs from "dayjs";

const COOKIE_LIST = {
  _: "qgqp_b_id=83a7366c474092ee17159c3b5e107e9e; st_nvi=d9jNMRWwPV6-Yu72WrKIMb8c4; st_si=46172680129321; st_pvi=34912651544211; st_sp=2026-05-19%2011%3A35%3A42; st_inirUrl=; st_sn=1; st_psi=2026051911354270-113200301321-6275112989; st_asi=delete; nid18=0a78177fb812bebb626a2b42b8ec90ef; nid18_create_time=1779161742313; gviem=lTDeBHkIbEKn_vNPZGX_5a99e; gviem_create_time=1779161742313",
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
