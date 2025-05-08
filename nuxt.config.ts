// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxt/fonts", "@nuxt/icon", "@nuxtjs/tailwindcss"],
  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],
  icon: { size: "24px" },
  app: {
    head: {
      link: [
        {
          rel: "icon",
          type: "image/svg+xml",
          href: "/favicon.svg",
        },
      ],
    },
    pageTransition: {
      name: "fade",
      mode: "out-in",
    },
  },
});
