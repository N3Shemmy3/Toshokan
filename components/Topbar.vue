<script setup>
// Import necessary functions from Vue/Nuxt and libraries
import { ref, watch, onMounted, computed } from "vue"; // Ensure all necessary imports are here
import { useRoute, useRouter } from "vue-router"; // Import useRoute and useRouter
import { debounce } from "lodash"; // Assuming lodash is installed

// State for dialog and search
const isDialogOpen = ref(false);
const query = ref("");
const results = ref([]);

// Access the route and router instances using composition API
const route = useRoute(); // Get the reactive route object
const router = useRouter(); // Get the router instance

// State for color mode
const colorMode = useColorMode(); // Assuming useColorMode is available (from Nuxt or similar)
// Use a computed property to reactively track dark mode state based on colorMode.value
const isDarkMode = computed(() => colorMode.value === "dark");

// Toggle the search dialog visibility
const toggleDialog = (e) => {
  // Check if the click target is the dialog overlay itself (to close when clicking outside)
  if (e?.target?.id === "dialog") {
    // Use strict equality
    isDialogOpen.value = !isDialogOpen.value;
    // Optional: Clear search query and results when closing
    if (!isDialogOpen.value) {
      query.value = "";
      results.value = [];
    }
  }
};

// Toggle color mode preference
const toggleMode = () => {
  // Toggle between light and dark mode preference
  // If current preference is system, toggle between light/dark explicitly
  // If current preference is light/dark, switch to system
  if (colorMode.preference === "system") {
    colorMode.preference = isDarkMode.value ? "light" : "dark"; // This logic seems reversed? Should toggle to the *opposite* of current mode if not system. Let's simplify.
  } else {
    // If preference is light or dark, toggle between them
    colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
  }
  // Note: isDarkMode computed property will update automatically based on colorMode.value
};

// Debounced search function
// Delays the execution of the search logic until the user stops typing for 500ms
const debouncedSearch = debounce(async (newQuery) => {
  // If the query is empty or just whitespace, clear results and return
  if (!newQuery.trim()) {
    results.value = [];
    return;
  }

  try {
    // Construct the search API URL with the encoded query
    const res = await fetch(
      BASEURL + `/search.php?q=${encodeURIComponent(newQuery)}` // Assume BASEURL is defined
    );

    // Check if the HTTP response status is OK (2xx)
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Search API Error:", res.status, errorText);
      results.value = []; // Clear results on error
      // Optionally display a user-facing error message
      return;
    }

    // Parse the JSON response
    const data = await res.json();

    // Assuming the search API returns an array of results directly
    // Add a check if the data is an array for robustness
    if (Array.isArray(data)) {
      results.value = data;
    } else {
      console.error("Search API returned unexpected data format:", data);
      results.value = []; // Clear results if format is wrong
    }
  } catch (err) {
    // Catch network errors or issues with JSON parsing
    console.error("Fetch Error during search:", err);
    results.value = []; // Clear results on fetch error
  }
}, 500); // Delay of 500ms before executing search

// Watch the 'query' ref and trigger the debounced search when it changes
watch(query, (newQuery) => {
  debouncedSearch(newQuery);
});

// Function to open a specific book page
const openBook = (id) => {
  isDialogOpen.value = false; // Close the search dialog
  router.push(`/book/${id}`); // Navigate to the book detail page using the router instance
};

// State for user avatar and user object
const avatar = ref(null); // Stores the base64 avatar string or URL
const user = ref(null); // Stores the user object from local storage

// --- Lifecycle Hook ---
// Load user data from local storage when the component is mounted
onMounted(() => {
  const storedUser = localStorage.getItem("user");
  console.log("Stored User:", storedUser); // Debug log to check the value
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser);
      // Assuming user.value.avatar contains the base64 string or a URL
      if (user.value.avatar) {
        avatar.value = user.value.avatar; // Assign base64 image or URL
      } else {
        avatar.value = null; // Ensure avatar is null if not present
      }
    } catch (e) {
      console.error("Failed to parse user data from localStorage:", e);
      user.value = null; // Set user to null if parsing fails
      avatar.value = null; // Ensure avatar is null
      // Optionally clear invalid data: localStorage.removeItem("user");
    }
  } else {
    user.value = null; // Ensure user is null if no data exists
    avatar.value = null; // Ensure avatar is null
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
        class="flex items-center gap-2 text-lg font-semibold transition-all duration-300 hover:opacity-75"
        to="/"
      >
        <Icon name="ic:outline-all-inbox" size="22" />
        <h4 class="hidden md:flex">Toshokan</h4>
      </NuxtLink>

      <nav class="flex items-center space-x-2">
        <IconButton
          icon="ic:outline-search"
          @click="isDialogOpen = !isDialogOpen"
          :class="{ hidden: route.path === '/write' }"
        />

        <NuxtLink to="/books">
          <IconButton icon="ic:outline-inbox" />
        </NuxtLink>

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
        <NuxtLink to="/signin" v-if="!user">
          <ButtonFilled>Sign in</ButtonFilled>
        </NuxtLink>
      </nav>
    </div>

    <Transition name="slide-fade" :duration="300">
      <div
        v-show="isDialogOpen"
        id="dialog"
        @click="toggleDialog($event)"
        class="outer fixed left-0 top-0 right-0 bottom-0 h-screen z-50 flex justify-center px-4 mx-auto pt-[10rem] bg-black/75"
      >
        <div
          class="inner w-full rounded border border-colorText-light/10 dark:border-colorText-dark/10 divide-colorText-light/10 dark:divide-colorText-dark/10 h-fit max-w-[450px] mx-auto bg-colorBackground-light dark:bg-colorBackground-dark"
        >
          <div class="flex h-fit items-center gap-2 p-3 border-b">
            <Icon name="ic:outline-search" class="opacity-70" />
            <input
              type="text"
              v-model="query"
              placeholder="Search"
              class="w-full bg-transparent outline-none h-full"
              autofocus
            />
          </div>
          <TransitionGroup
            name="list"
            tag="ul"
            class="flex max-h-[300px] flex-col gap-2 px-1 py-2 overflow-y-auto"
          >
            <li
              v-for="book in results"
              :key="book.id"
              @click="openBook(book.id)"
              class="flex items-center gap-2 p-2 cursor-pointer rounded transition-colors duration-300 hover:bg-colorSurface-light dark:hover:bg-colorSurface-dark"
            >
              <div
                class="rounded-full flex items-center justify-center size-12 bg-colorSurface-light dark:bg-colorSurface-dark text-colorText-light dark:text-colorText-dark"
              >
                <img
                  v-if="book.cover"
                  :src="book.cover"
                  alt="Cover"
                  class="size-10 rounded-full object-cover"
                />
                <Icon v-else name="ic:outline-book" size="20" />
              </div>
              <div>
                <p
                  class="text-base font-medium leading-none text-colorText-light dark:text-colorText-dark"
                >
                  {{ book.title }}
                </p>
                <small
                  class="text-xs font-thin opacity-55 text-colorText-light dark:text-colorText-dark"
                >
                  {{ book.author_name }}
                </small>
              </div>
            </li>
            <li
              v-if="query.trim() && !results.length && !pending"
              class="flex flex-col items-center p-8"
            >
              <Icon name="ic:outline-search" size="48" />
              <p
                class="leading-7 mt-6 text-colorText-light dark:text-colorText-dark"
              >
                No results found
              </p>
            </li>
            <li
              v-if="pending && query.trim()"
              class="flex items-center justify-center p-4"
            >
              <Progressbar class="w-6 h-6" />
            </li>
          </TransitionGroup>
          <div
            v-if="!query.trim() && !pending"
            class="flex flex-col items-center p-8 bg-colorBackground-light dark:bg-colorBackground-dark text-colorText-light dark:text-colorText-dark"
          >
            <Icon name="ic:outline-search" size="48" />
            <p class="leading-7 mt-6">Start typing to search</p>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>
<style scoped>
/* Theme toggle button animation */
.theme-toggle-button {
  transition: transform 0.5s ease, opacity 0.5s ease;
}

.theme-toggle-button:active {
  transform: rotate(360deg);
}

/* Search Dialog Transition */
/* Apply transition to the outer overlay */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
}

/* Apply transition to the inner dialog panel */
.slide-fade-enter-active .inner {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* Ease-out */
  transform: translateY(0); /* End position */
}

.slide-fade-leave-active .inner {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* Ease-in */
  transform: translateY(0); /* Start position for leave */
}

.slide-fade-enter-from .inner {
  transform: translateY(100px); /* Start position for enter */
  opacity: 0; /* Start opacity for enter */
}
.slide-fade-leave-to .inner {
  transform: translateY(100px); /* End position for leave */
  opacity: 0; /* End opacity for leave */
}

/* List Transition (for search results) */
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
  position: absolute; /* Use absolute to take out of flow, but need to manage layout */
  /* Consider if position: absolute is appropriate for your list layout */
  /* If not, you might need a different approach for list transitions */
}
</style>
