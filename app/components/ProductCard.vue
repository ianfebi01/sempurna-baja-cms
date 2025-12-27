<template>
  <NuxtLink :to="`/products/${product.slug}`" class="no-underline group">

    <div
      class="rounded-xl bg-gradient-to-t hover:shadow-2xl transition-default overflow-hidden h-full flex flex-col"
      :class="{
        'from-gray-100 to-white': bgColour === 'grey',
        'from-white to-gray-100': bgColour === 'white',
      }">
      <!-- Image -->
      <div class="aspect-video w-full overflow-hidden">
        <img
          :src="product.image"
          :alt="product?.name || `sempurna baja ${product._id}`"
          width="500"
          height="500"
          class="object-cover object-center w-full h-full transition-default hover:scale-105" />
      </div>
      <!-- Text -->
      <div class="p-4 md:p-6 flex flex-col flex-grow">
        <div>
          <h3>{{ product.name }}</h3>
          <p v-if="product.brand" class="text-xs">Merk: <b>{{ product.brand?.name }}</b></p>
          <p v-if="product.description" class="line-clamp-3">{{ product.description }}</p>
        </div>
        <div class="flex-grow"></div>
        <div class="mt-4">
          <p class="h4 w-fit m-0">{{ `${formatRupiah(product.price)}/${product.unit}` }}</p>
        </div>

      </div>
    </div>
  </NuxtLink>
</template>

<script lang="ts" setup>
import type { Product } from "~~/shared/types/product"

type Props = {
  product: Product
  bgColour?: "white" | "grey"
}

withDefaults( defineProps<Props>(), {
  bgColour: "grey",
} )
</script>