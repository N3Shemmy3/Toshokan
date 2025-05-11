<template>
  <div class="flex flex-col gap-8">
    <div class="mt-16">
      <h4 class="text-xl md:text-3xl mt-4">Our latest books</h4>
    </div>
    <ul class="grid gap-4 md:gap-6 grid-responsive items-center list-none">
      <Book v-for="n in 40" />
    </ul>
  </div>
</template>
