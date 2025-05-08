<template>
  <header
    class="fixed z-50 left-0 top-0 right-0 flex items-center bg-colorBackground-light dark:bg-colorBackground-dark border-b border-colorText-light/10 dark:border-colorText-dark/10"
  >
    <div
      class="flex h-16 items-center justify-between w-full max-w-4xl mx-auto px-4"
    >
      <NuxtLink class="text-lg font-semibold" to="/">Toshokan</NuxtLink>

      <nav class="flex items-center space-x-2">
        <IconButton icon="ic:outline-search" />

        <button
          class="relative flex items-center justify-center size-10 rounded-full transition-all duration-300 hover:bg-colorSurface-light dark:hover:bg-colorSurface-dark"
        >
          <Icon
            v-if="false"
            name="ic:outline-light-mode"
            class="absolute pointer-events-none"
          />
          <Icon
            v-else
            name="ic:outline-dark-mode"
            class="absolute pointer-events-none"
          />
        </button>
      </nav>
    </div>
  </header>
</template>
