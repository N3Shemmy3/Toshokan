// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: [
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
  ],
  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],
  icon: { size: "24px" },
  app: {
    pageTransition: {
      name: "fade",
      mode: "out-in",
    },
  },
  vite: {
    optimizeDeps: {
      include: ["lodash"], // Add lodash here
    },
    ssr: {
      noExternal: ["lodash"],
    },
  },
});
