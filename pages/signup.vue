<script setup>
import { ref } from "vue"; // Make sure ref is imported
import { useRouter } from "vue-router"; // Or useNuxtRouter if using Nuxt 3
// Assume BASEURL is defined somewhere accessible
// Assume ButtonFilled and NuxtLink components are imported

// Reactive state for form inputs
const name = ref("");
const email = ref("");
const password = ref("");
const avatar = ref("/avataaars.svg"); // Default avatar path
const avatarInput = ref(null); // Template ref for the file input element

// UI State
const isLoading = ref(false); // Loading state for the submit button
const message = ref({ type: "", text: "" }); // For displaying success/error messages { type: 'success'|'error', text: '...' }

// --- Validation Helper ---
// Basic email validation regex
const isValidEmail = (email) => {
  // A more robust regex could be used, but this is a decent basic check
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
  // If no file is selected, clear the preview and any messages
  if (!file) {
    avatar.value = "/avataaars.svg"; // Reset to default avatar
    message.value = { type: "", text: "" }; // Clear previous file errors
    return;
  }

  // --- File Validation ---
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]; // Added webp
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
    avatar.value = "/avataaars.svg"; // Reset to default avatar
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
    avatar.value = "/avataaars.svg"; // Reset to default avatar
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
    avatar.value = "/avataaars.svg"; // Reset to default avatar
  };
  reader.readAsDataURL(file); // Start reading the file
};

// --- Form Submission ---
async function submitForm() {
  // Clear previous messages before attempting submission
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
  if (!password.value) {
    message.value = { type: "error", text: "Password cannot be empty." };
    return; // Stop submission if validation fails
  }
  // --- End Frontend Form Validation ---

  isLoading.value = true; // Set loading state to true

  // Prepare form data for the POST request
  const formData = new FormData();
  formData.append("name", name.value.trim()); // Trim whitespace before sending
  formData.append("email", email.value.trim()); // Trim whitespace before sending
  formData.append("password", password.value);

  // Only append the avatar data if a file was selected and successfully read as base64
  // Check if avatar.value is not the default SVG path and starts with the data URL prefix
  if (
    avatar.value !== "/avataaars.svg" &&
    avatar.value &&
    avatar.value.startsWith("data:image")
  ) {
    formData.append("avatar", avatar.value);
  }

  try {
    // Send the POST request to the signup API endpoint
    const response = await fetch(BASEURL + "/signup.php", {
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
      // Use the 'error' property from the backend's JSON response if available, otherwise use status text
      const errorText =
        result.error || response.statusText || "Unknown server error";
      message.value = { type: "error", text: `Signup failed: ${errorText}` };
      console.error("Signup API Error:", response.status, result); // Log the full error response
    } else {
      // Handle 2xx status codes (Success)
      // Use the 'message' property from the backend's JSON response if available
      const successMessage = result.message || "Signup successful!";
      message.value = { type: "success", text: successMessage };
      console.log("Signup successful:", result); // Log the full success response

      // Store user data in local storage (assuming backend returns user object)
      // The backend should NOT return the password hash here
      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
        // Redirect to the sign-in page after successful signup
        useRouter().push("/signin"); // Assuming useRouter is available
      } else {
        console.warn("Signup successful, but no user data returned.");
        // Decide how to handle this case - maybe still redirect or show a different message
        message.value = {
          type: "success",
          text: successMessage + " Please sign in now.",
        };
        useRouter().push("/signin");
      }
    }
  } catch (error) {
    // Handle network errors or issues with JSON parsing if response.json() failed
    message.value = {
      type: "error",
      text: "An unexpected error occurred. Please try again.",
    };
    console.error("Fetch Error during signup:", error);
  } finally {
    // Always reset loading state after the fetch attempt is complete
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-8 md:max-w-[400px] mx-auto">
    <div
      v-if="message.text"
      :class="{
        'text-green-600': message.type === 'success',
        'text-red-600': message.type === 'error',
        'mb-4 p-3 rounded': true /* Added padding and rounded corners */,
        'bg-green-100 border border-green-400':
          message.type === 'success' /* Success background/border */,
        'bg-red-100 border border-red-400':
          message.type === 'error' /* Error background/border */,
      }"
    >
      {{ message.text }}
    </div>

    <div>
      <h3 class="md:mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
        Create your account
      </h3>
      <p
        class="leading-7 [&:not(:first-child)]:mt-2 text-gray-600 dark:text-gray-400"
      >
        Let's get your profile setup in less than a 2 minutes
      </p>
    </div>

    <form @submit.prevent="submitForm" class="flex flex-col gap-8">
      <p
        class="leading-7 [&:not(:first-child)]:mt-6 text-gray-700 dark:text-gray-300"
      >
        Upload a profile picture
      </p>
      <div class="flex items-center gap-2 md:gap-4">
        <img
          :src="avatar"
          alt="Avatar Preview"
          class="size-40 rounded-full object-cover border border-gray-300 dark:border-gray-600"
        />
        <ButtonFilled
          class="w-fit h-fit"
          @click="pickAvatar()"
          :disabled="isLoading"
        >
          Pick picture
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
      </div>

      <div class="flex flex-col gap-2">
        <label
          for="name"
          class="leading-7 [&:not(:first-child)]:mt-6 text-gray-700 dark:text-gray-300"
          >Your name</label
        >
        <input
          type="text"
          id="name"
          name="name"
          v-model="name"
          placeholder="Full Name"
          required
          class="textfeild"
          :disabled="isLoading"
        />
      </div>

      <div class="flex flex-col gap-4">
        <label
          for="email"
          class="leading-7 [&:not(:first-child)]:mt-6 text-gray-700 dark:text-gray-300"
          >Your email</label
        >
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          required
          v-model="email"
          class="textfeild"
          :disabled="isLoading"
        />
        <label for="password" class="sr-only">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Password"
          class="textfeild"
          required
          v-model="password"
          :disabled="isLoading"
        />
      </div>
      <div class="flex flex-col gap-4">
        <ButtonFilled type="submit" :disabled="isLoading">
          {{ isLoading ? "Creating Account..." : "Continue" }}
        </ButtonFilled>
        <p class="text-center text-gray-600 dark:text-gray-400">or</p>
        <NuxtLink to="/signin">
          <ButtonFilled :disabled="isLoading"> Sign in </ButtonFilled>
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<style>
/* Scoped styles for this component */

/* Textfield Styling */
.textfeild {
  /* Apply base Tailwind classes */
  @apply max-w-full text-sm bg-transparent px-4 py-2 rounded outline-none border;
  /* Apply custom border colors for light and dark mode */
  @apply border;
  /* Apply focus ring/border */
  @apply focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400;
  /* Apply text color */
  @apply text-gray-800 dark:text-gray-200;
}
</style>
