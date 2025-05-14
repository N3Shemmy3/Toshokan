<script setup>
import { ref, onMounted, computed, watch } from "vue"; // Import necessary Vue functions
import { useRouter } from "vue-router"; // Import useRouter for navigation

// Assuming BASEURL is defined somewhere accessible (e.g., in a config file or environment variable)
// Assuming Progressbar component is imported
// Assuming ButtonFilled component is imported
// Assuming IconButton component is imported (already used in template)

// Define Nuxt page metadata (assuming Nuxt 3 and auth middleware)
// This middleware should check if the user is logged in before allowing access
definePageMeta({ middleware: ["auth"] });

// Reactive state for user data and form inputs
const user = ref(null); // Stores the currently displayed user object (from server or localStorage)
const name = ref(""); // Reactive state for the name input
const email = ref(""); // Reactive state for the email input
const avatarFile = ref(null); // Stores the selected File object for the new avatar
const avatarPreview = ref(null); // Stores the base64 Data URL for the avatar preview (selected file or fetched avatar)
const originalAvatar = ref(null); // Stores the original avatar Data URL fetched from the server or loaded from localStorage

// State for user fetching
const isFetchingUser = ref(true); // Loading state when initially fetching user data
const userFetchError = ref(null); // Error state related to fetching user data from the server

// UI State for profile update
const isLoading = ref(false); // Loading state for the update profile button
const updateMessage = ref({ type: "", text: "" }); // For displaying update feedback messages { type: 'success'|'error'|'info', text: '...' }

// Template ref for the hidden file input element
const avatarInput = ref(null);

// Access the router instance
const router = useRouter();

// --- Computed Properties ---

// Determine the text for the update button
const updateButtonText = computed(() => {
  return isLoading.value ? "Updating..." : "Update Profile";
});

// --- Lifecycle Hook ---
// Fetch the logged-in user's details when the component is mounted
onMounted(async () => {
  // Get user data from local storage
  const storedUser = localStorage.getItem("user");
  let localUserData = null; // Variable to hold parsed data from localStorage

  if (storedUser) {
    try {
      localUserData = JSON.parse(storedUser);
      // Basic check if local data is valid and has an ID
      if (!localUserData || typeof localUserData.id === "undefined") {
        console.warn("Invalid user data found in localStorage.");
        localUserData = null; // Treat as invalid
        localStorage.removeItem("user"); // Clear invalid data
      }
    } catch (e) {
      console.error("Failed to parse user data from localStorage:", e);
      localUserData = null; // Treat as invalid
      localStorage.removeItem("user"); // Clear invalid data
    }
  }

  // If valid user data was found in localStorage, display it initially
  if (localUserData) {
    user.value = localUserData;
    // Populate form fields with potentially stale local data
    name.value = user.value.name || "";
    email.value = user.value.email || "";
    avatarPreview.value = user.value.avatar || null; // Set initial preview from local data
    originalAvatar.value = user.value.avatar || null; // Store original from local data
    isFetchingUser.value = true; // Still set fetching to true as we will try to get fresh data
  } else {
    // If no valid data in localStorage, fetching is required
    isFetchingUser.value = true;
  }

  // --- Attempt to Fetch Latest User Details from Server ---
  // Only attempt to fetch if we have a user ID (either from valid local data or if auth middleware provides one)
  // Assuming auth middleware ensures user.value has an ID if logged in, or redirects otherwise.
  // Or, if we got a valid ID from localStorage:
  const userIdToFetch = localUserData
    ? localUserData.id
    : user.value
    ? user.value.id
    : null;

  if (userIdToFetch !== null) {
    try {
      // Fetch user details from the dedicated endpoint using the ID
      // Assume get_user_details.php returns { success: true, user: {...} }
      const res = await fetch(
        `${BASEURL}/get_user_details.php?id=${userIdToFetch}`
      ); // Assume BASEURL is defined

      if (!res.ok) {
        const errorBody = await res.text();
        let errorMessage = `HTTP error fetching latest profile data: ${res.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = errorBody || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      // Assuming get_user_details.php returns { success: true, user: {...} }
      if (data.success && data.user) {
        user.value = data.user; // Update user ref with fresh server data
        // Update form fields and previews with fresh data
        name.value = user.value.name || "";
        email.value = user.value.email || "";
        avatarPreview.value = user.value.avatar || null;
        originalAvatar.value = user.value.avatar || null;
        localStorage.setItem("user", JSON.stringify(user.value)); // Update localStorage with fresh data
        userFetchError.value = null; // Clear fetch error
      } else {
        // API reported an error (e.g., user not found on server)
        userFetchError.value =
          data.error || "Failed to get latest user data from server.";
        console.error("Fetch User API reported error:", data);
        // If the server says user is not found, clear local data and user ref
        if (
          data.error &&
          (data.error.includes("User not found") ||
            data.error.includes("Invalid user ID"))
        ) {
          user.value = null;
          localStorage.removeItem("user");
          // Optionally redirect to login if user is no longer valid on server
          // router.push("/signin");
        }
        // Otherwise, keep the local data (if it existed) and just show the fetch error
      }
    } catch (error) {
      // Handle network errors or issues during fetch
      userFetchError.value =
        error.message || "Failed to fetch latest user details.";
      console.error("Error fetching user:", error);
      // If fetch fails, keep the local data (if it existed) and just show the fetch error
    } finally {
      isFetchingUser.value = false; // Fetching finished
    }
  } else {
    // No user ID available to fetch
    isFetchingUser.value = false;
    if (!user.value) {
      // If user is still null (no valid local data either)
      userFetchError.value = "User not logged in. Please log in.";
      // router.push("/signin"); // Redirect to login
    }
  }
});

// --- Methods ---

// Trigger click on the hidden file input
const pickAvatar = () => {
  if (avatarInput.value) {
    avatarInput.value.click();
  }
};

// Handle file selection and read as Base64
const handleFile = (event) => {
  const file = event.target.files[0];
  // If no file is selected, revert preview to original avatar
  if (!file) {
    avatarFile.value = null; // Clear the selected file
    avatarPreview.value = originalAvatar.value; // Revert preview to original fetched/local avatar
    updateMessage.value = { type: "", text: "" }; // Clear previous file errors
    // Also clear the file input element's value
    if (avatarInput.value) {
      avatarInput.value.value = null;
    }
    return;
  }

  // --- File Validation ---
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]; // Add more types if needed
  const maxSizeMB = 2; // Maximum allowed file size in MB (avatars are usually smaller)
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    updateMessage.value = {
      type: "error",
      text: `Invalid file type. Only ${allowedTypes
        .map((t) => t.split("/")[1].toUpperCase())
        .join(", ")} images are allowed.`,
    };
    event.target.value = ""; // Clear the file input
    avatarFile.value = null; // Clear selected file
    avatarPreview.value = originalAvatar.value; // Revert preview on error
    return;
  }

  if (file.size > maxSizeBytes) {
    updateMessage.value = {
      type: "error",
      text: `File size (${(file.size / 1024 / 1024).toFixed(
        2
      )} MB) exceeds the maximum limit of ${maxSizeMB}MB.`,
    };
    event.target.value = ""; // Clear the file input
    avatarFile.value = null; // Clear selected file
    avatarPreview.value = originalAvatar.value; // Revert preview on error
    return;
  }
  // --- End File Validation ---

  avatarFile.value = file; // Store the selected file object

  const reader = new FileReader();
  reader.onload = () => {
    // Store the base64 Data URL in avatarPreview ref
    avatarPreview.value = reader.result;
    updateMessage.value = { type: "", text: "" }; // Clear previous file errors on successful read
  };
  reader.onerror = () => {
    updateMessage.value = { type: "error", text: "Failed to read file." };
    event.target.value = ""; // Clear the file input on error
    avatarFile.value = null; // Clear selected file
    avatarPreview.value = originalAvatar.value; // Revert preview on error
  };
  reader.readAsDataURL(file); // Read the file as a base64 Data URL
};

// Remove the current avatar
const removeAvatar = () => {
  avatarFile.value = null; // Clear any pending file selection
  avatarPreview.value = null; // Clear the preview
  // The updateProfile function will handle sending the remove_avatar flag
  updateMessage.value = {
    type: "info",
    text: "Avatar will be removed on save.",
  };
  // Also clear the file input element's value
  if (avatarInput.value) {
    avatarInput.value.value = null;
  }
};

// Handle the profile update action
const updateProfile = async () => {
  // Prevent submission if already loading, fetching user data, or user is not available
  if (
    isLoading.value ||
    isFetchingUser.value ||
    !user.value ||
    typeof user.value.id === "undefined"
  ) {
    if (isFetchingUser.value) {
      updateMessage.value = {
        type: "info",
        text: "Please wait while user data is loading.",
      };
    } else if (!user.value) {
      updateMessage.value = {
        type: "error",
        text: "User not logged in or user data is invalid.",
      };
      // Optionally redirect to login
      // router.push("/signin");
    }
    return;
  }

  // Clear previous update messages
  updateMessage.value = { type: "", text: "" };

  // Basic validation for name and email
  if (!name.value.trim()) {
    updateMessage.value = { type: "error", text: "Name is required." };
    return;
  }
  if (!email.value.trim()) {
    updateMessage.value = { type: "error", text: "Email is required." };
    return;
  }
  // Optional: Add more email format validation here

  isLoading.value = true; // Set loading state for submission

  const formData = new FormData();
  formData.append("user_id", user.value.id); // Send user ID (CRITICAL: Verify on backend)
  formData.append("name", name.value.trim()); // Trim whitespace
  formData.append("email", email.value.trim()); // Trim whitespace

  // --- Handle Avatar for Submission ---
  // Determine if the avatar has changed from the original fetched/local value
  const avatarChanged = avatarPreview.value !== originalAvatar.value;

  if (avatarChanged) {
    if (avatarPreview.value && avatarPreview.value.startsWith("data:image")) {
      // User selected a new avatar or kept a valid existing one after interaction
      // Send the current avatarPreview value (base64)
      formData.append("avatar", avatarPreview.value);
    } else if (avatarPreview.value === null && originalAvatar.value !== null) {
      // User removed the avatar (changed from a real avatar to null)
      formData.append("remove_avatar", "true");
    }
    // If avatarChanged is true but avatarPreview is null/empty and original was also null,
    // or avatarPreview is not base64 and not null, it implies an unexpected state,
    // we don't send avatar data or removal flag.
  }
  // If avatarChanged is false, we don't append avatar data or remove_avatar flag,
  // leaving the existing avatar in the database unchanged.

  try {
    // Send the POST request to the backend update profile endpoint
    const res = await fetch(BASEURL + "/update_profile.php", {
      // Assume BASEURL is defined
      method: "POST",
      body: formData,
      // fetch with FormData automatically sets Content-Type: multipart/form-data
      // CRITICAL: Backend MUST verify user identity based on session/token, not just user_id from formData.
    });

    // Always try to read the response text for potential error messages from backend
    const responseText = await res.text();

    if (!res.ok) {
      // Handle non-2xx status codes
      let errorMessage = "Profile update failed.";
      try {
        // Attempt to parse JSON if the backend sends JSON errors
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.error || responseText;
      } catch (e) {
        // If not JSON, use the raw text
        errorMessage = responseText || "Unknown server error.";
      }
      updateMessage.value = { type: "error", text: errorMessage };
      console.error("Profile update failed:", res.status, responseText);
    } else {
      // Handle 2xx status codes (backend returned JSON success)
      let successMessage = "Profile updated successfully!";
      let updatedUserData = null;

      try {
        // Attempt to parse JSON if backend sends a success message JSON
        const successJson = JSON.parse(responseText);
        successMessage = successJson.message || successMessage;
        updatedUserData = successJson.user; // Assuming backend returns the updated user object
      } catch (e) {
        // If not JSON, use the raw text if available, but we won't have updated user data
        successMessage = responseText || successMessage;
      }

      updateMessage.value = { type: "success", text: successMessage };
      console.log("Profile update successful:", responseText);

      // If updated user data is returned, update the user ref and local storage
      if (updatedUserData) {
        user.value = updatedUserData; // Update the user ref
        name.value = user.value.name || ""; // Update form fields from new user data
        email.value = user.value.email || "";
        avatarPreview.value = user.value.avatar || null; // Update preview from new avatar
        originalAvatar.value = user.value.avatar || null; // Update original avatar
        localStorage.setItem("user", JSON.stringify(user.value)); // Update localStorage
      }
      // Clear the file input element's value after a successful update
      if (avatarInput.value) {
        avatarInput.value.value = null;
      }
      avatarFile.value = null; // Clear the selected file object
    }
  } catch (err) {
    // Handle network errors or issues before the fetch completes
    updateMessage.value = {
      type: "error",
      text: "An unexpected error occurred during profile update.",
    };
    console.error("Fetch Error during profile update:", err);
  } finally {
    isLoading.value = false; // Reset loading state
  }
};

// Watch the user ref to populate form fields when user data is fetched
// This is an alternative/addition to populating in onMounted, ensures fields update
// if user data changes *after* initial mount (e.g., if fetch completes later)
watch(
  user,
  (newUser) => {
    if (newUser) {
      name.value = newUser.name || "";
      email.value = newUser.email || "";
      avatarPreview.value = newUser.avatar || null;
      originalAvatar.value = newUser.avatar || null;
    } else {
      // Clear fields if user becomes null
      name.value = "";
      email.value = "";
      avatarPreview.value = null;
      originalAvatar.value = null;
    }
  },
  { immediate: true }
); // Run immediately on component mount
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div
      v-if="isFetchingUser"
      class="flex items-center justify-center min-h-[calc(100vh-200px)]"
    >
      <Progressbar />
    </div>

    <div
      v-else-if="userFetchError"
      class="min-h-[calc(100vh-200px)] flex flex-col gap-4 items-center justify-center text-red-600 dark:text-red-400"
    >
      <p class="text-2xl font-bold">Error Loading Profile</p>
      <p
        class="rounded p-3 bg-red-100 border border-red-400 dark:bg-red-900 dark:border-red-700 font-mono text-sm"
      >
        Error: {{ userFetchError }}
      </p>
      <ButtonFilled @click="$router.go(0)">Retry</ButtonFilled>
    </div>

    <div v-else-if="user" class="max-w-md mx-auto">
      <div
        v-if="updateMessage.text"
        :class="{
          'text-green-600': updateMessage.type === 'success',
          'text-red-600': updateMessage.type === 'error',
          'text-blue-600': updateMessage.type === 'info',
          'mb-4 p-3 rounded': true,
          'bg-green-100 border border-green-400':
            updateMessage.type === 'success',
          'bg-red-100 border border-red-400': updateMessage.type === 'error',
          'bg-blue-100 border border-blue-400': updateMessage.type === 'info',
        }"
      >
        {{ updateMessage.text }}
      </div>

      <form @submit.prevent="updateProfile" class="flex flex-col gap-6">
        <div>
          <h4 v-if="!pending" class="text-2xl md:text-6xl mt-4 mb-16">
            My profile
          </h4>
          <div class="flex items-center gap-4">
            <img
              v-if="avatarPreview"
              :src="avatarPreview"
              alt="Avatar Preview"
              class="size-40 rounded-full object-cover border border-gray-300 dark:border-gray-600 shadow"
            />
            <div
              v-else
              class="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-4xl font-semibold"
            >
              {{ user.name ? user.name[0].toUpperCase() : "?" }}
            </div>

            <div class="flex flex-col gap-2">
              <ButtonFilled
                @click="pickAvatar()"
                type="button"
                :disabled="isLoading"
              >
                {{ avatarPreview ? "Change Avatar" : "Upload Avatar" }}
              </ButtonFilled>

              <ButtonFilled
                v-if="avatarPreview"
                @click="removeAvatar()"
                type="button"
                class="bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-white dark:text-white text-sm"
                :disabled="isLoading"
              >
                Remove Avatar
              </ButtonFilled>
            </div>

            <input
              ref="avatarInput"
              type="file"
              @change="handleFile"
              id="avatarInput"
              name="avatar"
              accept="image/*"
              class="hidden"
            />
          </div>
        </div>

        <div>
          <label
            for="name"
            class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Name *</label
          >
          <input
            type="text"
            id="name"
            v-model="name"
            placeholder="Enter your name"
            required
            class="textfeild w-full"
            :disabled="isLoading"
          />
        </div>

        <div>
          <label
            for="email"
            class="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2"
            >Email *</label
          >
          <input
            type="email"
            id="email"
            v-model="email"
            placeholder="Enter your email"
            required
            class="textfeild w-full"
            :disabled="isLoading"
          />
        </div>

        <div>
          <ButtonFilled type="submit" class="w-full" :disabled="isLoading">
            <p class="text-center">{{ updateButtonText }}</p>
          </ButtonFilled>
        </div>
      </form>
    </div>

    <div
      v-else
      class="min-h-[calc(100vh-200px)] flex items-center justify-center text-gray-600 dark:text-gray-400"
    >
      <p class="text-xl">User data could not be loaded.</p>
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

/* Add any other specific scoped styles here */
</style>
