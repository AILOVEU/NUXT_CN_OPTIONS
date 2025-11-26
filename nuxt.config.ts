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
  typescript: {
    typeCheck: false, // 禁用类型检查（仅用于验证）
    strict: false,    // 关闭严格模式（减少类型校验开销）
  },
  nitro: {
    preset: "node-server",
    minify: false, // 开发时关闭压缩
  },
  vite: {
    build: {
      minify: false
    }
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
    renderer: ["canvas"],
    charts: [
      "SankeyChart",
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
  // 构建优化
  // vite: {
  //   build: {
  //     chunkSizeWarningLimit: 1000, // 提高 chunk 大小警告限制
  //     rollupOptions: {
  //       output: {
  //         manualChunks: {
  //           "vue-vendor": ["vue", "vue-router", "pinia"],
  //           "ui-vendor": ["@nuxt/ui", "some-ui-library"],
  //         },
  //       },
  //     },
  //   },
  // },
  // 路由优化
  // routeRules: {
  //   // 为静态路由启用预渲染
  //   '/': { prerender: true },
  //   '/hold': { prerender: true }
  // },

  // 减少自动导入（如果项目很大）
  // imports: {
  //   autoImport: true // 开发环境关闭自动导入
  // },
  // plugins: [],
  // sourcemap: false, // 禁用 sourcemap
  // css: {
  //   devSourcemap: false // 禁用 CSS sourcemap
  // }
  // css: ['~/styles/index.css']
});
