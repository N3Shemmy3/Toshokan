<script setup>
const props = defineProps({
  title: String,
  cover: String,
});
</script>

<template>
  <li
    class="w-full h-full flex flex-col cursor-pointer overflow-clip transition-all duration-300 hover:opacity-55"
  >
    <div
      class="flex items-center justify-center rounded-xl bg-colorSurface-light dark:bg-colorSurface-dark text-center text-sm w-full flex-grow-0 aspect-[8/12]"
    >
      <img
        v-if="props.cover"
        :src="props.cover"
        :alt="props.title"
        class="w-full h-full object-cover rounded-xl"
      />
      <p v-else>No Cover</p>
    </div>
    <p class="mt-2 py-1 px-2 font-bold text-xs">{{ props.title }}</p>
  </li>
</template>
