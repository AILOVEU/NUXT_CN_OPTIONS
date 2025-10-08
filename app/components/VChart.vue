<template>
  <component v-if="VChart" :is="VChart" />
</template>

<script setup>
const VChart = ref(null)
onMounted(async () => {
    if(process.client){
        const {default:VChartComponent} = await import('vue-echarts')
        VChart.value = VChartComponent
    }
})
</script>
