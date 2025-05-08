<template>
  <header
    class="fixed z-50 left-0 top-0 right-0 flex items-center backdrop-blur-3xl bg-colorBackground-light/30 dark:bg-colorBackground-dark/30 border-b border-colorText-light/10 dark:border-colorText-dark/10"
  >
    <div
      class="flex h-16 items-center justify-between w-full max-w-4xl mx-auto px-4"
    >
      <NuxtLink
        class="flex items-center gap-2 text-lg font-semibold transition-all duration-300 hover:opacity-75"
        to="/"
        ><Icon name="ic:outline-all-inbox" size="22" />
        <h4>Toshokan</h4>
      </NuxtLink>

      <nav class="flex items-center space-x-2">
        <NuxtLink to="/search">
          <IconButton icon="ic:outline-search" />
        </NuxtLink>

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

        <NuxtLink to="/about">
          <IconButton icon="ic:outline-info" />
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
