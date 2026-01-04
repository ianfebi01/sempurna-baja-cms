<template>
  <UModal v-model:open="model" title="Tambah Brand Baru">
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
          <UButton variant="ghost" @click="handleCancel">Batal</UButton>
          <UButton color="neutral" type="submit" :loading="isLoading">Simpan</UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui"
import * as z from "zod"
import type { ApiError } from "~~/shared/types"

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

const toast = useToast()
async function onSubmit( event: FormSubmitEvent<Schema> ) {
    isLoading.value = true

    try {
        await useNuxtApp().$api<{ url: string }>( "/api/brands/create", {
            method : "POST",
            body   : state,
        } )

        toast.add( { title: "Sukses", description: `Sukses menambahkan brand ${event.data.name}`, color: "success" } )
        isLoading.value = false
        state.name = ""
        state.slug = ""
        model.value = false
        refreshNuxtData( "brands" )
    } catch ( error: unknown ) {
        let err: ApiError
        if ( typeof error === "object" && error !== null && "data" in error ) {
            err = ( error ).data as ApiError
            toast.add( { title: "Gagal menambahkan brand.", description: err.error.message, color: "error" } )
        }
    } finally {
        isLoading.value = false
    }
}

const handleCancel = () => {
    state.name = ""
    state.slug = ""
    model.value = false
}   
</script>