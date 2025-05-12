<script setup>
import { QuillEditor } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import "@vueup/vue-quill/dist/vue-quill.bubble.css"; // Assuming you might use bubble theme later
import { ref, onMounted, computed } from "vue"; // Ensure computed is imported
import { useRoute, useRouter } from "vue-router"; // Import useRoute and useRouter

// Assuming BASEURL is defined somewhere accessible
// Assuming ButtonFilled component is imported
// Assuming Progressbar component is imported (for loading existing book data)

// Define Nuxt page metadata (assuming Nuxt 3)
definePageMeta({ middleware: ["auth"] });

// Reactive state for form inputs
const title = ref("");
const content = ref(""); // Content from Quill Editor
const cover = ref(null); // Stores the base64 Data URL for the preview or fetched cover
const coverInput = ref(null); // Template ref for the hidden file input element
const editor = ref(null); // Template ref for the Quill Editor instance
const originalCover = ref(null); // To track the original cover value when editing

// State for user info (fetched from local storage)
const user = ref(null);

// UI State
const isLoading = ref(false); // Loading state for the submit button
const isFetchingBook = ref(true); // Loading state when fetching book data for editing
const fetchBookError = ref(null); // Error state when fetching book data for editing
const message = ref({ type: "", text: "" }); // For displaying success/error/info messages { type: 'success'|'error'|'info', text: '...' }

// Access the route and router instances
const route = useRoute();
const router = useRouter();

// --- Computed Properties ---

// Check if we are in edit mode based on the route query parameter
const isEditing = computed(() => {
  return route.query.edit !== undefined && route.query.edit !== "";
});

// Get the book ID from the route query parameter if in edit mode
const bookIdToEdit = computed(() => {
  return isEditing.value ? route.query.edit : null;
});

// Determine the text for the submit button
const submitButtonText = computed(() => {
  if (isLoading.value) {
    return isEditing.value ? "Updating..." : "Publishing...";
  }
  return isEditing.value ? "Update Book" : "Publish Book";
});

// --- Lifecycle Hook ---
onMounted(async () => {
  // Made onMounted async to await book fetching

  // Load user data from local storage
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser);
      // Basic check if user object has an id
      if (!user.value || typeof user.value.id === "undefined") {
        console.error("User data in localStorage is invalid or missing ID.");
        user.value = null; // Treat as no user found
        localStorage.removeItem("user"); // Clear invalid data
        // useRouter().push("/signin"); // Example redirect if user data is invalid
      }
    } catch (e) {
      console.error("Failed to parse user data from localStorage:", e);
      user.value = null; // Set user to null if parsing fails
      localStorage.removeItem("user"); // Clear invalid data
      // useRouter().push("/signin"); // Example redirect on parse error
    }
  } else {
    console.warn("No user data found in localStorage. User will be null.");
    user.value = null; // Ensure user is null if no data exists
    // Handle case where user is not logged in, e.g., redirect to login
    // useRouter().push("/signin"); // Example redirect
  }

  // --- Fetch book data if in edit mode ---
  if (isEditing.value && bookIdToEdit.value) {
    isFetchingBook.value = true; // Set loading state for fetching book
    fetchBookError.value = null; // Clear previous fetch errors

    try {
      // Fetch the book details using the bookIdToEdit
      // Assume you have a /book.php endpoint that returns book data including cover (base64)
      const res = await fetch(`${BASEURL}/book.php?id=${bookIdToEdit.value}`); // Assume BASEURL is defined

      if (!res.ok) {
        const errorBody = await res.text();
        let errorMessage = `HTTP error fetching book for edit: ${res.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = errorBody || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      // Assuming /book.php returns { success: true, book: {...} } or { success: false, error: "..." }
      if (data.success === false && data.error) {
        throw new Error(`API reported error fetching book: ${data.error}`);
      }

      // Check if book data is valid
      if (!data || !data.book) {
        fetchBookError.value = "Book data not found for editing.";
        // Optionally redirect or show a specific message
      } else {
        // Populate form fields with fetched data
        title.value = data.book.title || "";
        content.value = data.book.content || ""; // Quill will load this HTML
        cover.value = data.book.cover || null; // Load base64 cover for preview
        originalCover.value = data.book.cover || null; // Store original cover
        // Set editor content after it's mounted (using a watcher or nextTick if needed)
        // For now, v-model should handle initial content setting if editor is ready
        fetchBookError.value = null; // Clear error
      }
    } catch (error) {
      fetchBookError.value =
        error.message || "Failed to fetch book details for editing.";
      console.error("Error fetching book for edit:", error);
    } finally {
      isFetchingBook.value = false; // Fetching finished
    }
  } else {
    // Not in edit mode, so no book to fetch
    isFetchingBook.value = false;
  }
});

// --- Methods ---

// Trigger click on the hidden file input
const pickCover = () => {
  if (coverInput.value) {
    coverInput.value.click();
  }
};

// Handle file selection and read as Base64
const handleFile = (event) => {
  const file = event.target.files[0];
  // If no file is selected, reset preview to original (if editing) or null (if publishing)
  if (!file) {
    cover.value = isEditing.value ? originalCover.value : null; // Reset preview
    message.value = { type: "", text: "" }; // Clear previous file errors
    // Also clear the file input element's value
    if (coverInput.value) {
      coverInput.value.value = null;
    }
    return;
  }

  // --- File Validation ---
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]; // Add more types if needed
  const maxSizeMB = 5; // Maximum allowed file size in MB
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    message.value = {
      type: "error",
      text: `Invalid file type. Only ${allowedTypes
        .map((t) => t.split("/")[1].toUpperCase())
        .join(", ")} images are allowed.`,
    };
    event.target.value = ""; // Clear the file input
    cover.value = isEditing.value ? originalCover.value : null; // Reset preview
    return;
  }

  if (file.size > maxSizeBytes) {
    message.value = {
      type: "error",
      text: `File size (${(file.size / 1024 / 1024).toFixed(
        2
      )} MB) exceeds the maximum limit of ${maxSizeMB}MB.`,
    };
    event.target.value = ""; // Clear the file input
    cover.value = isEditing.value ? originalCover.value : null; // Reset preview
    return;
  }
  // --- End File Validation ---

  const reader = new FileReader();
  reader.onload = () => {
    // Store the base64 Data URL in the cover ref for preview and sending
    cover.value = reader.result;
    message.value = { type: "", text: "" }; // Clear previous file errors on successful read
  };
  reader.onerror = () => {
    message.value = { type: "error", text: "Failed to read file." };
    event.target.value = ""; // Clear the file input on error
    cover.value = isEditing.value ? originalCover.value : null; // Reset preview
  };
  reader.readAsDataURL(file); // Read the file as a base64 Data URL
};

// Handle the form submission (Publish or Update)
const submitBook = async () => {
  // Renamed from publish
  // Prevent submission if already loading or user is not available
  if (
    isLoading.value ||
    isFetchingBook.value ||
    !user.value ||
    typeof user.value.id === "undefined"
  ) {
    if (!user.value) {
      message.value = {
        type: "error",
        text: "User not logged in or user data is invalid.",
      };
      // Optionally redirect to login
      // useRouter().push("/signin");
    }
    return;
  }

  // Clear previous messages
  message.value = { type: "", text: "" };

  // Basic validation for title and content
  if (!title.value.trim()) {
    message.value = { type: "error", text: "Title is required." };
    return;
  }
  // Cover is optional for update, but required for publish
  if (!isEditing.value && !cover.value) {
    message.value = {
      type: "error",
      text: "Cover image is required to publish a new book.",
    };
    return;
  }

  // Check if editor content is empty (Quill returns '<p><br></p>' for empty)
  const editorContent = editor.value?.getHTML().trim();
  if (!editorContent || editorContent === "<p><br></p>") {
    message.value = { type: "error", text: "Content is required." };
    return;
  }

  isLoading.value = true; // Set loading state for submission

  const formData = new FormData();
  formData.append("title", title.value.trim()); // Trim whitespace
  formData.append("content", editorContent);
  formData.append("author_id", user.value.id); // Always send author_id (for new or update auth)

  // --- Handle Cover Image for Submission (Publish or Update) ---
  const coverChanged = cover.value !== originalCover.value; // Check if cover was changed
  if (isEditing.value && bookIdToEdit.value) {
    // --- Update Mode ---
    formData.append("book_id", bookIdToEdit.value); // Include book ID for update

    if (coverChanged) {
      if (cover.value && cover.value.startsWith("data:image")) {
        // User selected a new cover (send base64)
        formData.append("cover", cover.value);
      } else if (cover.value === null && originalCover.value !== null) {
        // User removed the cover (changed from a real cover to null)
        formData.append("remove_cover", "true");
      }
      // If coverChanged is true but cover.value is null/empty and original was also null,
      // or cover.value is not base64 and not null, it implies an unexpected state,
      // we don't send cover data or removal flag.
    }
    // If coverChanged is false, we don't append cover data or remove_cover flag,
    // leaving the existing cover in the database unchanged.
  } else {
    // --- Publish Mode ---
    // Cover is required for publish (checked in validation)
    if (cover.value && cover.value.startsWith("data:image")) {
      formData.append("cover", cover.value);
    }
    // If cover.value is not base64 in publish mode, validation should have caught it.
  }

  try {
    // Send the POST request to the backend endpoint
    // Assuming write.php handles both INSERT and UPDATE based on the presence of book_id
    const res = await fetch(BASEURL + "/write.php", {
      method: "POST",
      body: formData,
      // fetch with FormData automatically sets Content-Type: multipart/form-data
      // You might need to send user authentication info here (e.g., token in headers)
      // For simplicity, assuming backend verifies user/admin status based on author_id and potentially session/token
    });

    // Always try to read the response text for potential error messages from backend
    const responseText = await res.text();

    if (!res.ok) {
      // Handle non-2xx status codes
      let errorMessage = isEditing.value ? "Update failed." : "Publish failed.";
      try {
        // Attempt to parse JSON if the backend sends JSON errors
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.error || responseText;
      } catch (e) {
        // If not JSON, use the raw text
        errorMessage = responseText || "Unknown server error.";
      }
      message.value = { type: "error", text: errorMessage };
      console.error(
        isEditing.value ? "Update failed:" : "Publish failed:",
        res.status,
        responseText
      );
    } else {
      // Handle 2xx status codes (backend returned plain text or JSON success)
      let successMessage = isEditing.value
        ? "Book updated successfully!"
        : "Book published successfully!";
      let bookId = null; // To store the book ID for redirection

      try {
        // Attempt to parse JSON if backend sends a success message JSON
        const successJson = JSON.parse(responseText);
        successMessage = successJson.message || successMessage;
        bookId = successJson.book_id; // Assuming backend returns the book_id on success
      } catch (e) {
        // If not JSON, use the raw text if available
        successMessage = responseText || successMessage;
        // If not JSON, we don't have the book_id from the response
      }

      message.value = { type: "success", text: successMessage };
      console.log(
        isEditing.value ? "Update successful:" : "Publish successful:",
        responseText
      );

      // Clear the form on success (only for Publish mode)
      if (!isEditing.value) {
        title.value = "";
        editor.value?.setHTML(""); // Use optional chaining
        cover.value = null; // Clear base64 preview
        originalCover.value = null; // Clear original cover
        if (coverInput.value) {
          coverInput.value.value = null;
        } // Clear the file input element's value
      } else {
        // If in edit mode and successful, update originalCover to the new cover value
        originalCover.value = cover.value;
        // Optionally clear the file input element after a successful update
        if (coverInput.value) {
          coverInput.value.value = null;
        }
      }

      // Redirect after successful publish or update
      // Redirect to the book detail page if bookId is available
      if (bookId) {
        router.push(`/book/${bookId}`);
      } else if (isEditing.value && bookIdToEdit.value) {
        // If updated, redirect back to the book detail page using the original ID
        router.push(`/book/${bookIdToEdit.value}`);
      } else {
        // Fallback redirect (e.g., to homepage or author's books list)
        router.push("/");
      }
    }
  } catch (err) {
    // Handle network errors or issues before the fetch completes
    message.value = {
      type: "error",
      text: `An unexpected error occurred during ${
        isEditing.value ? "update" : "publishing"
      }.`,
    };
    console.error("Fetch Error:", err);
  } finally {
    isLoading.value = false; // Reset loading state
  }
};

// --- Watcher for editor ref ---
// Need to watch the editor ref to access the Quill instance once it's mounted
// This is useful if you need to programmatically set content after fetching for editing
watch(editor, (newEditor) => {
  if (newEditor && isEditing.value && bookIdToEdit.value && content.value) {
    // If in edit mode and content is already loaded, set it in the editor
    // Use nextTick to ensure DOM is updated after v-model might have tried
    // nextTick(() => {
    // newEditor.setHTML(content.value); // v-model should handle this usually
    // });
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div
      v-if="isFetchingBook"
      class="flex items-center justify-center min-h-[calc(100vh-100px)]"
    >
      <Progressbar />
    </div>

    <div
      v-else-if="fetchBookError"
      class="min-h-[calc(100vh-100px)] flex flex-col gap-4 items-center justify-center text-red-600 dark:text-red-400"
    >
      <p class="text-2xl font-bold">Error Loading Book for Editing</p>
      <p
        class="rounded p-3 bg-red-100 border border-red-400 dark:bg-red-900 dark:border-red-700 font-mono text-sm"
      >
        Error: {{ fetchBookError }}
      </p>
      <ButtonFilled @click="router.go(0)">Retry</ButtonFilled>
    </div>

    <div v-else>
      <div
        v-if="message.text"
        :class="{
          'text-green-600': message.type === 'success',
          'text-red-600': message.type === 'error',
          'text-blue-600': message.type === 'info' /* Added info color */,
          'mb-4 p-3 rounded': true,
          'bg-green-100 border border-green-400': message.type === 'success',
          'bg-red-100 border border-red-400': message.type === 'error',
          'bg-blue-100 border border-blue-400':
            message.type === 'info' /* Added info background/border */,
        }"
      >
        {{ message.text }}
      </div>

      <h2 class="text-3xl font-bold mb-6">
        {{ isEditing ? "Edit Book" : "Write a New Book" }}
      </h2>

      <form @submit.prevent="submitBook" class="flex flex-col gap-6">
        <div>
          <label
            class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Cover Image {{ !isEditing ? "*" : "" }}</label
          >
          <div class="flex items-center gap-4">
            <img
              v-if="cover"
              :src="cover"
              alt="Cover Preview"
              class="w-32 h-48 object-cover rounded shadow"
            />
            <div
              v-else
              class="w-32 h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded text-gray-500 dark:text-gray-400 shadow"
            >
              No Cover
            </div>

            <ButtonFilled
              @click="pickCover()"
              type="button"
              :disabled="isLoading"
            >
              {{ cover ? "Change Cover" : "Upload Cover" }}
            </ButtonFilled>

            <ButtonFilled
              v-if="isEditing && cover && cover !== null"
              v-show="false"
              @click="
                cover = null;
                message = {
                  type: 'info',
                  text: 'Cover will be removed on save.',
                };
              "
              type="button"
              class="bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-white dark:text-white"
              :disabled="isLoading"
            >
              Remove cover
            </ButtonFilled>

            <input
              ref="coverInput"
              type="file"
              @change="handleFile"
              id="coverInput"
              name="cover"
              accept="image/*"
              class="hidden"
            />
          </div>
        </div>

        <div>
          <label
            for="title"
            class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Title *</label
          >
          <input
            type="text"
            id="title"
            v-model="title"
            placeholder="Enter book title"
            required
            class="textfeild w-full"
            :disabled="isLoading"
          />
        </div>

        <div>
          <label
            for="editor"
            class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Content *</label
          >
          <ClientOnly>
            <QuillEditor
              ref="editor"
              theme="snow"
              v-model:content="content"
              contentType="html"
              toolbar="minimal"
              placeholder="Write your book content here..."
              :disabled="isLoading"
              style="height: 300px"
            />
          </ClientOnly>
        </div>

        <div>
          <ButtonFilled type="submit" class="w-full" :disabled="isLoading">
            {{ submitButtonText }}
          </ButtonFilled>
        </div>
      </form>
    </div>
  </div>
</template>
<style scoped>
/* Assuming .textfeild is defined elsewhere or in this style block */
.textfeild {
  @apply max-w-full text-sm bg-transparent px-4 py-2 rounded outline-none border;
  @apply border-gray-300 dark:border-gray-600;
  @apply focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400;
  @apply text-gray-800 dark:text-gray-200;
}

/* Styles for Quill Editor - These should ideally be in a global stylesheet */
/* or use :deep() if keeping them scoped */

/* Example using scoped styles with :deep() */
:deep(.ql-toolbar) {
  @apply rounded-t border;
  /* Add your theme colors here using @apply from global stylesheet */
  /* Example: @apply border-colorBorder-light dark:border-colorBorder-dark bg-colorSurface-light dark:bg-colorSurface-dark text-colorText-light dark:text-colorText-dark; */
}

:deep(.ql-container) {
  @apply rounded-b border;
  /* Add your theme colors here using @apply from global stylesheet */
  /* Example: @apply border-colorBorder-light dark:border-colorBorder-dark; */
}

:deep(.ql-editor) {
  min-height: 200px; /* Ensure minimum height */
  /* Add your theme colors here using @apply from global stylesheet */
  /* Example: @apply text-colorText-light dark:text-colorText-dark bg-colorBackground-light dark:bg-colorBackground-dark; */
}

/* Example for placeholder text color */
:deep(.ql-editor.ql-blank::before) {
  /* Light mode placeholder color */
  color: rgba(0, 0, 0, 0.6); /* Default Quill placeholder color */
  @apply dark:text-gray-400; /* Example dark mode placeholder color */
  font-style: normal !important; /* Override Quill's italic placeholder */
}

/* Example for blockquotes */
:deep(.ql-editor blockquote) {
  border-left: 4px solid;
  @apply border-gray-300 dark:border-gray-600 italic;
  @apply text-gray-600 dark:text-gray-400;
}

/* Example for code blocks */
:deep(.ql-editor .ql-code-block) {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-2 rounded font-mono;
}

/* Add :deep() overrides for other Quill elements (lists, headers, etc.) as needed */
</style>
