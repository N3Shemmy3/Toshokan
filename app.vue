<script setup>
useSeoMeta({
  ogTitle: "Toshokan",
  title: "Toshokan",
  ogdescription: "Share your books freely with the wolrd",
  description: "Share your books freely with the wolrd",
});
</script>
<template>
  <div class="flex flex-col">
    <Topbar />
    <main class="w-full min-h-screen h-full lg:max-w-4xl mx-auto py-24 px-4">
      <NuxtPage />
    </main>
    <Footer />
  </div>
</template>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  @apply outline-none border-colorText-light/30 dark:border-colorText-dark/30;
}
body {
  font-family: "Poppins", "sans-serif";
  overflow-x: hidden;
  @apply transition-colors duration-300 bg-colorBackground-light dark:bg-colorBackground-dark;
  @apply text-colorText-light dark:text-colorText-dark;
}

.font-cursive {
  font-family: "Edu QLD Beginner";
}

.grid-responsive {
  grid-area: span;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}

@media (min-width: 768px) {
  .grid-responsive {
    grid-area: span;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
