export default eventHandler(async (event) => {
  const res = await $fetch("https://push2.eastmoney.com/api/qt/clist/get", {
    method: "get",
    params: getQuery(event),
    headers: {
      cookie:
        "qgqp_b_id=693e55e5ec09b45d5adb84554dc935bf; st_nvi=vhjr3ypEyYMjp5BJ4lCV89fdb; nid=0d2921c4ec972d5b0cd098ea93036f44; nid_create_time=1754058533196; gvi=5RqzSUzpZsq_BP9jh6YCM4f0e; gvi_create_time=1754058533197; st_si=97259122754616; st_asi=delete; websitepoptg_api_time=1761299281902; fullscreengg=1; fullscreengg2=1; st_pvi=21140416938263; st_sp=2024-12-06%2009%3A08%3A33; st_inirUrl=https%3A%2F%2Fwww.bing.com%2F; st_sn=4; st_psi=20251024175059588-113200301321-4772474848",
    },
  });
  return res;
});
