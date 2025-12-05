import dayjs from "dayjs";
import { generateRandomString } from "~/utils/utils";
export default eventHandler(async (event) => {
  let cookie = `fullscreengg=1; fullscreengg2=1; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_nvi=85waxIoBYEnN5gxMGZI2a5727; st_si=56304214774557; st_asi=delete; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1764572853092; gviem=-QpcsDjocpPdoWOXH3f_e7a18; gviem_create_time=1764572853093; st_pvi=54843293934490; st_sp=2025-12-01%2015%3A07%3A32; st_inirUrl=; st_sn=2; st_psi=20251201150809369-113200301321-3043073337`;
  cookie = `fullscreengg=1; fullscreengg2=1; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; st_si=71883826609597; st_pvi=40211882468693; st_sp=2025-12-05%2015%3A20%3A05; st_inirUrl=; st_sn=1; st_psi=20251205152005701-113200301321-1858581236; st_asi=delete; st_nvi=JW11MqRxPAiF-tufJkuor138c; nid18=010d039dd427dc4d187090491f47d7ad; nid18_create_time=1764919205914; gviem=Pzd9yVaTThYVvSpWpetgGa8a3; gviem_create_time=1764919205914`;
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
