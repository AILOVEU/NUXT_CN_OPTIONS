import dayjs from "dayjs";
export default eventHandler(async (event) => {
  let cookie = `fullscreengg=1; fullscreengg2=1; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=85waxIoBYEnN5gxMGZI2a5727; st_si=56304214774557; st_asi=delete; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1764572853092; gviem=-QpcsDjocpPdoWOXH3f_e7a18; gviem_create_time=1764572853093; st_pvi=54843293934490; st_sp=2025-12-01%2015%3A07%3A32; st_inirUrl=; st_sn=2; st_psi=20251201150809369-113200301321-3043073337`
  const res = await $fetch("https://push2.eastmoney.com/api/qt/clist/get", {
    method: "get",
    params: getQuery(event),
    headers: {
      host: "push2.eastmoney.com",
      referer: "https://quote.eastmoney.com/center/gridlist.html",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
      cookie,
    },
  });
  return res;
});
