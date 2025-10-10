import { defineStore } from "pinia";
export const useHttpStore = defineStore("httpStore", () => {
  const httpStore = reactive({
    value: undefined,
  });
  function setHttpStore(val) {
    httpStore.value = val;
  }

  return { httpStore, setHttpStore };
});
