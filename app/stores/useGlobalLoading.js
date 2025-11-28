import { defineStore } from "pinia";
export const useGlobalLoading = defineStore("globalLoading", () => {
  const globalLoading = reactive({ value: false });
  function setGlobalLoading(val) {
    console.log("val", val);
    globalLoading.value = val;
  }
  return { globalLoading, setGlobalLoading };
});
