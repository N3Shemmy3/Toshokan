<script setup lang="ts">
import { NuxtLink } from "#components";
</script>

<template>
  <div class="flex flex-col gap-8">
    <section
      id="hero"
      class="flex-col md:min-h-screen 2xl:min-h-fit pt-10 md:pt-20 flex items-center text-center"
    >
      <small
        class="flex items-center w-fit p-2 text-xs space-x-1 animate-bounce rounded-full bg-colorSurface-light/40 dark:bg-colorSurface-dark/40 border border-colorText-light/10 dark:border-colorText-dark/10"
      >
        <Icon name="ic:outline-star-outline" size="16" />
        <span> Free books for everyone </span>
        <Icon name="ic:outline-star-outline" size="16" />
      </small>
      <h1 class="text-4xl md:text-7xl font-bold mt-4 leading-8">
        Share your books
        <span class="italic font-cursive">freely</span> with the wolrd
      </h1>
      <p class="text-base mt-2">
        Knowledge should not be locked behind paywalls, everyone derserves an
        education
      </p>
      <div class="flex items-center space-x-4 mt-8">
        <NuxtLink to="/books">
          <ButtonFilled>
            <p>Get started</p>
          </ButtonFilled>
        </NuxtLink>

        <NuxtLink to="/write">
          <ButtonOutlined>
            <p>Start writing</p>
          </ButtonOutlined>
        </NuxtLink>
      </div>
      <MarqueeText class="mt-16" />
    </section>
    <section class="flex flex-col gap-8 md:gap-16 py-14">
      <div class="flex items-center justify-between">
        <h4 class="text-xl md:text-3xl">Our Latest Books</h4>
        <NuxtLink to="/books">
          <ButtonFilled>See all</ButtonFilled>
        </NuxtLink>
      </div>

      <ul class="grid gap-4 md:gap-6 grid-responsive items-center list-none">
        <Book v-for="n in 5" />
      </ul>
    </section>
  </div>
</template>
