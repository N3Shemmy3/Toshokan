/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.{vue,js,ts,css}",
    "./assets/**/*.{vue,js,css}",
    "./components/**/*.{vue,js}",
    "./layOuts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        colorBackground: {
          light: "#F7F4ED",
          dark: "#242424",
        },
        colorText: {
          light: "#191919",
          dark: "#FFFFFF",
        },
        colorSurface: {
          light: "#EAEAEA",
          dark: "#424242",
        },
      },
    },
  },
  plugins: [],
};
