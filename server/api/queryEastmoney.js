// import dayjs from "dayjs";
export default eventHandler(async (event) => {
  let cookie = `qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=VqQzPfoDDjaUliXvPUWLzd615; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1765963266647; gviem=G5XQ9sd-wjZshJcLLfF1he822; gviem_create_time=1765963266647; fullscreengg=1; fullscreengg2=1; st_si=67123813664779; st_asi=delete; wsc_checkuser_ok=1; st_pvi=41225675846038; st_sp=2025-12-17%2017%3A21%3A06; st_inirUrl=; st_sn=2; st_psi=20251222152423175-113200301321-7045436695`;
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
