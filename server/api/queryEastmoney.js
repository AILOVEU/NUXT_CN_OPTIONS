import dayjs from 'dayjs';
export default eventHandler(async (event) => {
  let st_sp = encodeURIComponent(dayjs().format('YYYY-MM-DD HH:mm:ss'))
  let st_psi = `${dayjs().format('YYYYMMDDHHmmssSSS')}-113200301321-9808443140`
  let cookie = `st_si=37609242318303; st_asi=delete; st_pvi=73366267206983; st_sp=${st_sp}; st_inirUrl=https%3A%2F%2Foption.eastmoney.com%2F; st_sn=2; st_psi=${st_psi}`
  const res = await $fetch("https://push2.eastmoney.com/api/qt/clist/get", {
    method: "get",
    params: getQuery(event),
    headers: {
      host: "push2.eastmoney.com",
      referer: "https://quote.eastmoney.com/center/gridlist.html",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
      cookie
    },
  });
  return res;
});
