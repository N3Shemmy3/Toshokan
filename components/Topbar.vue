<script setup>
const isDialogOpen = ref(false);

const toggleDialog = (e) => {
  if (e?.target?.id == "dialog") {
    isDialogOpen.value = !isDialogOpen.value;
  }
};
</script>
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
        <IconButton
          icon="ic:outline-search"
          @click="isDialogOpen = !isDialogOpen"
        />

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

        <NuxtLink to="/profile">
          <img
            class="rounded-full size-10 p-1 object-cover transition-all duration-300 hover:opacity-95 hover:bg-colorSurface-light dark:hover:bg-colorSurface-dark"
            src="https://avatars.githubusercontent.com/u/67279072?v=4"
            alt="avatar"
          />
        </NuxtLink>
      </nav>
    </div>

    <!--Search Dialog-->
    <Transition name="fade">
      <div
        v-if="isDialogOpen"
        id="dialog"
        @click="toggleDialog($event)"
        class="fixed left-0 top-0 right-0 bottom-0 h-screen z-50 flex justify-center px-4 mx-auto pt-[10rem] bg-black/75"
      >
        <div
          class="w-full rounded border divide-y border-colorText-light/10 dark:border-colorText-dark/10 divide-colorText-light/10 dark:divide-colorText-dark/10 h-fit md:max-w-[450px] mx-auto bg-colorBackground-light dark:bg-colorBackground-dark"
        >
          <div class="flex h-fit items-center gap-2 p-3">
            <Icon name="ic:outline-search" class="opacity-70" />
            <input
              type="text"
              placeholder="Saerch"
              class="w-full bg-transparent outline-none h-full"
            />
          </div>
          <ul class="flex flex-col gap-2 px-1 py-2">
            <li
              v-for="n in 4"
              class="flex items-center gap-2 p-2 cursor-pointer rounded transition-colors duration-300 hover:bg-colorSurface-light dark:hover:bg-colorSurface-dark"
            >
              <Icon name="ic:outline-book" size="20" />
              <small class="text-base font-medium leading-none text-opacity-75">
                Search result
              </small>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </header>
</template>
