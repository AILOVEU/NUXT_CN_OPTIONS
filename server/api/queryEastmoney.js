export default eventHandler(async (event) => {
  const res = await $fetch("https://push2.eastmoney.com/api/qt/clist/get", {
    method: "get",
    params: getQuery(event),
    headers: {
      host: "push2.eastmoney.com",
      referer: "https://quote.eastmoney.com/center/gridlist.html",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
      cookie:
        "fullscreengg=1; fullscreengg2=1; st_nvi=e81SmacZ_MzN01HW7vb9zefc3; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_si=68877358700421; st_asi=delete; nid=010d039dd427dc4d187090491f47d7ad; nid_create_time=1761721508530; gvi=l9oAoIE2RKR8ni7jwsBx_dc5b; gvi_create_time=1761721508530; st_pvi=21140416938263; st_sp=2024-12-06%2009%3A08%3A33; st_inirUrl=https%3A%2F%2Fwww.bing.com%2F; st_sn=7; st_psi=20251029150551439-113200301321-8910902451",
    },
  });
  return res;
});
