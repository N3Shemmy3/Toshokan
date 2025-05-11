<template>
  <div
    class="w-full max-w-full flex flex-row gap-8 relative overflow-hidden rounded-full duration-0 transition-colors"
  >
    <div
      class="flex flex-row gap-8 marquee italic font-cursive"
      style="animation: marquee 50s linear infinite"
    >
      <p v-for="n in 25" class="text-2xl md:text-5xl opacity-30">Books</p>
    </div>
    <div
      class="absolute z-[1] left-0 h-full w-1/6 bg-gradient-to-r from-colorBackground-light dark:from-colorBackground-dark to-transparent"
    ></div>
    <div
      class="absolute z-[1] right-0 h-full w-1/6 bg-gradient-to-l from-colorBackground-light dark:from-colorBackground-dark to-transparent"
    ></div>
  </div>
</template>
<style>
@keyframes marquee {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
  }
}
</style>
