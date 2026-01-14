import { defineStore } from "pinia";
import { useMediaQuery } from "@vueuse/core";
export const useGlobal = defineStore("globalLoading", () => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const globalLoading = reactive({ value: false });
  const mobileScale = ref(355);

  function setGlobalLoading(val) {
    globalLoading.value = val;
  }

  return { globalLoading, setGlobalLoading, mobileScale, isMobile };
});
