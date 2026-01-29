// import dayjs from "dayjs";

const COOKIE_LIST = {
  "m:10+c:510050":
    "fullscreengg=1; fullscreengg2=1; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=EJhxvDCN_7Ykfs_mXTkDB999c; st_si=39570225427430; st_pvi=29641528326312; st_sp=2026-01-29%2015%3A32%3A14; st_inirUrl=; st_sn=1; st_psi=20260129153214209-113200301321-7756971010; st_asi=delete; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1769671934290; gviem=kFkUCZCYxTUZwkwpLDCC1aff8; gviem_create_time=1769671934290",
  "m:10+c:510300":
    "fullscreengg=1; fullscreengg2=1; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=ge-oyV8P89eZUVdZBOY7Md481; st_si=44696606669608; st_asi=delete; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1769671976964; gviem=rl9P2y7sQitM7ErySUDIpcd35; gviem_create_time=1769671976964; st_pvi=44059813178399; st_sp=2026-01-29%2015%3A32%3A56; st_inirUrl=; st_sn=2; st_psi=20260129153310508-113200301321-3983109666",
  "m:10+c:510500":
    "fullscreengg=1; fullscreengg2=1; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=szqN0IhqsGRbqxS4NoKjfa2a5; st_si=58934893917733; st_pvi=52538270379528; st_sp=2026-01-29%2015%3A34%3A28; st_inirUrl=; st_sn=1; st_psi=20260129153428850-113200301321-8689285287; st_asi=delete; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1769672069062; gviem=iSUZCiABUIWAAs-Z1i9pT2eac; gviem_create_time=1769672069062",
  _: "fullscreengg=1; fullscreengg2=1; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=xEFfWcWs2Lp4VTFS29G7o8c85; st_si=47581581913927; st_asi=delete; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1769672116437; gviem=mqmOm4mcDFzFdxeGGghsO8f76; gviem_create_time=1769672116437; st_pvi=93478255272635; st_sp=2026-01-29%2015%3A35%3A16; st_inirUrl=; st_sn=2; st_psi=20260129153520603-113200301321-8304312636",
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
