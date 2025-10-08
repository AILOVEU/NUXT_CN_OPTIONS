// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: "icon", type: "image/x-icon", href: "/public/favicon.ico" }, // 指定 favicon 路径
      ],
    },
  },
  modules: [
    "@nuxtjs/tailwindcss",
    "@element-plus/nuxt",
    "nuxt-echarts",
    "@pinia/nuxt",
  ],
  ssr: true,
  build: { transpile: ["echarts-liquidfill"] },
  echarts: {
    renderer: ["canvas", "svg"],
    charts: [
      "LineChart",
      "BarChart",
      "MapChart",
      "PieChart",
      "ScatterChart",
      "SunburstChart",
    ],
    components: [
      "TitleComponent",
      "DatasetComponent",
      "GridComponent",
      "TooltipComponent",
      "ToolboxComponent",
      "LegendComponent",
      "GeoComponent",
      "VisualMapComponent",
      "MarkLineComponent",
    ],
  },
  // echarts: {
  //   charts: ["BarChart"],
  //   components: ["DatasetComponent", "GridComponent", "TooltipComponent"],
  // },
  // echarts: {
  //   charts: ['BarChart'],
  //   components: ['DatasetComponent', 'GridComponent', 'TooltipComponent'],
  // },
  // hub: {
  //   // NuxtHub options
  // },
  // future: { compatibilityVersion: 4 },
  // compatibilityDate: '2025-07-15',

  devtools: { enabled: false },
  // css: ['~/styles/index.css']
});
