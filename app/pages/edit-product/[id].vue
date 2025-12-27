<script setup lang="ts">
import * as z from "zod"
import type { FormSubmitEvent } from "@nuxt/ui"
import type { Category, Product } from "~~/shared/types/product"
import type { ApiError, ApiSuccess } from "~~/shared/types"

definePageMeta( {
  layout     : "default",
  middleware : "auth",
} )

const router = useRouter()

/**
 * Get Product ID from route params
 */

const route = useRoute()
const productId = route.params.id as string
const { data: productData, pending: productPending } = await useFetch<ApiSuccess<Partial<Product>>>( `/api/products/${productId}`, {
  key: `product-${productId}`,
} )

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MIN_DIMENSIONS = { width: 200, height: 200 }
const MAX_DIMENSIONS = { width: 4096, height: 4096 }
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const isLoading = ref( false )

const formatBytes = ( bytes: number, decimals = 2 ) => {
  if ( bytes === 0 ) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const i = Math.floor( Math.log( bytes ) / Math.log( k ) )
  return Number.parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( dm ) ) + " " + sizes[i]
}

const schema = z.object( {
  image: z.union(
    [
      z.instanceof( File, {
        message: "Silakan pilih file gambar.",
      } )
        .refine( ( file ) => file.size <= MAX_FILE_SIZE, {
          message: `Ukuran gambar terlalu besar. Silakan pilih gambar yang ukurannya kurang dari ${formatBytes( MAX_FILE_SIZE )}.`,
        } )
        .refine( ( file ) => ACCEPTED_IMAGE_TYPES.includes( file?.type ), {
          message: "Format gambar tidak valid. Format yang diperbolehkan: JPEG, PNG, atau WebP.",
        } )
        .refine(
          ( file ) =>
            new Promise( ( resolve ) => {
              const reader = new FileReader()
              reader.onload = ( e ) => {
                const img = new Image()
                img.onload = () => {
                  const meetsDimensions =
                    img.width >= MIN_DIMENSIONS.width &&
                    img.height >= MIN_DIMENSIONS.height &&
                    img.width <= MAX_DIMENSIONS.width &&
                    img.height <= MAX_DIMENSIONS.height
                  resolve( meetsDimensions )
                }
                img.src = e.target?.result as string
              }
              reader.readAsDataURL( file )
            } ),
          {
            message: `Dimensi gambar tidak sesuai. Silakan unggah gambar dengan dimensi antara ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height} hingga ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height} piksel.`,
          },
        ),
      z.string().regex( /^https?:\/\// )], {
    message: "Silakan pilih file gambar atau biarkan gambar awal.",
  } ),
  name : z.string().min( 2, "Nama terlalu pendek" ),
  slug : z.string().min( 2, "Slug terlalu pendek" )
    .max( 100, "Slug maksimal 100 karakter" )
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug hanya boleh huruf kecil, angka, dan tanda minus. Tidak boleh diawali/diakhiri dengan '-' atau ada '--'",
    ),
  description: z.string().min( 10, "Deskripsi terlalu pendek" )
    .max( 5000, "Deskripsi maksimal 5000 karakter" ),
  category : z.string().min( 2, "Kategori terlalu pendek" ),
  price    : z.number().min( 1000, "Harga minimal adalah 1000" ),
  unit     : z.string().min( 1, "Satuan wajib diisi" ),
  brand    : z.string().min( 2, "Brand terlalu pendek" ),
} )


const open = ref( false )
const showCategoryModal = ref( false )
const showBrandModal = ref( false )

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>( {
  image       : undefined,
  name        : "",
  slug        : "",
  description : "",
  category    : "",
  price       : undefined,
  unit        : "",
  brand       : "",
} )

// set state when product data is loaded
const initialImageUrl = ref<string>( "" )
watch( productData, ( newData ) => {
  if ( newData && newData.data ) {
    const product = newData.data
    Object.assign( state, {
      name        : product.name || "",
      image       : product.image || "",
      slug        : product.slug || "",
      description : product.description || "",
      // eslint-disable-next-line no-underscore-dangle
      category    : product.category && product.category._id ? product.category._id : "",
      price       : product.price || undefined,
      unit        : product.unit || "",
      // eslint-disable-next-line no-underscore-dangle
      brand       : product.brand && product.brand._id ? product.brand._id : "",
      // image is not set here
    } )
    // Set initial image URL from API if available
    if ( product.image ) {
      initialImageUrl.value = product.image
    }
  }
}, { immediate: true, deep: true } )

const toast = useToast()
async function onSubmit( event: FormSubmitEvent<Schema> ) {
  isLoading.value = true

  try {
    const formData = new FormData()
    Object.keys( state ).forEach( ( key ) => {
      if ( state[key as keyof typeof state] )
        formData.append( key, state[key as keyof typeof state] as Blob )
    } )

    await $fetch<{ url: string }>( `/api/products/${productId}`, {
      method : "put",
      body   : formData,
    } )

    toast.add( { title: "Sukses", description: `Sukses mengubah produk ${event.data.name}`, color: "success" } )
    open.value = false
    isLoading.value = false
    router.push( "/" )
  } catch ( error: unknown ) {
    let err: ApiError
    if ( typeof error === "object" && error !== null && "data" in error ) {
      err = ( error ).data as ApiError
      toast.add( { title: "Gagal mengubah produk.", description: err.error.message, color: "error" } )
    }
  } finally {
    isLoading.value = false
  }
}

/**
 * Categories
 */

const { data: categories, pending: categoriesPending } = useFetch<ApiSuccess<Category[]>>( "/api/categories", {
  key: "categories",
} )

const categoryItems = computed( () => {
  return categories.value?.data.length ? categories.value?.data.map( ( category ) => ( {
    label : category.name,
    // eslint-disable-next-line no-underscore-dangle
    value : category._id,
  } ) ) : []
} )

/**
 * Brand
 */

const { data: brands, pending: brandsPending } = useFetch<ApiSuccess<Brand[]>>( "/api/brands", {
  key: "brands",
} )

const brandItems = computed( () => {
  return brands.value?.data.length ? brands.value?.data.map( ( brand ) => ( {
    label : brand.name,
    // eslint-disable-next-line no-underscore-dangle
    value : brand._id,
  } ) ) : []
} )
</script>

<template>
  <UDashboardPanel id="add-product">
    <template #header>
      <UDashboardNavbar title="Produk" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
        <UForm
          :schema="schema"
          :state="state"
          class="space-y-4"
          :disabled="productPending || isLoading"
          @submit="onSubmit">
          <UFormField label="Gambar" name="image">
            <UFileUpload
              v-if="(typeof state.image !== 'string')"
              ref="fileUploadRef"
              v-model="state.image"
              accept="image/*"
              :max-files="1"
              label="Pilih gambar"
              description="PNG, JPG, atau WEBP (maks 2 MB)"
              class="w-full max-w-xs aspect-square"
              :class="{
                'hidden': initialImageUrl
              }" />
            <div v-else-if="typeof state.image === 'string'" class="mb-2 relative w-full max-w-xs aspect-square">
              <img
                :src="state.image"
                alt="Preview"
                class="w-full h-full object-cover rounded border border-muted"
                @click="() => {

                  initialImageUrl = ''
                  state.image = undefined
                }" />

              <UButton
                icon="lucide:x"
                color="neutral"
                size="xs"
                variant="link"
                class="font-medium inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors text-xs gap-1 text-inverted bg-inverted hover:bg-inverted/90 active:bg-inverted/90 disabled:bg-inverted aria-disabled:bg-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inverted absolute -top-1.5 -end-1.5 p-0 rounded-full border-2 border-bg"
                @click="() => {
                  initialImageUrl = ''
                  state.image = undefined
                }" />

            </div>
          </UFormField>


          <UFormField label="Nama Produk" name="name">
            <UInput v-model="state.name" placeholder="Galvalum 0.30" class="w-full" />
          </UFormField>

          <UFormField label="Slug" name="slug">
            <UInput v-model="state.slug" placeholder="galvalum-030-zenium" class="w-full" />
          </UFormField>

          <UFormField label="Deskripsi" name="description">
            <UTextarea
              v-model="state.description"
              placeholder="Lapisan aluminium dan zinc yang melindungi dari karat..."
              class="w-full" />
          </UFormField>

          <UFormField label="Kategori" name="category">
            <USelect
              v-if="categoryItems"
              v-model="state.category"
              placeholder="Galvalum"
              :items="categoryItems"
              class="w-full"
              :loading="categoriesPending" />

            <UButton
              color="neutral"
              size="xs"
              class="mt-2"
              @click="showCategoryModal = true">Kelola Kategori</UButton>
          </UFormField>

          <UFormField label="Harga (Rp)" name="price">
            <UInputNumber
              v-model="state.price"
              placeholder="40000"
              :format-options="{
                style: 'currency',
                currency: 'IDR',
                currencyDisplay: 'code',
                currencySign: 'accounting'
              }"
              class="w-full" />
          </UFormField>

          <UFormField label="Satuan" name="unit">
            <UInput v-model="state.unit" placeholder="m" class="w-full" />
          </UFormField>

          <UFormField label="Brand" name="brand">
            <USelect
              v-if="brandItems"
              v-model="state.brand"
              placeholder="Zenium"
              :items="brandItems"
              class="w-full"
              :loading="brandsPending" />

            <UButton
              color="neutral"
              size="xs"
              class="mt-2"
              @click="showBrandModal = true">Kelola Brand</UButton>

          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton
              label="Batal"
              color="primary"
              variant="subtle"
              :disabled="isLoading"
              to="/" />
            <UButton
              label="Edit Produk"
              color="neutral"
              variant="solid"
              type="submit"
              :loading="isLoading" />
          </div>
        </UForm>
        <AdminCategoriesModal v-model:open="showCategoryModal" />
        <AdminBrandsModal v-model:open="showBrandModal" />
      </div>
    </template>
  </UDashboardPanel>

</template>
