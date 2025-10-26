// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          href: (process.env.NUXT_APP_BASE_URL || "") + "/favicon.ico",
        }, // 指定 favicon 路径
      ],
    },
  },
  modules: [
    "@nuxtjs/tailwindcss",
    "@element-plus/nuxt",
    "nuxt-echarts",
    "@pinia/nuxt",
  ],
  ssr: false, // false 对应 server路径 ./持仓.csv；true 对应路径根目录 持仓.csv ; deno不支持true
  build: { transpile: ["echarts-liquidfill"] },
  echarts: {
    renderer: ["svg"],
    charts: [
      'SankeyChart',
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
      "MarkPointComponent",
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
