import dayjs from "dayjs";
import { generateEastMoneyCookies } from "./cookieClass";
export default eventHandler(async (event) => {
  let st_sp = encodeURIComponent(dayjs().format("YYYY-MM-DD HH:mm:ss"));
  let st_psi = `${dayjs().format("YYYYMMDDHHmmssSSS")}-113200301321-9808443140`;
  let cookie = `st_nvi=nowKK43zqBo9z2DA3YqiHd1dd; qgqp_b_id=9b5c5b018a8a9ff2f8d9780997fc2519; nid=010d039dd427dc4d187090491f47d7ad; nid_create_time=1764142421507; gvi=iXLX2FIhQ5XluzRbcENiJ6e15; gvi_create_time=1764142421507; fullscreengg=1; fullscreengg2=1; st_si=62478325838925; st_pvi=60507986574562; st_sp=2025-11-26%2015%3A33%3A41; st_inirUrl=; st_sn=1; st_psi=20251127175944589-113200301321-3443841300; st_asi=delete`
  // 生成初始cookie
  // cookie = generateEastMoneyCookies();
  console.log(cookie)
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
