import { defineStore } from "pinia";
// import { useMediaQuery } from "@vueuse/core";
// import UAParser from "ua-parser-js";

export const useGlobal = defineStore("globalLoading", () => {
  const isMobile = ref(false);

  const globalLoading = reactive({ value: false });
  const mobileScale = ref(355);

  function setGlobalLoading(val) {
    console.log("val", val);
    globalLoading.value = val;
  }

  isMobile.value = /Mobile|Android|iOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);

  return { globalLoading, setGlobalLoading, mobileScale, isMobile };
});
