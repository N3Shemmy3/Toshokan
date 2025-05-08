<template>
  <div class="flex min-h-screen">
    <Topbar />
    <main
      class="w-full lg:max-w-4xl mx-auto pt-16 px-4 border-x border-colorText-light/10 dark:border-colorText-dark/10"
    >
      <NuxtPage />
    </main>
  </div>
</template>
<style>
body {
  font-family: "Poppins", "sans-serif";
  @apply bg-colorBackground-light dark:bg-colorBackground-dark;
  @apply text-colorText-light dark:text-colorText-dark;
}

.font-cursive {
  font-family: "Edu QLD Beginner";
}
</style>
