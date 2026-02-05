// import dayjs from "dayjs";

const COOKIE_LIST = {
  _: "fullscreengg=1; fullscreengg2=1; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=eEQAXOHS-H8zOC2QCm3euc53b; st_si=57381054004116; st_pvi=86688042095642; st_sp=2026-02-05%2015%3A05%3A32; st_inirUrl=; st_sn=1; st_psi=20260205150532850-113200301321-1425057246; st_asi=delete; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1770275133295; gviem=JYlaySpTrSY5W4Z95ekdV1cae; gviem_create_time=1770275133295",
};
export default eventHandler(async (event) => {
  let cookie = COOKIE_LIST[getQuery(event)["fs"]] || COOKIE_LIST["_"];
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
