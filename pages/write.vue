<template>
  <article class="flex max-w-full flex-col px-4 py-2 md:p-8 gap-8">
    <div class="flex flex-col gap-8">
      <div class="mt-16">
        <IconButton icon="ic:outline-arrow-back" @click="$router.back" />
        <h4 class="text-xl md:text-3xl mt-4">Draft</h4>
      </div>
    </div>

    <div class="max-w-full flex flex-col gap-2">
      <h3 class="select-none text-xl">Title</h3>

      <h3 contenteditable="true" id="title" />
    </div>
    <div class="flex flex-col gap-2">
      <p class="select-none text-base">Content</p>
      <p id="content" contenteditable="true" class="" />
    </div>
  </article>
</template>
<style scoped>
.s-border {
  @apply max-w-full  ps-2 ms-2 outline-none border-s border-colorText-light/30 dark:border-colorText-dark/30;
}
#title {
  @apply s-border text-xl md:text-3xl;
}
#content {
  @apply s-border text-base md:text-xl;
}
</style>
