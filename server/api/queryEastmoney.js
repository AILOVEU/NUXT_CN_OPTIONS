// import dayjs from "dayjs";
export default eventHandler(async (event) => {
  let cookie = `fullscreengg=1; fullscreengg2=1; st_nvi=vNy6-RplM4MLU1rw5TuPzd4c0; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_si=95302204113320; st_pvi=37467460773597; st_sp=2025-12-08%2017%3A51%3A25; st_inirUrl=; st_sn=1; st_psi=20251208175125872-113200301321-6857771890; st_asi=delete`;
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
