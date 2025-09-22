// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@element-plus/nuxt',
    "nuxt-lodash",
    '@nuxthub/core'
  ],
  // hub: {
  //   // NuxtHub options
  // },
  // future: { compatibilityVersion: 4 },
  // compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // css: ['~/styles/index.css']
})