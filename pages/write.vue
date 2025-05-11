<script setup>
import { QuillEditor } from "@vueup/vue-quill";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
</script>
<template>
  <article class="flex max-w-full flex-col px-4 py-2 md:p-8 gap-8">
    <input
      type="text"
      placeholder="My awesome title"
      id="title"
      class="bg-transparent m-0 md:m-0 rounded text-base px-4 py-2 border border-colorText-light/30 dark:border-colorText-dark/30 outline-none"
    />
    <div class="">
      <ClientOnly>
        <QuillEditor theme="snow" toolbar="minimal" placeholder="Content...." />
      </ClientOnly>
    </div>
  </article>
</template>
<style>
.border-color {
  @apply max-w-full ps-2 outline-none border-colorText-light/30 dark:border-colorText-dark/30;
}
.ql-toolbar {
  @apply rounded-t border  border-color;
}
.ql-container {
  @apply rounded-b border-color;
}
</style>
