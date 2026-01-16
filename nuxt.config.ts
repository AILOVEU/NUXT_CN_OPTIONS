// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-11-26",
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
  debug: false,
  nitro: {
    preset: "node-server",
    minify: false, // 开发时关闭压缩
  },
  vite: {
    build: {
      minify: false,
    },
  },
  modules: ["@nuxtjs/tailwindcss", "@element-plus/nuxt", "nuxt-echarts", "@pinia/nuxt"],
  ssr: false, // false 对应 server路径 ./持仓.csv；true 对应路径根目录 持仓.csv ; deno不支持true
  build: { transpile: ["echarts-liquidfill"] },
  echarts: {
    renderer: ["svg"],
    charts: ["SankeyChart", "LineChart", "BarChart", "MapChart", "PieChart", "ScatterChart", "SunburstChart", "CandlestickChart "],
    components: ["TitleComponent", "DatasetComponent", "GridComponent", "TooltipComponent", "ToolboxComponent", "LegendComponent", "GeoComponent", "VisualMapComponent", "MarkLineComponent", "MarkAreaComponent", "MarkPointComponent", "GraphicComponent", "DataZoomComponent"],
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
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },
  },
});
