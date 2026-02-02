// import dayjs from "dayjs";

const COOKIE_LIST = {
  _: "fullscreengg=1; fullscreengg2=1; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=-URusFo8lKgiAjozMj5bGe97b; st_si=87931884780418; st_pvi=32076501664324; st_sp=2026-02-02%2015%3A01%3A21; st_inirUrl=; st_sn=1; st_psi=20260202150121733-113200301321-2029983405; st_asi=delete; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1770015682020; gviem=xw73ZqS7v0h6ZMu-Gq9JXef51; gviem_create_time=1770015682020",
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
