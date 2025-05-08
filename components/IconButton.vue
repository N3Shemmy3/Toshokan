<script setup lang="ts">
const props = defineProps(["icon"]);
</script>

<template>
  <button
    class="flex items-center justify-center size-10 rounded-full transition-colors duration-300 hover:bg-colorSurface-light dark:hover:bg-colorSurface-dark"
  >
    <Icon :name="props.icon" class="pointer-events-none" />
  </button>
</template>
