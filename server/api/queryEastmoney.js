// import dayjs from "dayjs";

const COOKIE_LIST = {
  _: "fullscreengg=1; fullscreengg2=1; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=QfGwF2eQsfQaV4KwwLZGX9daf; st_si=49793737665556; st_asi=delete; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1769756906861; gviem=pCr0vkHrQopE8T7buOwMQa897; gviem_create_time=1769756906862; wsc_checkuser_ok=1; st_pvi=34716232359452; st_sp=2026-01-30%2015%3A08%3A26; st_inirUrl=; st_sn=5; st_psi=20260130160007977-113200301321-4654561411",
};
export default eventHandler(async (event) => {
  let cookie = COOKIE_LIST[getQuery(event)["fs"]] || COOKIE_LIST["_"];
  console.log("cookie", cookie);
  const res = await $fetch("https://push2.eastmoney.com/api/qt/clist/get", {
    method: "get",
    params: getQuery(event),
    headers: {
      host: "push2.eastmoney.com",
      referer: "https://quote.eastmoney.com/center/gridlist.html",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
      cookie,
    },
  });
  return res;
});
