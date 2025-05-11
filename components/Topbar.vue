<script setup>
const isDialogOpen = ref(false);

const toggleDialog = (e) => {
  if (e?.target?.id == "dialog") {
    isDialogOpen.value = !isDialogOpen.value;
  }
};
const colorMode = useColorMode();
const isDarkMode = ref(colorMode.value === "dark");

const toggleMode = () => {
  // Toggle between light and dark mode
  if (colorMode.preference === "system") {
    colorMode.preference = isDarkMode.value ? "light" : "dark";
  } else {
    colorMode.preference = "system";
  }

  // Toggle the isDarkMode state
  isDarkMode.value = !isDarkMode.value;
};

const query = ref("");
const results = ref([]);

watch(query, async (newQuery) => {
  if (!newQuery.trim()) {
    results.value = [];
    return;
  }

  try {
    const res = await fetch(
      BASEURL + `/search.php?q=${encodeURIComponent(newQuery)}`
    );
    const data = await res.json(); // Your search.php must output JSON!
    results.value = data;
  } catch (err) {
    console.error(err);
    results.value = [];
  }
});

const openBook = (id) => {
  useRouter().push(`/book/${id}`);
};
const avatar = ref();
const user = ref();
onMounted(() => {
  user.value = JSON.parse(localStorage.getItem("user"));
  if (user && user.avatar) {
    avatar.value = user.avatar; // base64 image
  }
});
</script>
<template>
  <header
    class="fixed z-50 left-0 top-0 right-0 flex items-center backdrop-blur-3xl bg-colorBackground-light/30 dark:bg-colorBackground-dark/30 border-b border-colorText-light/10 dark:border-colorText-dark/10"
  >
    <div
      class="flex h-16 items-center justify-between w-full lg:max-w-4xl mx-auto px-4"
    >
      <NuxtLink
        v-if="$route.path == '/'"
        class="flex items-center gap-2 text-lg font-semibold transition-all duration-300 hover:opacity-75"
        to="/"
        ><Icon name="ic:outline-all-inbox" size="22" />
        <h4>Toshokan</h4>
      </NuxtLink>
      <div
        class="flex items-center gap-2 text-lg font-semibold transition-all duration-300 hover:opacity-75"
        v-else
      >
        <IconButton icon="ic:outline-arrow-back" @click="$router.back()" />
      </div>

      <nav class="flex items-center space-x-2">
        <IconButton
          icon="ic:outline-search"
          @click="isDialogOpen = !isDialogOpen"
          :class="{ hidden: $route.path == '/write' }"
        />
        <ButtonFilled v-if="$route.path == '/write'">Publish</ButtonFilled>

        <IconButton
          :icon="isDarkMode ? 'ic:outline-dark-mode' : 'ic:outline-light-mode'"
          @click="toggleMode"
          class="theme-toggle-button"
        />

        <NuxtLink to="/profile" v-if="avatar">
          <img
            class="rounded-full size-10 p-1 object-cover transition-all duration-300 hover:opacity-95 hover:bg-colorSurface-light dark:hover:bg-colorSurface-dark"
            :src="avatar"
            alt="avatar"
          />
        </NuxtLink>
        <NuxtLink to="/signin" v-show="!user">
          <ButtonFilled>Sign in</ButtonFilled>
        </NuxtLink>
      </nav>
    </div>

    <!--Search Dialog-->
    <!-- Dialog Overlay-->
    <Transition name="slide-fade" :duration="300">
      <div
        v-show="isDialogOpen"
        id="dialog"
        @click="toggleDialog($event)"
        class="outer fixed left-0 top-0 right-0 bottom-0 h-screen z-50 flex justify-center px-4 mx-auto pt-[10rem] bg-black/75"
      >
        <div
          class="inner w-full rounded border divide-y border-colorText-light/10 dark:border-colorText-dark/10 divide-colorText-light/10 dark:divide-colorText-dark/10 h-fit md:max-w-[450px] mx-auto bg-colorBackground-light dark:bg-colorBackground-dark"
        >
          <div class="flex h-fit items-center gap-2 p-3">
            <Icon name="ic:outline-search" class="opacity-70" />
            <input
              type="text"
              v-model="query"
              placeholder="Saerch"
              class="w-full bg-transparent outline-none h-full"
            />
          </div>
          <ul
            class="flex max-h-full h-fit flex-col gap-2 px-1 py-2 overflow-y-scroll"
          >
            <li
              v-for="book in results"
              :key="book.id"
              @click="openBook(book.id)"
              class="flex items-center gap-2 p-2 cursor-pointer rounded transition-colors duration-300 hover:bg-colorSurface-light dark:hover:bg-colorSurface-dark"
            >
              <div
                class="rounded-full flex items-center justify-center size-12 bg-colorSurface-light dark:bg-colorSurface-dark"
              >
                <Icon name="ic:outline-inbox" size="20" />
              </div>
              <div>
                <p class="text-base font-medium leading-none">
                  {{ book.title }}
                </p>
                <small class="text-xs font-thin opacity-55"
                  >{{ book.author_name }}
                </small>
              </div>
            </li>
            <div
              v-if="!results.length"
              class="flex flex-col items-center p-8 bg-colorBackground-light dark:bg-colorBackground-dark"
            >
              <Icon name="ic:outline-search" size="48" />
              <p class="leading-7 [&:not(:first-child)]:mt-6">
                No results found
              </p>
            </div>
          </ul>
        </div>
      </div>
    </Transition>
  </header>
</template>
<style scoped>
.theme-toggle-button {
  transition: transform 0.5s ease, opacity 0.5s ease;
}

.theme-toggle-button:active {
  transform: rotate(360deg);
}
.slide-fade-enter-active .inner {
  transition-delay: 0.1s;
  transition: all 0.3s;
  transform: translateZ(0);
}

.slide-fade-leave-active .inner {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
  transform: translateZ(0);
}
.slide-fade-enter-from .inner,
.slide-fade-leave-to .inner {
  transform: translateY(100%) translateZ(0);
  opacity: 0;
}
.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
  position: relative;
}
</style>
