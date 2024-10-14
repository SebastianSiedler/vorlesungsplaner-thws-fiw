// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  modules: ["vuetify-nuxt-module", "@nuxtjs/i18n"],
  ssr: false,
  // vuetify: {
  //   moduleOptions: {
  //     /* module specific options */
  //   },
  //   vuetifyOptions: {
  //     /* vuetify options */
  //   },
  // },
  i18n: {
    vueI18n: "./i18n.config.ts",
  },
});
