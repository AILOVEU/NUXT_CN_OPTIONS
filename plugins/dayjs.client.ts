// plugins/dayjs.client.ts
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/zh-cn";

// 注册 updateLocale 插件
dayjs.extend(updateLocale);
// 设置中文语言包，并将一周起始日设为周一（weekStart: 1）
dayjs.locale("zh-cn");
dayjs.updateLocale("zh-cn", {
  weekStart: 1,
});
console.log("plugins/dayjs.client.ts已加载");
