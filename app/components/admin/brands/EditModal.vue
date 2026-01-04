<template>
  <UModal v-model:open="model" title="Edit Brand">
    <template #body>
      <UForm
        :schema="schema"
        class="space-y-4"
        :state="state"
        @submit="onSubmit">
        <UFormField label="Nama Brand" name="name">
          <UInput v-model="state.name" placeholder="Masukkan nama brand" class="w-full" />
        </UFormField>
        <UFormField label="Slug" name="slug">
          <UInput v-model="state.slug" placeholder="Masukkan slug brand" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="closeModal">Batal</UButton>
          <UButton color="neutral" type="submit" :loading="isLoading">Edit</UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import * as z from "zod"
import { ref, reactive, watch } from "vue"
import type { ApiError } from "~~/shared/types"

const props = defineProps<{ initialValue?: { name?: string; slug?: string }, editId?: string }>()
const emit = defineEmits( ["close", "submit", "update:open"] )
const model = defineModel<boolean>( "open" )
const isLoading = ref( false )

const schema = z.object( {
  name : z.string().min( 2, "Nama terlalu pendek" ),
  slug : z.string().min( 2, "Slug terlalu pendek" )
    .max( 100, "Slug maksimal 100 karakter" )
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug hanya boleh huruf kecil, angka, dan tanda minus. Tidak boleh diawali/diakhiri dengan '-' atau ada '--'",
    ),
} )

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>( {
  name : "",
  slug : "",
} )

watch( () => props.initialValue, ( val ) => {
  if ( val ) {
    state.name = val.name || ""
    state.slug = val.slug || ""
  }
}, { immediate: true, deep: true } )

function closeModal() {
  emit( "close" )
  model.value = false
  cancelEdit()
}

const toast = useToast()

function cancelEdit() {
  state.name = ""
  state.slug = ""
}

async function onSubmit() {
  isLoading.value = true
  try {
    await useNuxtApp().$api( `/api/brands/${props.editId}`, {
      method : "put",
      body   : { ...state },
    } )
    toast.add( { title: "Sukses", description: "Brand berhasil diubah", color: "success" } )
    refreshNuxtData( "brands" )
    cancelEdit()
    model.value = false
  } catch ( error: unknown ) {
    let err: ApiError
    if ( typeof error === "object" && error !== null && "data" in error ) {
      err = ( error ).data as ApiError
      toast.add( { title: "Gagal mengedit brand.", description: err.error.message, color: "error" } )
    }
  } finally {
    isLoading.value = false
  }
}
</script>