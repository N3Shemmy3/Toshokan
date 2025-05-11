<template>
  <footer
    class="flex flex-col md:flex-row border-t border-colorText-light/10 dark:border-colorText-dark/10"
  >
    <div
      class="flex min-h-14 text-sm items-center justify-between w-full max-w-4xl mx-auto px-4"
    >
      <NuxtLink class="flex gap-1 items-center font-semibold" to="/">
        <Icon name="ic:outline-all-inbox" size="14" />
        <p>Toshokan</p>
      </NuxtLink>
      <div class="flex items-center gap-2">
        <Icon name="ic:outline-copyright" />
        <small>2025 All rights reserved</small>
      </div>
    </div>
  </footer>
</template>
