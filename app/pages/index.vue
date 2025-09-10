<template>
  <el-button @click="refresh">刷新</el-button>
  <el-table
    :data="tableData.data"
    style="width: 100%"
    v-loading="tableData.loading"
    table-layout="auto"
  >
    <el-table-column
      v-for="key in tableData.columns"
      :key="key"
      :prop="key"
      :label="key"
      sortable 
    />
  </el-table>
</template>
<script setup>
import fields_dict from "~/data";
const tableData = reactive({
  data: [],
  loading: false,
  columns: [
    ...Object.values(fields_dict).map((el) => "C" + el),
    "期权",
    ...Object.values(fields_dict)
      .map((el) => "P" + el)
      .reverse(),
  ],
});
async function refresh() {
  tableData.loading = true;
  const res = await useFetch("/api/queryOps");
  tableData.data = res.data.value || [];
  tableData.loading = false;
}
</script>
