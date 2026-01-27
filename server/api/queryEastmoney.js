// import dayjs from "dayjs";
export default eventHandler(async (event) => {
  let cookie = `fullscreengg=1; fullscreengg2=1; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=MBqMqm6ML7W3mMlh3o2WMf012; st_si=01698288922437; st_asi=delete; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1769508499843; gviem=khtCBrJdl6Lpp772sTxQKb920; gviem_create_time=1769508499844; wsc_checkuser_ok=1; st_pvi=31303858719552; st_sp=2026-01-27%2018%3A08%3A19; st_inirUrl=; st_sn=4; st_psi=20260127181022297-113200301321-5825745569`;
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
