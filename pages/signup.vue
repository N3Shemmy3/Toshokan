<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// Reactive state for form inputs
const name = ref("");
const email = ref("");
const password = ref("");
const avatar = ref("/avataaars.svg");
const avatarInput = ref(null);

// UI State
const isLoading = ref(false);
const message = ref({ type: "", text: "" });

// --- Validation Helper ---
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// --- File Handling ---
const pickAvatar = () => {
  if (avatarInput.value) {
    avatarInput.value.click();
  }
};

const handleFile = (event) => {
  const file = event.target.files[0];
  if (!file) {
    avatar.value = "/avataaars.svg";
    message.value = { type: "", text: "" };
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const maxSizeMB = 2;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    message.value = {
      type: "error",
      text: `Invalid file type. Only ${allowedTypes
        .map((t) => t.split("/")[1].toUpperCase())
        .join(", ")} images are allowed.`,
    };
    event.target.value = "";
    avatar.value = "/avataaars.svg";
    return;
  }

  if (file.size > maxSizeBytes) {
    message.value = {
      type: "error",
      text: `File size (${(file.size / 1024 / 1024).toFixed(
        2
      )} MB) exceeds the maximum limit of ${maxSizeMB}MB.`,
    };
    event.target.value = "";
    avatar.value = "/avataaars.svg";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    avatar.value = reader.result;
    message.value = { type: "", text: "" };
  };
  reader.onerror = () => {
    message.value = { type: "error", text: "Failed to read file." };
    event.target.value = "";
    avatar.value = "/avataaars.svg";
  };
  reader.readAsDataURL(file);
};

// --- Form Submission ---
async function submitForm() {
  message.value = { type: "", text: "" };

  if (!name.value.trim()) {
    message.value = { type: "error", text: "Name cannot be empty." };
    return;
  }
  if (!email.value.trim() || !isValidEmail(email.value.trim())) {
    message.value = {
      type: "error",
      text: "Please enter a valid email address.",
    };
    return;
  }
  if (!password.value) {
    message.value = { type: "error", text: "Password cannot be empty." };
    return;
  }

  isLoading.value = true;

  const formData = new FormData();
  formData.append("name", name.value.trim());
  formData.append("email", email.value.trim());
  formData.append("password", password.value);

  if (
    avatar.value !== "/avataaars.svg" &&
    avatar.value &&
    avatar.value.startsWith("data:image")
  ) {
    formData.append("avatar", avatar.value);
  }

  try {
    const response = await fetch(BASEURL + "/signup.php", {
      method: "POST",
      body: formData,
    });

    // --- ENHANCED ERROR HANDLING: Check Content-Type before parsing JSON ---
    const contentType = response.headers.get("Content-Type");

    if (!contentType || !contentType.includes("application/json")) {
      // If the response is not JSON, it's likely a server error page (HTML)
      const errorText = `Received unexpected response format (${
        contentType || "No Content-Type header"
      }). Expected JSON. This is likely a server error.`;
      console.error(
        "Signup API Response Error:",
        response.status,
        errorText,
        await response.text()
      ); // Log the response text for debugging
      message.value = { type: "error", text: errorText };

      // You might want to throw an error here to be caught by the catch block
      // throw new Error("Unexpected server response format");
      // Or just exit the try block and let the final finally block run
      return; // Stop execution in this branch
    }
    // --- END ENHANCED ERROR HANDLING ---

    // Attempt to parse the response body as JSON (this line is 183 in your original code)
    const result = await response.json();

    // Check if the HTTP response status is NOT OK (e.g., 400, 500)
    if (!response.ok) {
      const errorText =
        result.error || response.statusText || "Unknown server error";
      message.value = { type: "error", text: `Signup failed: ${errorText}` };
      console.error("Signup API Error:", response.status, result);
    } else {
      const successMessage = result.message || "Signup successful!";
      message.value = { type: "success", text: successMessage };
      console.log("Signup successful:", result);

      if (result.user) {
        console.log("yes", result.user);
        localStorage.setItem("user", JSON.stringify(result.user));
        router.push("/signin");
      } else {
        console.warn("Signup successful, but no user data returned.");
        message.value = {
          type: "success",
          text: successMessage + " Please sign in now.",
        };
        // Even if user data isn't returned, still redirect to signin
        // as per your original logic flow
        router.push("/signin");
      }
      router.push("/signin");
    }
  } catch (error) {
    // This catch block will now handle:
    // 1. Network errors
    // 2. The SyntaxError if response.json() still fails (less likely with Content-Type check)
    // 3. Any other unexpected errors during the fetch/processing
    message.value = {
      type: "error",
      text: `An unexpected error occurred: ${
        error.message || error
      }. Please check server logs.`, // Added error message
    };
    console.error("Fetch Error during signup:", error);
    // Optionally, log the response text again if the Content-Type check wasn't hit but JSON parsing failed
    // console.error("Raw response text:", await response.text().catch(() => 'N/A'));
  } finally {
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
          <ButtonFilled :disabled="isLoading" class="w-full">
            Sign in
          </ButtonFilled>
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
