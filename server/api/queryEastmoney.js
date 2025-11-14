export default eventHandler(async (event) => {
  let cookie = 'qgqp_b_id=de87bbec62f1d2c7d9626e3127ebb846; st_pvi=56990777245722; st_sp=2024-01-02%2010%3A52%3A25; st_inirUrl=https%3A%2F%2Fwww.google.com%2F'
  const res = await $fetch("https://push2.eastmoney.com/api/qt/clist/get", {
    method: "get",
    params: getQuery(event),
    headers: {
      host: "push2.eastmoney.com",
      referer: "https://quote.eastmoney.com/center/gridlist.html",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
      cookie: 
        "fullscreengg=1; fullscreengg2=1; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=g8B8t3x0EIbSKu5IMoCDU5301; st_si=11132212015490; st_pvi=50833715688080; st_sp=2025-11-14%2015%3A43%3A55; st_inirUrl=; st_sn=1; st_psi=20251114154355754-113200301321-0995331439; st_asi=delete; nid=0c1248703dd9b67ef59239379fc2e655; nid_create_time=1763106236004; gvi=kp7e3V2nxcXlleZwO2fUQ0c3f; gvi_create_time=1763106236004",
    },
  });
  return res;
});
