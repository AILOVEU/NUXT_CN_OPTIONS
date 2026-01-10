import { defineStore } from "pinia";
import { useMediaQuery } from "@vueuse/core";
import UAParser from 'ua-parser-js'

export const useGlobal = defineStore("globalLoading", () => {
  const isMobile = ref(false)
  
  const userAgent = navigator.userAgent
  const parser = new UAParser(userAgent)
  const deviceType = parser.getDevice().type
  
  isMobile.value = deviceType === 'mobile' || deviceType === 'tablet'

  const globalLoading = reactive({ value: false });
  const mobileScale = ref(355);

  function setGlobalLoading(val) {
    console.log("val", val);
    globalLoading.value = val;
  }

  return { globalLoading, setGlobalLoading, mobileScale, isMobile };
});
