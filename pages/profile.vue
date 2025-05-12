<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router"; // Ensure useRoute is imported
// Assume BASEURL is defined somewhere accessible
// Assume ButtonFilled component is imported
// Assume Progressbar component is imported (for initial loading)
// Assume Icon component is imported (for header icons)

// Reactive state for user data and form inputs
const user = ref(null); // Stores the user object from local storage
const name = ref(""); // Bound to the name input
const email = ref(""); // Bound to the email input
const avatar = ref("/avataaars.svg"); // Stores the base64 Data URL or default path for preview
const avatarInput = ref(null); // Template ref for the hidden file input element
const originalAvatar = ref(null); // To track the original avatar value for change detection

// UI State
const isLoading = ref(true); // Initial loading state while fetching from local storage
const isEditing = ref(false); // State to toggle between view and edit mode
const isUpdating = ref(false); // Loading state for the update button
const message = ref({ type: "", text: "" }); // For displaying success/error/info messages { type: 'success'|'error'|'info', text: '...' }

// Access the router and route instances using composition API
const router = useRouter();
const route = useRoute(); // Get the reactive route object

// --- Validation Helper ---
// Basic email validation regex
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// --- File Handling ---
// Trigger click on the hidden file input element using its template ref
const pickAvatar = () => {
  if (avatarInput.value) {
    avatarInput.value.click();
  }
};

// Handle file selection and read as Base64 Data URL
const handleFile = (event) => {
  const file = event.target.files[0];
  // If no file is selected, reset preview to original or default
  if (!file) {
    avatar.value = originalAvatar.value || "/avataaars.svg"; // Reset preview to original or default
    message.value = { type: "", text: "" }; // Clear previous file errors
    // Also clear the file input element's value
    if (avatarInput.value) {
      avatarInput.value.value = null;
    }
    return;
  }

  // --- File Validation ---
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]; // Allowed image types
  const maxSizeMB = 2; // Maximum allowed file size in MB
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    message.value = {
      type: "error",
      text: `Invalid file type. Only ${allowedTypes
        .map((t) => t.split("/")[1].toUpperCase())
        .join(", ")} images are allowed.`,
    };
    event.target.value = ""; // Clear the file input element's value
    avatar.value = originalAvatar.value || "/avataaars.svg"; // Reset preview
    return;
  }

  // Check file size
  if (file.size > maxSizeBytes) {
    message.value = {
      type: "error",
      text: `File size (${(file.size / 1024 / 1024).toFixed(
        2
      )} MB) exceeds the maximum limit of ${maxSizeMB}MB.`,
    };
    event.target.value = ""; // Clear the file input element's value
    avatar.value = originalAvatar.value || "/avataaars.svg"; // Reset preview
    return;
  }
  // --- End File Validation ---

  // Read the file as a Data URL (Base64)
  const reader = new FileReader();
  reader.onload = () => {
    // Store the base64 Data URL in the avatar ref for preview and sending
    avatar.value = reader.result;
    message.value = { type: "", text: "" }; // Clear previous file errors on successful read
  };
  reader.onerror = () => {
    // Handle errors during file reading
    message.value = { type: "error", text: "Failed to read file." };
    event.target.value = ""; // Clear the file input element's value on error
    avatar.value = originalAvatar.value || "/avataaars.svg"; // Reset preview
  };
  reader.readAsDataURL(file); // Start reading the file
};

// --- Profile Actions ---

// Toggle between view and edit mode
const toggleEditing = () => {
  isEditing.value = !isEditing.value;
  // If entering edit mode, populate form fields with current user data
  if (isEditing.value && user.value) {
    name.value = user.value.name || "";
    email.value = user.value.email || "";
    // avatar.value is already bound to the preview and updated by handleFile
    // originalAvatar is set in resetForm
  } else {
    // If exiting edit mode (via Cancel or after Save), reset form fields to current user data
    resetForm();
    message.value = { type: "", text: "" }; // Clear messages on cancel
  }
};

// Reset form fields and avatar preview to current user data
const resetForm = () => {
  if (user.value) {
    name.value = user.value.name || "";
    email.value = user.value.email || "";
    avatar.value = user.value.avatar || "/avataaars.svg"; // Set preview to current avatar or default
    originalAvatar.value = user.value.avatar || "/avataaars.svg"; // Store the current avatar as original
    // Clear the file input element's value so selecting the same file works again
    if (avatarInput.value) {
      avatarInput.value.value = null;
    }
  }
};

// Submit updated profile information
const updateProfile = async () => {
  // Prevent submission if already updating
  if (isUpdating.value) return;

  // Clear previous messages
  message.value = { type: "", text: "" };

  // --- Frontend Form Validation ---
  if (!name.value.trim()) {
    message.value = { type: "error", text: "Name cannot be empty." };
    return; // Stop submission if validation fails
  }
  if (!email.value.trim() || !isValidEmail(email.value.trim())) {
    // Validate trimmed email
    message.value = {
      type: "error",
      text: "Please enter a valid email address.",
    };
    return; // Stop submission if validation fails
  }
  // Add password change validation here if you add password update functionality
  // if (password.value.length < 8) {
  //    message.value = { type: "error", text: "Password must be at least 8 characters long." };
  //    return;
  // }
  // --- End Frontend Form Validation ---

  // Check if any changes were made
  const nameChanged = name.value.trim() !== (user.value?.name || "");
  const emailChanged = email.value.trim() !== (user.value?.email || "");
  const avatarChanged = avatar.value !== originalAvatar.value;

  if (!nameChanged && !emailChanged && !avatarChanged) {
    message.value = { type: "info", text: "No changes to save." };
    isEditing.value = false; // Exit editing if nothing changed
    return;
  }

  isUpdating.value = true; // Set loading state to true

  // Prepare form data for the POST request
  const formData = new FormData();
  // CRITICAL: Send the user ID so the backend knows which user to update.
  // In a real app, this ID should ideally be verified against the authenticated user's session/token on the backend.
  if (user.value?.id) {
    formData.append("user_id", user.value.id);
  } else {
    message.value = {
      type: "error",
      text: "User ID is missing. Cannot update.",
    };
    isUpdating.value = false;
    console.error("User ID missing from user object.");
    return; // Stop if user ID is not available
  }

  // Append name and email (always send these as they are required fields)
  formData.append("name", name.value.trim());
  formData.append("email", email.value.trim());

  // Handle avatar update/removal based on whether it changed
  if (avatarChanged) {
    if (avatar.value && avatar.value.startsWith("data:image")) {
      // User selected a new avatar (send base64)
      formData.append("avatar", avatar.value);
    } else if (
      avatar.value === "/avataaars.svg" &&
      originalAvatar.value !== "/avataaars.svg"
    ) {
      // User changed from a real avatar to the default (request removal)
      formData.append("remove_avatar", "true");
    }
    // If avatarChanged is true but avatar.value is null/empty and not the default,
    // it implies an unexpected state, we don't send avatar data or removal flag.
  }

  try {
    // Send the POST request to the profile update API endpoint
    const response = await fetch(BASEURL + "/profile.php", {
      // Assume BASEURL is defined
      method: "POST",
      body: formData,
      // fetch with FormData automatically sets Content-Type: multipart/form-data
    });

    // Attempt to parse the response body as JSON
    // The backend should ideally always return JSON for success and error responses
    const result = await response.json();

    // Check if the HTTP response status is NOT OK (e.g., 400, 500)
    if (!response.ok) {
      // Handle non-2xx status codes
      const errorText =
        result.error || response.statusText || "Unknown server error";
      message.value = { type: "error", text: `Update failed: ${errorText}` };
      console.error("Profile API Error:", response.status, result); // Log the full error response
    } else {
      // Handle 2xx status codes (Success)
      const successMessage = result.message || "Profile updated successfully!";
      message.value = { type: "success", text: successMessage };
      console.log("Profile updated successfully:", result); // Log the full success response

      // Update user data in local storage and the user ref with the updated user object from backend
      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
        user.value = result.user; // Update the reactive user ref
        originalAvatar.value = user.value.avatar || "/avataaars.svg"; // Update original avatar reference
        isEditing.value = false; // Exit editing mode on success
      } else {
        console.warn(
          "Profile updated successfully, but no updated user data returned."
        );
        // Decide how to handle this case - maybe stay in edit mode or fetch user data again
        isEditing.value = false; // Exit editing mode anyway
      }
    }
  } catch (error) {
    // Handle network errors or issues with JSON parsing if response.json() failed
    message.value = {
      type: "error",
      text: "An unexpected error occurred during profile update. Please try again.",
    };
    console.error("Fetch Error during profile update:", error);
  } finally {
    // Always reset loading state after the fetch attempt is complete
    isUpdating.value = false;
  }
};

// --- Lifecycle Hook ---
// Load user data from local storage when the component is mounted
onMounted(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser);
      // Check if parsed user object is valid and has an ID
      if (user.value && typeof user.value.id !== "undefined") {
        // If user data exists and is valid, populate form fields and avatar preview
        resetForm(); // Populate and set original avatar
        isLoading.value = false; // Data loaded, hide initial loading
      } else {
        console.error("Invalid user data found in localStorage.");
        user.value = null; // Treat as no user found
        isLoading.value = false;
        localStorage.removeItem("user"); // Clear invalid data
        // router.push("/signin"); // Redirect to signin if data is invalid
      }
    } catch (e) {
      console.error("Failed to parse user data from localStorage:", e);
      user.value = null; // Set user to null if parsing fails
      isLoading.value = false; // Loading finished (with error)
      localStorage.removeItem("user"); // Clear invalid data
      // router.push("/signin"); // Redirect to signin on parse error
    }
  } else {
    user.value = null; // Ensure user is null if no data exists
    isLoading.value = false; // Loading finished (no user found)
    // Redirect to signin if no user data is found (user not logged in)
    // router.push("/signin"); // Redirect if no user found
  }
});

// Computed property to determine the avatar source based on editing state
const currentAvatarSrc = computed(() => {
  // Use the avatar ref (which holds the base64 preview or default)
  return avatar.value;
});

// --- Redirect if no user is found after loading ---
// Watch the user ref and redirect if it becomes null after initial loading
watch(
  user,
  (newUser, oldUser) => {
    // Only redirect if user becomes null *after* the initial load is complete
    if (oldUser !== undefined && newUser === null && !isLoading.value) {
      console.log("User became null, redirecting to signin.");
      router.push("/signin");
    }
  },
  { immediate: false }
); // Don't run immediately on component mount
</script>

<template>
  <div class="flex flex-col gap-8 md:max-w-[400px] mx-auto py-8">
    <div
      v-if="isLoading"
      class="flex items-center justify-center min-h-[calc(100vh-100px)]"
    >
      <Progressbar />
    </div>

    <div
      v-else-if="!user"
      class="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-100px)] text-gray-600 dark:text-gray-400"
    >
      <p class="text-xl">You need to be signed in to view your profile.</p>
      <ButtonFilled @click="router.push('/signin')">Go to Sign In</ButtonFilled>
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

      <div>
        <h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">
          Your Profile
        </h3>
        <p
          class="leading-7 [&:not(:first-child)]:mt-2 text-gray-600 dark:text-gray-400"
        >
          View and update your profile information.
        </p>
      </div>

      <form @submit.prevent="updateProfile" class="flex flex-col gap-8">
        <div>
          <p
            class="leading-7 [&:not(:first-child)]:mt-6 text-gray-700 dark:text-gray-300"
          >
            Profile picture
          </p>
          <div class="flex items-center gap-4 mt-2">
            <img
              :src="currentAvatarSrc"
              alt="Avatar Preview"
              class="size-32 md:size-40 rounded-full object-cover border border-gray-300 dark:border-gray-600"
            />
            <ButtonFilled
              v-if="isEditing"
              class="w-fit h-fit"
              @click="pickAvatar()"
              type="button"
              :disabled="isUpdating"
            >
              Change picture
            </ButtonFilled>
            <input
              ref="avatarInput"
              type="file"
              @change="handleFile"
              id="avatarInput"
              name="avatar"
              accept="image/*"
              class="hidden"
            />
            <ButtonFilled
              v-if="
                isEditing && user?.avatar && user.avatar !== '/avataaars.svg'
              "
              @click="
                avatar = '/avataaars.svg';
                message = {
                  type: 'info',
                  text: 'Avatar will be removed on save.',
                };
              "
              type="button"
              class="bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-white"
              :disabled="isUpdating"
            >
              Remove picture
            </ButtonFilled>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label
            for="name"
            class="leading-7 [&:not(:first-child)]:mt-6 text-gray-700 dark:text-gray-300"
            >Your name</label
          >
          <p v-if="!isEditing" class="textfeild-view">{{ user.name }}</p>
          <input
            v-else
            type="text"
            id="name"
            name="name"
            v-model="name"
            placeholder="Full Name"
            required
            class="textfeild"
            :disabled="isUpdating"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label
            for="email"
            class="leading-7 [&:not(:first-child)]:mt-6 text-gray-700 dark:text-gray-300"
            >Your email</label
          >
          <p v-if="!isEditing" class="textfeild-view">{{ user.email }}</p>
          <input
            v-else
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            required
            v-model="email"
            class="textfeild"
            :disabled="isUpdating"
          />
        </div>

        <div class="flex flex-col gap-4 mt-4">
          <ButtonFilled
            v-if="!isEditing"
            @click="toggleEditing()"
            type="button"
          >
            Edit Profile
          </ButtonFilled>

          <template v-else>
            <ButtonFilled type="submit" :disabled="isUpdating">
              {{ isUpdating ? "Saving..." : "Save Changes" }}
            </ButtonFilled>
            <ButtonFilled
              @click="toggleEditing()"
              type="button"
              class="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              Cancel
            </ButtonFilled>
          </template>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles for this component */

/* Textfield Styling (consistent with signup) */
.textfeild {
  /* Apply base Tailwind classes */
  @apply max-w-full text-sm bg-transparent px-4 py-2 rounded outline-none border;
  /* Apply custom border colors for light and dark mode */
  @apply border-gray-300 dark:border-gray-600;
  /* Apply focus ring/border */
  @apply focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400;
  /* Apply text color */
  @apply text-gray-800 dark:text-gray-200;
}

/* Styling for the text display in view mode */
.textfeild-view {
  @apply max-w-full text-sm px-4 py-2; /* Match padding/size of textfield */
  @apply text-gray-800 dark:text-gray-200; /* Text color */
  /* Optional: Add border to match textfield visual style */
  @apply border border-transparent; /* Transparent border in view mode */
}

/* Style for the notification area - already done in template */
/* .message-area { ... } */
/* .message-area.success { ... } */
/* .message-area.error { ... } */
/* .message-area.info { ... } */
</style>
