import { OPTIONS_MAP, 金额 } from "~/data";
import dayjs from "dayjs";
import { formatDecimal } from "~/utils/utils";
import { useMoneyStore } from "~/stores/useMoneyStore";
import { ElMessage } from "element-plus";

async function get_target_http_data(fs) {
  let curr_page = 1;
  const pageSize = 100;
  let all_data = [];
  while (curr_page < 50) {
    // const res = await $fetch("https://push2.eastmoney.com/api/qt/clist/get", {
    let res = await $fetch("https://futsseapi.eastmoney.com/list/" + fs, {
      method: "get",
      params: {
        // id: 225,
        // callbackName: "jQuery37103791486625228607_1767149775219",
        field: "dm,sc,name,p,zdf,zsjd,zde,o,zjsj,h,l,vol,cje,wp,np,ccl",
        // token: '',
        orderBy: "cje",
        sort: "desc",
        pageSize,
        pageIndex: curr_page - 1,
      },
    }).catch((res) => {
      console.log(res);
    });
    res = JSON.parse(res);
    if (!res["list"]) {
      console.log(fs + "请求完成" + all_data.length);
      break;
    }
    curr_page += 1;
    let res_data = res["list"];
    res_data.forEach((_) => {
      all_data.push(_);
    });
    if (res_data?.length < pageSize) {
      console.log("请求完成" + all_data.length);
      break;
    }
  }
  return all_data;
}

let fields_dict = {
  ccl: "持仓量",
  cje: "成交额",
  dm: "代码",
  h: "最高价",
  l: "最低价",
  name: "期货名称",
  np: "内盘(卖盘)",
  o: "今开",
  p: "最新价",
  sc: "市场代码",
  vol: "成交量",
  wp: "外盘(买盘)",
  zde: "涨跌额",
  zdf: "涨跌幅",
  // zjsj: "昨收",
};
const 市场List = [
  {
    name: "广期所",
    fs: 225,
  },
  {
    name: "上期所",
    fs: 113,
  },
  {
    name: "大商所",
    fs: 114,
  },
  {
    name: "郑商所",
    fs: 115,
  },
];
export async function get_all_http_data() {
  let _all_data = [];
  const promiseList = 市场List.map((el) => {
    return new Promise((resolve) => {
      resolve(get_target_http_data(el.fs));
    });
  });
  await Promise.all(promiseList).then((list) => {
    list.forEach((el) => {
      _all_data.push(...el);
    });
  });
  let all_data = [];
  _all_data.forEach((_) => {
    let line_dict = {
      市场: 市场List.find((el) => el.fs === _.sc)?.name,
    };
    Object.keys(fields_dict).forEach((key) => {
      line_dict[fields_dict[key]] = _[key];
    });
    all_data.push(line_dict);
  });
  let 非主连List = all_data.filter((el) => !el.期货名称.includes("主连")).filter((el) => !el.期货名称.includes("次主连"));
  let 主连List = all_data.filter((el) => el.期货名称.includes("主连")).filter((el) => !el.期货名称.includes("次主连"));
  主连List = 主连List.map((el) => ({
    ...el,
    期货标的名称: el.期货名称.replace("主连", ""),
  }));
  主连List = 主连List.map((el) => ({
    ...el,
    月份List: 非主连List.filter((item) => item.期货名称.replace(/\d/g, "") === el.期货标的名称).map((el) => el.代码.match(/\d+\.?\d*/g)[0]),
  }));
  return 主连List;
}
