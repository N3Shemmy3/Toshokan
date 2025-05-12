<script setup>
import { ref, onMounted, computed } from "vue"; // Ensure computed is imported
import { useRoute, useRouter } from "vue-router"; // Ensure useRouter is imported
// Assuming BASEURL is defined somewhere accessible
// Assuming Progressbar component is imported
// Assuming ButtonFilled component is imported (for error state retry)
// Assuming Icon component is imported if used elsewhere

// Reactive state for book data
const book = ref(null); // Stores the fetched book data
const isLoadingBook = ref(true); // Loading state for initial book fetch
const bookFetchError = ref(null); // Stores any error message for initial book fetch

// State for logged-in user
const user = ref(null); // Stores the logged-in user object fetched from server
const isLoadingUser = ref(false); // Loading state for user fetch
const userFetchError = ref(null); // Stores any error message for user fetch

// State for delete action
const isDeleting = ref(false); // Loading state for delete button
const deleteMessage = ref({ type: "", text: "" }); // Message for delete action feedback

// Get the current route and router instances
const route = useRoute();
const router = useRouter();

// --- Lifecycle Hook ---
// Fetch the book details and logged-in user details when the component is mounted
onMounted(async () => {
  const bookId = route.params.id; // Get book ID from route parameter

  // --- Fetch Logged-in User Details ---
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      const localUser = JSON.parse(storedUser);
      if (localUser && typeof localUser.id !== "undefined") {
        isLoadingUser.value = true;
        // Fetch user details from a dedicated endpoint using the ID from localStorage
        // You need to create a get_user_details.php endpoint
        const userRes = await fetch(
          `${BASEURL}/get_user_details.php?id=${localUser.id}`
        ); // Assume BASEURL is defined

        if (!userRes.ok) {
          const errorBody = await userRes.text();
          let errorMessage = `HTTP error fetching user: ${userRes.status}`;
          try {
            const errorJson = JSON.parse(errorBody);
            errorMessage = errorJson.error || errorMessage;
          } catch (e) {
            errorMessage = errorBody || errorMessage;
          }
          userFetchError.value = errorMessage;
          console.error("Fetch User API Error:", userRes.status, errorBody);
          user.value = null; // Ensure user is null on fetch error
          localStorage.removeItem("user"); // Clear potentially stale user data
        } else {
          const userData = await userRes.json();
          // Assuming get_user_details.php returns { success: true, user: {...} }
          if (userData.success && userData.user) {
            user.value = userData.user; // Store fetched user data
            localStorage.setItem("user", JSON.stringify(user.value)); // Update localStorage with fresh data
            userFetchError.value = null; // Clear user fetch error
          } else {
            userFetchError.value = userData.error || "Failed to get user data.";
            console.error("Fetch User API reported error:", userData);
            user.value = null;
            localStorage.removeItem("user"); // Clear potentially stale user data
          }
        }
      } else {
        console.warn("Invalid user data found in localStorage.");
        user.value = null; // Treat as no user found
        localStorage.removeItem("user"); // Clear invalid data
      }
    } catch (e) {
      console.error("Failed to parse user data from localStorage:", e);
      user.value = null; // Set user to null if parsing fails
      userFetchError.value = "Failed to process user data.";
      localStorage.removeItem("user"); // Clear invalid data
    } finally {
      isLoadingUser.value = false; // User loading finished
    }
  } else {
    user.value = null; // Ensure user is null if no data exists in localStorage
    isLoadingUser.value = false; // User loading finished immediately
  }

  // --- Fetch Book Details ---
  // Basic validation for bookId
  if (!bookId) {
    bookFetchError.value = "Book ID is missing from the route.";
    isLoadingBook.value = false;
    console.error("Book ID is missing from route params.");
    return; // Stop execution if no ID
  }

  try {
    isLoadingBook.value = true; // Set book loading state
    // Construct the API URL with the book ID
    const phpApiUrl = `${BASEURL}/book.php?id=${bookId}`;
    const res = await fetch(phpApiUrl);

    // Check if the HTTP response status is OK (2xx)
    if (!res.ok) {
      const errorBody = await res.text();
      let errorMessage = `HTTP error fetching book: ${res.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error || errorMessage;
      } catch (e) {
        errorMessage = errorBody || errorMessage;
      }
      throw new Error(errorMessage); // Throw an error to be caught below
    }

    // Parse the JSON response
    const data = await res.json();

    // Check for errors reported within the JSON data structure (e.g., { success: false, error: "..." })
    // Assuming the API returns { success: true, book: {...} } or { success: false, error: "..." }
    if (data.success === false && data.error) {
      throw new Error(`API reported error: ${data.error}`);
    }

    // Check if the book data itself is valid (e.g., not null or empty)
    if (!data || !data.book) {
      bookFetchError.value = "Book not found.";
      book.value = null;
    } else {
      book.value = data.book; // Store fetched book data
      bookFetchError.value = null; // Clear book fetch error
    }
  } catch (error) {
    bookFetchError.value = error.message || "Failed to fetch book details.";
    console.error("Error fetching book:", error);
    book.value = null;
  } finally {
    isLoadingBook.value = false; // Book loading finished
  }
});

// --- Computed Properties ---

// Computed property to format the created_at date
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
      return book.value.created_at; // Return raw date if formatting fails
    }
  }
  return "N/A";
});

// Computed property to handle cover image source (base64 or URL)
const coverSrc = computed(() => {
  if (book.value && book.value.cover) {
    if (book.value.cover.startsWith("data:image")) {
      return book.value.cover;
    }
    return book.value.cover;
  }
  return null;
});

// Computed property to handle author avatar source (base64 or URL)
// This uses the avatar fetched with the book data
const authorAvatarSrc = computed(() => {
  if (book.value && book.value.author_avatar) {
    if (book.value.author_avatar.startsWith("data:image")) {
      return book.value.author_avatar;
    }
    return book.value.author_avatar;
  }
  return null;
});

// Computed property to check if the logged-in user can edit/delete the book
const canEditOrDelete = computed(() => {
  // Check if both user and book data are successfully loaded
  if (!user.value || !book.value) {
    return false; // Cannot edit/delete if user or book data is missing
  }
  // Check if logged-in user's ID matches the book's author ID OR user has admin role
  // Assuming book.value.author stores the author's user ID (INT)
  // Assuming user.value.id stores the logged-in user's ID (INT)
  // Assuming user.value.role stores the logged-in user's role (string 'user' or 'admin')
  return user.value.id === book.value.author || user.value.role === "admin";
});

// --- Actions ---

// Navigate to the edit page
const editBook = () => {
  // Ensure user is authorized and book data is available before navigating
  if (!canEditOrDelete.value || !book.value || !book.value.id) {
    console.warn("User not authorized or book data missing for editing.");
    // Optionally show a message
    // deleteMessage.value = { type: 'error', text: 'You are not authorized to edit this book.' };
    return;
  }
  // Navigate to the write page with the book ID as a query parameter for editing
  router.push(`/write?edit=${book.value.id}`);
};

// Delete the book
const deleteBook = async () => {
  // Prevent deletion if already deleting or user is not authorized or book data missing
  if (
    isDeleting.value ||
    !canEditOrDelete.value ||
    !book.value ||
    !book.value.id
  ) {
    console.warn("User not authorized or book data missing for deletion.");
    // Optionally show a message
    // deleteMessage.value = { type: 'error', text: 'You are not authorized to delete this book.' };
    return;
  }

  // Show confirmation dialog
  const confirmed = confirm(
    `Are you sure you want to delete the book "${book.value.title}"?`
  );
  if (!confirmed) {
    return; // Stop if user cancels
  }

  isDeleting.value = true; // Set loading state
  deleteMessage.value = { type: "", text: "" }; // Clear previous messages

  const bookId = book.value.id;

  try {
    // Send POST request to backend API to delete the book
    // This endpoint needs to perform authorization checks on the server side
    const res = await fetch(`${BASEURL}/delete_book.php?id=${bookId}`, {
      // Assume BASEURL is defined
      method: "POST", // Using POST is common for actions that change data
      // You might need to send user authentication info here (e.g., token in headers)
      // For simplicity, assuming backend verifies user/admin status based on session or token
    });

    const responseText = await res.text();

    if (!res.ok) {
      // Handle non-2xx status codes
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
      // Handle 2xx status codes (Success)
      let successMessage = "Book deleted successfully!";
      try {
        // Attempt to parse JSON if backend sends a success message JSON
        const successJson = JSON.parse(responseText);
        successMessage = successJson.message || successMessage;
      } catch (e) {
        // If not JSON, use the raw text if available
        successMessage = responseText || successMessage;
      }
      deleteMessage.value = { type: "success", text: successMessage };
      console.log("Deletion successful:", responseText);

      // Redirect after successful deletion
      // Redirect to homepage or author's profile page
      router.push("/"); // Example: Redirect to homepage
    }
  } catch (err) {
    // Handle network errors
    deleteMessage.value = {
      type: "error",
      text: "An unexpected error occurred during deletion.",
    };
    console.error("Fetch Error during deletion:", err);
  } finally {
    isDeleting.value = false; // Reset loading state
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
            class="w-fit h-fit text-sm bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-white"
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
          class="w-full h-auto max-w-[300px] object-cover rounded-lg shadow-lg"
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
/* Add any specific scoped styles here */
/* Tailwind @apply styles for Quill content (prose) can go in global CSS */
/* The 'prose' class handles most of the styling for the content itself */
</style>
