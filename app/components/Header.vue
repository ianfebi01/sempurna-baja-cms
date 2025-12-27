<template>
  <nav class="main-container flex items-center gap-8 h-16">
    <NuxtLink to="/" exact-active-class="!font-bold" class="no-underline text-black font-extralight transition-default">
      Beranda
    </NuxtLink>
    <NuxtLink
      to="/products"
      class="no-underline text-black font-extralight transition-default"
      exact-active-class="!font-bold">
      Produk
    </NuxtLink>
    <div class="grow"></div>
    <NuxtLink :to="`https://wa.me/6283144512987`" class="button button-primary">
      <Icon name="fa7-solid:paper-plane" />
      Kontak
    </NuxtLink>
  </nav>
</template>