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
        "qgqp_b_id=de87bbec62f1d2c7d9626e3127ebb846; st_nvi=9sfcXbsJWFgqX6J9wo5098db5; nid=0c1248703dd9b67ef59239379fc2e655; nid_create_time=1762493884180; gvi=eBoch3lM2OTpe8jqlrooI9f18; gvi_create_time=1762493884181; websitepoptg_api_time=1762939113305; st_si=23799796147610; st_asi=delete; fullscreengg=1; fullscreengg2=1; st_pvi=56990777245722; st_sp=2024-01-02%2010%3A52%3A25; st_inirUrl=https%3A%2F%2Fwww.google.com%2F; st_sn=5; st_psi=2025111310122581-113200301321-7358958801",
    },
  });
  return res;
});
