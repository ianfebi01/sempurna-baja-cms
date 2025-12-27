<template>
  <NuxtLoadingIndicator color="#F56131" />
  <div class="flex flex-col relative min-h-screen">
    <UApp>

      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UApp>
  </div>
</template>
<script lang="ts" setup>
const config = useRuntimeConfig()
const siteName = config.public.siteName
const title = siteName || "Sempurna Baja – Baja Ringan & Galvalum"
const description = "Toko & jasa pasang baja ringan, galvalum, channal, reng, plafon di Wonosari. Survey & estimasi gratis. WA +62 831-4451-2987."
useHead( {
  htmlAttrs: {
    lang: "id",
  },
  title,
  meta: [
    {
      name    : "description",
      content : description,
    },
  ],
  link: [
    {
      rel   : "icon",
      type  : "image/png",
      href  : "/favicon-96x96.png",
      sizes : "96x96",
    },
    {
      rel  : "icon",
      type : "image/svg+xml",
      href : "/favicon.svg",
    },
    {
      rel  : "shortcut icon",
      href : "/favicon.ico",
    },
    {
      rel   : "apple-touch-icon",
      sizes : "180x180",
      href  : "/apple-touch-icon.png",
    },
  ],
} )
</script>