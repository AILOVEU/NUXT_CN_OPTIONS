import { defineStore } from "pinia";
import { 金额 } from "~/data";
export const useMoneyStore = defineStore("money", () => {
  const money = reactive({
    ...金额,
  });
  function set保证金(val) {
    money.占用保证金 = val;
  }

  return { money, set保证金 };
});