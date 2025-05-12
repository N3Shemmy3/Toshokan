<script setup>
const props = defineProps({
  title: String,
  cover: String,
});
</script>

<template>
  <li
    class="w-full h-full flex flex-col justify-center items-center cursor-pointer overflow-clip transition-all duration-300 hover:opacity-55"
  >
    <img
      v-if="props.cover"
      class="rounded-xl bg-colorSurface-light dark:bg-colorSurface-dark text-center text-sm w-32 h-48 object-cover"
      :src="props.cover"
      :alt="props.title"
    />
    <div
      v-else
      class="w-32 h-48 bg-colorSurface-light dark:bg-colorSurface-dark flex items-center justify-center rounded-xl text-sm opacity-70"
    >
      No Cover
    </div>
    <p class="mt-2 py-1 px-2 font-bold text-xs">{{ props.title }}</p>
  </li>
</template>
