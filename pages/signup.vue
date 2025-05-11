<script setup>
const name = ref("");
const email = ref("");
const password = ref("");
const avatar = ref("/avataaars.svg");
const avatarInput = ref(null);
function handleFile(event) {
  avatar.value = event.target.files[0];
}

async function submitForm() {
  const formData = new FormData();
  formData.append("name", name.value);
  formData.append("email", email.value);
  formData.append("password", password.value);
  if (avatar.value) {
    formData.append("avatar", avatar.value);
  }

  try {
    const response = await fetch(BASEURL + "/signup.php", {
      method: "POST",
      body: formData,
    });
    const result = await response.text();
    alert(result);
  } catch (error) {
    alert("Signup failed.");
    console.error(error);
  }
}
const pickAvatar = () => {
  ocument.getElementById("avatarInput").click();
};
</script>

<template>
  <div class="flex flex-col gap-8 md:max-w-[400px] mx-auto">
    <div>
      <h3 class="md:mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
        Create your account
      </h3>
      <p class="leading-7 [&:not(:first-child)]:mt-2 text-opacity-65">
        Let's get your profile setup in less than a 2 minutes
      </p>
    </div>

    <form
      @submit.prevent="submitForm"
      enctype="multipart/form-data"
      class="flex flex-col gap-8"
    >
      <p class="leading-7 [&:not(:first-child)]:mt-6">
        Upload a profile picture
      </p>
      <div class="flex items-center gap-2 md:gap-4">
        <img :src="avatar" alt="" class="size-40 rounded-full object-cover" />
        <ButtonFilled class="w-fit h-fit" @click="pickAvatar()">
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
        <p class="leading-7 [&:not(:first-child)]:mt-6">Your name</p>
        <input
          type="text"
          name="name"
          v-model="name"
          placeholder="Full Name"
          required
          class="textfeild"
        />
      </div>

      <div class="flex flex-col gap-4">
        <p class="leading-7 [&:not(:first-child)]:mt-6">
          Your email and password
        </p>
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          v-model="email"
          class="textfeild"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          class="textfeild"
          required
          v-model="password"
        />
      </div>
      <div class="flex flex-col gap-4">
        <ButtonFilled type="submit"> Continue </ButtonFilled>
        <p>or</p>
        <NuxtLink to="/signin">
          <ButtonFilled> Signin </ButtonFilled>
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<style>
.textfeild {
  @apply max-w-full text-sm bg-transparent px-4 py-2 rounded outline-none border;
}
</style>
