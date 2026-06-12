// import dayjs from "dayjs";

const COOKIE_LIST = {
  _: "qgqp_b_id=83a7366c474092ee17159c3b5e107e9e; st_nvi=KeGHkVCDtiuvvmbF7byp364fe; st_si=54660430425108; st_asi=delete; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1781192730752; gviem=uYFSgDp6JJbgyuhIStPVA70b7; gviem_create_time=1781192730752; st_pvi=76724430781776; st_sp=2026-06-11%2023%3A45%3A30; st_inirUrl=; st_sn=6; st_psi=20260611235017398-113200301321-0858697160; wsc_checkuser_ok=1",
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
