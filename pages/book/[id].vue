<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

// Replace with actual imports
import Progressbar from "@/components/Progressbar.vue";
import ButtonFilled from "@/components/ButtonFilled.vue";

const book = ref(null);
const isLoadingBook = ref(true);
const bookFetchError = ref(null);

const user = ref(null);
const isLoadingUser = ref(false);
const userFetchError = ref(null);

const isDeleting = ref(false);
const deleteMessage = ref({ type: "", text: "" });

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const bookId = route.params.id;
  user.value = JSON.parse(localStorage.getItem("user"));

  if (!bookId) {
    bookFetchError.value = "Book ID is missing from the route.";
    isLoadingBook.value = false;
    return;
  }

  try {
    isLoadingBook.value = true;
    const res = await fetch(`${BASEURL}/book.php?id=${bookId}`);
    if (!res.ok) {
      const errorBody = await res.text();
      let errorMessage = `HTTP error fetching book: ${res.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error || errorMessage;
      } catch (e) {
        errorMessage = errorBody || errorMessage;
      }
      throw new Error(errorMessage);
    }
    const data = await res.json();
    if (data.success === false && data.error) {
      throw new Error(`API reported error: ${data.error}`);
    }
    if (!data || !data.book) {
      bookFetchError.value = "Book not found.";
      book.value = null;
    } else {
      book.value = data.book;
      bookFetchError.value = null;
    }
  } catch (error) {
    bookFetchError.value = error.message || "Failed to fetch book details.";
    console.error("Error fetching book:", error);
    book.value = null;
  } finally {
    isLoadingBook.value = false;
  }
});

const formattedCreatedAt = computed(() => {
  if (book.value && book.value.created_at) {
    try {
      const date = new Date(book.value.created_at);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      console.error("Failed to parse date:", book.value.created_at, e);
      return book.value.created_at;
    }
  }
  return "N/A";
});

const coverSrc = computed(() => {
  if (book.value && book.value.cover) {
    return book.value.cover;
  }
  return null;
});

const authorAvatarSrc = computed(() => {
  if (book.value && book.value.author_avatar) {
    return book.value.author_avatar;
  }
  return null;
});

const canEditOrDelete = computed(() => {
  if (!user.value || !book.value) return false;
  var canEditOrDelete =
    user.value.id == book.value.author || user.value.role === "admin";
  console.log(user.value.id);
  console.log(book.value.author);
  console.log(book.value.role);
  console.log(canEditOrDelete);
  return canEditOrDelete;
});

const editBook = () => {
  if (!canEditOrDelete.value || !book.value || !book.value.id) {
    console.warn("User not authorized or book data missing for editing.");
    return;
  }
  router.push(`/write?edit=${book.value.id}`);
};

const deleteBook = async () => {
  if (
    isDeleting.value ||
    !canEditOrDelete.value ||
    !book.value ||
    !book.value.id
  ) {
    console.warn("User not authorized or book data missing for deletion.");
    return;
  }

  const confirmed = confirm(
    `Are you sure you want to delete the book "${book.value.title}"?`
  );
  if (!confirmed) return;

  isDeleting.value = true;
  deleteMessage.value = { type: "", text: "" };

  try {
    const res = await fetch(`${BASEURL}/delete_book.php?id=${book.value.id}`, {
      method: "POST",
    });
    const responseText = await res.text();
    if (!res.ok) {
      let errorMessage = "Deletion failed.";
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.error || responseText;
      } catch (e) {
        errorMessage = responseText || "Unknown server error.";
      }
      deleteMessage.value = { type: "error", text: errorMessage };
      console.error("Delete API Error:", res.status, responseText);
    } else {
      let successMessage = "Book deleted successfully!";
      try {
        const successJson = JSON.parse(responseText);
        successMessage = successJson.message || successMessage;
      } catch (e) {
        successMessage = responseText || successMessage;
      }
      deleteMessage.value = { type: "success", text: successMessage };
      router.push("/");
    }
  } catch (err) {
    deleteMessage.value = {
      type: "error",
      text: "An unexpected error occurred during deletion.",
    };
    console.error("Fetch Error during deletion:", err);
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div
      v-if="isLoadingBook || isLoadingUser"
      class="flex items-center justify-center min-h-screen"
    >
      <Progressbar />
    </div>

    <div
      v-else-if="bookFetchError || userFetchError"
      class="min-h-screen flex flex-col gap-4 items-center justify-center text-red-600 dark:text-red-400"
    >
      <p class="text-2xl font-bold">Error Loading Page</p>
      <p
        v-if="bookFetchError"
        class="rounded p-3 bg-red-100 border border-red-400 dark:bg-red-900 dark:border-red-700 font-mono text-sm"
      >
        Book Error: {{ bookFetchError }}
      </p>
      <p
        v-if="userFetchError"
        class="rounded p-3 bg-red-100 border border-red-400 dark:bg-red-900 dark:border-red-700 font-mono text-sm"
      >
        User Error: {{ userFetchError }}
      </p>
      <ButtonFilled @click="onMounted">Retry Loading Page</ButtonFilled>
    </div>

    <div v-else-if="book" class="max-w-3xl mx-auto flex flex-col gap-8">
      <div
        v-if="deleteMessage.text"
        :class="{
          'text-green-600': deleteMessage.type === 'success',
          'text-red-600': deleteMessage.type === 'error',
          'mb-4 p-3 rounded': true,
          'bg-green-100 border border-green-400':
            deleteMessage.type === 'success',
          'bg-red-100 border border-red-400': deleteMessage.type === 'error',
        }"
      >
        {{ deleteMessage.text }}
      </div>

      <div class="flex justify-between items-center gap-4">
        <h1
          class="text-4xl md:text-5xl font-extrabold tracking-tight flex-grow"
        >
          {{ book.title }}
        </h1>
        <div v-if="canEditOrDelete" class="flex gap-2 flex-shrink-0">
          <ButtonFilled @click="editBook" class="w-fit h-fit text-sm"
            >Edit</ButtonFilled
          >
          <ButtonFilled
            @click="deleteBook"
            :disabled="isDeleting"
            class="w-fit h-fit text-sm bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-white dark:text-white"
          >
            {{ isDeleting ? "Deleting..." : "Delete" }}
          </ButtonFilled>
        </div>
      </div>

      <div
        v-if="book.author_name || authorAvatarSrc || book.created_at"
        class="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-600 dark:text-gray-400 text-sm"
      >
        <div
          v-if="book.author_name || authorAvatarSrc"
          class="flex items-center gap-2"
        >
          <img
            v-if="authorAvatarSrc"
            :src="authorAvatarSrc"
            :alt="`Avatar of ${book.author_name || 'Author'}`"
            class="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
          />
          <div
            v-else
            class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-semibold"
          >
            {{ book.author_name ? book.author_name[0] : "?" }}
          </div>
          <p
            v-if="book.author_name"
            class="font-medium text-gray-800 dark:text-gray-200"
          >
            {{ book.author_name }}
          </p>
        </div>

        <span
          v-if="(book.author_name || authorAvatarSrc) && book.created_at"
          class="hidden sm:block"
          >•</span
        >

        <p v-if="book.created_at">Published on {{ formattedCreatedAt }}</p>
      </div>

      <div v-if="coverSrc" class="my-4 flex justify-center">
        <img
          :src="coverSrc"
          :alt="`Cover for ${book.title || 'Book'}`"
          class="w-full h-auto object-cover rounded-lg shadow-lg"
        />
      </div>
      <div
        v-else
        class="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 shadow-lg my-4"
      >
        No Cover Image
      </div>

      <div class="prose lg:prose-lg dark:prose-invert mx-auto w-full">
        <div v-html="book.content"></div>
      </div>
    </div>

    <div
      v-else
      class="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-400"
    >
      <p class="text-xl">Book details could not be loaded.</p>
    </div>
  </div>
</template>

<style scoped>
/* Add any scoped styles here */
</style>
