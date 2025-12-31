// import dayjs from "dayjs";
export default eventHandler(async (event) => {
  let cookie = ``;
  const res = await $fetch(`https://futsseapi.eastmoney.com/list/${getQuery(event).id}`, {
    method: "get",
    params: getQuery(event),
    headers: {
      // host: "push2.eastmoney.com",
      // referer: "https://quote.eastmoney.com/center/gridlist.html",
      // "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
      // cookie,
    },
  });
  return res;
});
