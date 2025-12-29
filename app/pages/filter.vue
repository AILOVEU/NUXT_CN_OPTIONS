<template>
  <div v-loading="loading || globalLoading.value" class="max-md:w-[200%]">
    <Nav />
    <FilterInfo :all_data="all_data" />
  </div>
</template>
<script setup>
import { OPTIONS_MAP } from "~/data";
import { get_http_data } from "~/utils";
import _ from "lodash";
import FilterInfo from "~/components/analysis/FilterInfo";
import { useGlobalLoading } from "~/stores/useGlobalLoading.js";
const { globalLoading } = useGlobalLoading();
const all_data = ref([]);
const loading = ref(false);
async function handleQuery() {
  loading.value = true;
  const [data] = await get_http_data(OPTIONS_MAP.map((el) => el.code));
  all_data.value = data;
  loading.value = false;
}
handleQuery();
</script>
