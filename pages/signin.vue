<script setup>
import { ref } from "vue";

const email = ref("");
const password = ref("");

async function submitLogin() {
  const formData = new FormData();
  formData.append("email", email.value);
  formData.append("password", password.value);

  try {
    const response = await fetch(BASEURL + "/signin.php", {
      method: "POST",
      body: formData,
      credentials: "include", // include PHP session cookie
    });
    const result = await response.json();

    if (result.success) {
      // Save user details to localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: result.id,
          email: result.email,
          avatar: result.avatar || null,
        })
      );

      // Redirect to a dashboard or another page
      window.location.href = "/books"; // Example redirect
    } else {
      alert(result.message || "Login failed.");
    }
  } catch (error) {
    alert("Login failed.");
    console.error(error);
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-4 md:max-w-[400px] mx-auto rounded-md md:border md:p-4"
  >
    <h3
      class="text-center md:mt-8 scroll-m-20 text-2xl font-semibold tracking-tight"
    >
      Sign in to your account
    </h3>
    <p class="leading-7 text-center text-opacity-65">
      Welcome back! Please enter your details.
    </p>

    <form @submit.prevent="submitLogin" class="flex flex-col gap-2 *:w-full">
      <div>
        <p class="leading-7 [&:not(:first-child)]:mt-2 text-opacity-65">
          Email
        </p>
        <input
          type="email"
          v-model="email"
          class="textfeild mt-2 w-full"
          required
        />
      </div>
      <div>
        <p class="leading-7 [&:not(:first-child)]:mt-2 text-opacity-65">
          Password
        </p>
        <input
          type="password"
          v-model="password"
          class="textfeild mt-2 w-full"
          required
        />
      </div>
      <ButtonFilled type="submit" class="mt-8 rounded">
        <p class="text-center mx-auto">Sign In</p>
      </ButtonFilled>
      <p class="text-center mx-auto">or</p>
      <NuxtLink to="/signup">
        <ButtonOutlined class="w-full">
          <p class="text-center mx-auto">Sign up</p>
        </ButtonOutlined>
      </NuxtLink>
    </form>
  </div>
</template>
