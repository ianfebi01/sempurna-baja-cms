<template>
  <UModal v-model:open="model" title="Tambah Kategori Baru">
    <template #body>
      <UForm
        :schema="schema"
        class="space-y-4"
        :state="state"
        @submit="onSubmit">
        <UFormField label="Nama Kategori" name="name">
          <UInput v-model="state.name" placeholder="Galvalum 0.30" class="w-full" />
        </UFormField>
        <UFormField label="Slug" name="slug">
          <UInput v-model="state.slug" placeholder="galvalum-030-zenium" class="w-full" />
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
        await useNuxtApp().$api<{ url: string }>( "/api/categories/create", {
            method : "POST",
            body   : state,
        } )

        toast.add( { title: "Sukses", description: `Sukses menambahkan kategori ${event.data.name}`, color: "success" } )
        isLoading.value = false
        state.name = ""
        state.slug = ""
        model.value = false
        refreshNuxtData( "categories" )
    } catch ( error: unknown ) {
        const err = error as Error
        toast.add( {
            title       : "Gagal menambahkan kategori.",
            description : err.message,
            color       : "error",
        } )
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