<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import type { ApiError, ApiSuccess } from "~~/shared/types"
import {
  bannerFieldsConfig,
  bannerTypes,
  sectionFieldsConfig,
  sectionTypes,
  generateDefaultState,
  generateZodSchema,
  type BannerType,
  type SectionType,
} from "~~/shared/utils/fieldDefinitions"
import { z } from "zod"

definePageMeta( {
  layout     : "default",
  middleware : "auth",
} )

const route = useRoute()
const router = useRouter()
const toast = useToast()

const pageId = route.params.id as string

const isLoading = ref( false )

// Load page data
const { data: pageData, status: pageStatus } = await useAPI<ApiSuccess<{
  name: string
  slug: string
  isPublished: boolean
  metaTitle?: string
  metaDescription?: string
  banner: { type: BannerType; [key: string]: unknown }
  sections: Array<{ type: SectionType; [key: string]: unknown }>
}>>(
  `/api/pages/${pageId}`,
  { key: `page-${pageId}`, server: false },
)

// Banner type
const bannerType = ref<BannerType>( "mainHero" )

// Form state
const state = reactive( {
  name            : "",
  slug            : "",
  isPublished     : false,
  metaTitle       : "",
  metaDescription : "",
  sections        : [] as Array<{ type: SectionType; [key: string]: unknown }>,
} )

// Banner form state
const bannerState = ref<Record<string, unknown>>( {
  type: "mainHero",
  ...generateDefaultState( bannerFieldsConfig.mainHero || [] ),
} )


// Generate dynamic banner schema
const bannerSchema = computed( () => {
  const fields = bannerFieldsConfig[bannerType.value] || []
  const dynamicSchema = generateZodSchema( fields )
  return z.object( { type: z.string() } ).merge( dynamicSchema )
} )

// Generate dynamic sections schema
const sectionsSchema = computed( () => {
  const sectionSchemas = state.sections.map( ( section ) => {
    const fields = sectionFieldsConfig[section.type] || []
    const dynamicSchema = generateZodSchema( fields )
    return z.object( { type: z.literal( section.type ) } ).merge( dynamicSchema )
  } )

  if ( sectionSchemas.length === 0 ) return z.array( z.any() )
  if ( sectionSchemas.length === 1 ) return z.array( sectionSchemas[0]! )

  const [first, second, ...rest] = sectionSchemas
  return z.array( z.union( [first!, second!, ...rest] ) )
} )

// Full page form schema
const formSchema = computed( () => z.object( {
  name            : z.string().min( 1, "Nama halaman wajib diisi" ),
  slug            : z.string().min( 1, "Slug wajib diisi" ).regex( /^[a-z0-9-]+$/, "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung" ),
  isPublished     : z.boolean(),
  metaTitle       : z.string().optional().or( z.literal( "" ) ),
  metaDescription : z.string().optional().or( z.literal( "" ) ),
  sections        : sectionsSchema.value,
} ) )

// Populate form when data loads
watch( pageData, ( data ) => {
  if ( data?.data ) {
    const page = data.data
    state.name = page.name
    state.slug = page.slug
    state.isPublished = page.isPublished
    state.metaTitle = page.metaTitle || ""
    state.metaDescription = page.metaDescription || ""
    state.sections = page.sections || []

    if ( page.banner ) {
      bannerType.value = page.banner.type
      bannerState.value = { ...page.banner }
    }
  }
}, { immediate: true } )

// Update banner state when type changes (manual change)
watch( bannerType, ( newType ) => {
  // Only reset if user manually changed type
  if ( pageData.value?.data?.banner?.type !== newType ) {
    bannerState.value = {
      type: newType,
      ...generateDefaultState( bannerFieldsConfig[newType] || [] ),
    }
  }
} )

// Add new section
function addSection( type: SectionType ) {
  const fields = sectionFieldsConfig[type] || []
  state.sections.push( {
    type,
    ...generateDefaultState( fields ),
  } )
}

// Remove section
function removeSection( index: number ) {
  state.sections.splice( index, 1 )
}

// Move section up/down
function moveSection( index: number, direction: "up" | "down" ) {
  const newIndex = direction === "up" ? index - 1 : index + 1
  if ( newIndex < 0 || newIndex >= state.sections.length ) return

  const temp = state.sections[index]!
  state.sections[index] = state.sections[newIndex]!
  state.sections[newIndex] = temp
}

// Update section data
function updateSection( index: number, data: Record<string, unknown> ) {
  state.sections[index] = { ...state.sections[index], ...data } as typeof state.sections[number]
}

// Get section type label
function getSectionTypeLabel( type: SectionType ): string {
  return sectionTypes.find( ( t ) => t.value === type )?.label || type
}

async function onSubmit( event: FormSubmitEvent<z.output<typeof formSchema.value>> ) {
  isLoading.value = true

  try {
    const payload = {
      ...state,
      banner: bannerState.value,
    }

    await useNuxtApp().$api( `/api/pages/${pageId}`, {
      method : "PUT",
      body   : payload,
    } )

    toast.add( { title: "Sukses", description: "Halaman berhasil diperbarui", color: "success" } )
    router.push( "/pages" )
  } catch ( error: unknown ) {
    if ( typeof error === "object" && error !== null && "data" in error ) {
      const err = ( error as { data: ApiError } ).data
      toast.add( { title: "Gagal", description: err.error.message, color: "error" } )
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="edit-page">
    <template #header>
      <UDashboardNavbar title="Edit Halaman">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="pageStatus === 'pending'" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin size-8" />
      </div>

      <UForm
        v-else
        :state="state"
        :schema="formSchema"
        class="space-y-6 max-w-4xl"
        :disabled="isLoading"
        @submit="onSubmit">
        <!-- Page Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Nama Halaman" name="name" required>
            <UInput v-model="state.name" placeholder="Beranda" class="w-full" />
          </UFormField>

          <UFormField label="Slug" name="slug" required>
            <UInput v-model="state.slug" placeholder="home" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Status" name="isPublished">
          <UCheckbox v-model="state.isPublished" label="Diterbitkan" />
        </UFormField>

        <!-- Banner -->
        <div class="border border-default rounded-lg p-4 space-y-4">
          <h3 class="font-medium">Banner</h3>

          <UFormField label="Tipe Banner" name="bannerType">
            <USelect v-model="bannerType" :items="bannerTypes" class="w-full" />
          </UFormField>

          <DynamicForm
            :fields="bannerFieldsConfig[bannerType] || []"
            :model-value="bannerState"
            @update:model-value="bannerState = $event" />
        </div>

        <!-- Sections -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-medium">Sections</h3>
            <UDropdownMenu
              :items="sectionTypes.map(t => ({ label: t.label, onSelect: () => addSection(t.value) }))"
              :content="{ align: 'end' }">
              <UButton size="sm" color="primary" icon="i-lucide-plus">
                Tambah Section
              </UButton>
            </UDropdownMenu>
          </div>

          <!-- Empty state -->
          <div
            v-if="!state.sections.length"
            class="border border-dashed border-default rounded-lg p-8 text-center text-muted">
            <p class="mb-2">Belum ada section.</p>
            <p class="text-sm">Klik "Tambah Section" untuk menambahkan.</p>
          </div>

          <!-- Section list -->
          <div
            v-for="(section, idx) in state.sections"
            :key="idx"
            class="border border-default rounded-lg overflow-hidden">
            <!-- Section header -->
            <div class="flex items-center justify-between px-4 py-3 bg-muted/30">
              <div class="flex items-center gap-2">
                <span class="text-sm text-muted w-6">{{ idx + 1 }}.</span>
                <UBadge color="neutral" variant="subtle">{{ getSectionTypeLabel(section.type) }}</UBadge>
              </div>
              <div class="flex items-center gap-1">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-chevron-up"
                  :disabled="idx === 0"
                  @click="moveSection(idx, 'up')" />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-chevron-down"
                  :disabled="idx === state.sections.length - 1"
                  @click="moveSection(idx, 'down')" />
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  @click="removeSection(idx)" />
              </div>
            </div>

            <!-- Section fields -->
            <div class="p-4">
              <DynamicForm
                :fields="sectionFieldsConfig[section.type] || []"
                :model-value="section"
                @update:model-value="updateSection(idx, $event)" />
            </div>
          </div>
        </div>

        <!-- SEO -->
        <div class="border border-default rounded-lg p-4 space-y-4">
          <h3 class="font-medium">SEO</h3>

          <UFormField label="Meta Title" name="metaTitle">
            <UInput v-model="state.metaTitle" placeholder="Judul untuk SEO" class="w-full" />
          </UFormField>

          <UFormField label="Meta Description" name="metaDescription">
            <UTextarea v-model="state.metaDescription" placeholder="Deskripsi untuk SEO" class="w-full" />
          </UFormField>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-4">
          <UButton
            label="Batal"
            color="neutral"
            variant="outline"
            to="/pages" />
          <UButton
            label="Simpan"
            color="primary"
            type="submit"
            :loading="isLoading" />
        </div>
      </UForm>
    </template>
  </UDashboardPanel>
</template>
