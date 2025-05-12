<script setup>
import { computed } from "vue";
import { useFetch } from "#app"; // Nuxt 3
// Assume BASEURL is globally available or imported

const phpApiUrl = BASEURL + "/index.php";

// Fetch the book data
const {
  data: apiResponse,
  pending,
  error: fetchError,
  refresh: refreshData,
} = await useFetch(phpApiUrl);

// Computed list of books
const books = computed(() => {
  if (apiResponse.value && Array.isArray(apiResponse.value)) {
    return apiResponse.value;
  }
  return [];
});

// Handle any error display
const displayError = computed(() => {
  if (fetchError.value) {
    return (
      fetchError.value.data?.error ||
      fetchError.value.message ||
      "A network or fetch error occurred."
    );
  }
  if (
    !pending.value &&
    !fetchError.value &&
    apiResponse.value &&
    !Array.isArray(apiResponse.value)
  ) {
    console.log(apiResponse.value);
    return "Unexpected data format from API.";
  }
  return null;
});
// Function to open a specific book page
const openBook = (id) => {
  useRouter().push(`/book/${id}`); // Navigate to the book detail page using the router instance
};
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="mt-16">
      <h4 v-if="!pending" class="text-xl md:text-4xl mt-4">Our latest books</h4>
      <div
        v-else-if="
          !pending &&
          Array.isArray(apiResponse.value) &&
          apiResponse.value.length === 0
        "
        class="flex min-h-screen items-center justify-center"
      >
        <h4 class="text-xl md:text-4xl mt-4">No books found</h4>
      </div>
    </div>

    <div
      v-if="pending"
      class="absolute left-0 top-0 right-0 bottom-0 flex items-center justify-center min-h-screen"
    >
      <Progressbar />
    </div>

    <p v-if="displayError" class="text-red-500 text-center">
      {{ displayError }}
    </p>

    <ul class="grid gap-4 md:gap-6 grid-responsive items-center list-none">
      <Book
        v-for="book in books"
        :key="book.id"
        :title="book.title"
        :cover="book.cover"
        @click="openBook(book.id)"
      />
    </ul>
  </div>
</template>
