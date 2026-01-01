<script setup lang="ts">
import type { NuxtError } from "#app"

const props = defineProps( {
  error: Object as () => NuxtError,
} )

console.log( props.error )
</script>

<template>
  <NuxtLoadingIndicator color="#F56131" />
  <div class="flex flex-col relative min-h-screen">
    <UApp>
      <div class="grow flex items-center justify-center relative">
        <div class="absolute inset-x-0 bottom-0 text-gray-100 z-[0]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path
              fill="currentColor"
              fill-opacity="1"
              d="M0,64L120,58.7C240,53,480,43,720,48C960,53,1200,75,1320,85.3L1440,96L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z" />
          </svg>
        </div>
        <div class="main-container relative z-[1]">
          <div class="flex items-center justify-center flex-col gap-8">
            <h1 class="font-black uppercase text-9xl mt-0">{{ error?.statusCode }}</h1>
            <NuxtLink to="/login" class="button button-primary">Masuk</NuxtLink>
          </div>
        </div>
      </div>
    </UApp>
  </div>
</template>