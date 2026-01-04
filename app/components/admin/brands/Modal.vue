<template>
  <UModal v-model:open="model" title="Kelola Brand">
    <template #body>
      <div class="mb-4 flex justify-between items-center">
        <h2 class="text-lg font-bold">Daftar Brand</h2>
        <UButton color="neutral" @click="openAddModal = true">Tambah Brand</UButton>
      </div>
      <UTable
        ref="table"
        :columns="tableColumns"
        :data="brands"
        :loading="brandsPending"
        class="mb-6"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }" />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} dari
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} baris dipilih.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)" />
        </div>
      </div>

      <AddModal v-model:open="openAddModal" />
      <EditModal v-model:open="editing" :initial-value="state" :edit-id="editId" />

      <UModal
        v-model:open="showDeleteConfirm"
        title="Konfirmasi Hapus"
        description="Anda yakin ingin menghapus brand ini?"
        :ui="{ footer: 'justify-end' }">
        <template #footer>
          <UButton variant="ghost" @click="showDeleteConfirm = false">Batal</UButton>
          <UButton color="error" :loading="deletingId === brandToDelete?._id" @click="confirmDeleteBrand">
            Hapus
          </UButton>
        </template>
      </UModal>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import * as z from "zod"
import AddModal from "./AddModal.vue"
import EditModal from "./EditModal.vue"

import type { Brand } from "~~/shared/types/product"
import type { ApiError } from "~~/shared/types"
import type { ColumnDef } from "@tanstack/table-core"

const model = defineModel<boolean>( "open" )
const openAddModal = ref( false )
const deletingId = ref<string | null>( null )
const editing = ref( false )
const editId = ref<string>()
const showDeleteConfirm = ref( false )
const brandToDelete = ref<Brand | null>( null )
const table = useTemplateRef( "table" )

const UButton = resolveComponent( "UButton" )
const UDropdownMenu = resolveComponent( "UDropdownMenu" )

const _schema = z.object( {
    name : z.string().min( 2, "Nama terlalu pendek" ),
    slug : z.string().min( 2, "Slug terlalu pendek" )
        .max( 100, "Slug maksimal 100 karakter" )
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Slug hanya boleh huruf kecil, angka, dan tanda minus. Tidak boleh diawali/diakhiri dengan '-' atau ada '--'",
        ),
} )

type Schema = z.output<typeof _schema>

const state = reactive<Partial<Schema>>( {
    name : "",
    slug : "",
} )

const toast = useToast()

const { data: brandsData, pending: brandsPending } = useAPI<{ data: Category[] }>( "/api/brands", {
    server : false,
    key    : "brands",
} )

const brands = computed( () => brandsData.value?.data || [] )

async function deleteBrand( id: string ) {
    deletingId.value = id
    try {
        await useNuxtApp().$api( `/api/brands/${id}`, {
            method: "delete",
        } )
        toast.add( { title: "Sukses", description: "Brand dihapus", color: "success" } )
        refreshNuxtData( "brands" )
    } catch ( error: unknown ) {
        let err: ApiError
        if ( typeof error === "object" && error !== null && "data" in error ) {
            err = ( error ).data as ApiError
            toast.add( { title: "Gagal menghapus brand.", description: err.error.message, color: "error" } )
        }
    } finally {
        deletingId.value = null
    }
}

async function confirmDeleteBrand() {
    if ( !brandToDelete.value ) return
    await deleteBrand( brandToDelete.value._id )
    showDeleteConfirm.value = false
    brandToDelete.value = null
}

function promptDeleteBrand( brand: Category ) {
    brandToDelete.value = brand
    showDeleteConfirm.value = true
}

const handleEdit = ( brand: Category ) => {
    state.name = brand.name
    state.slug = brand.slug
    editId.value = brand._id
    editing.value = true
}

const tableColumns: ColumnDef<Category>[] = [
    {
        id          : "name",
        accessorKey : "name",
        header      : "Nama Brand",
    },
    {
        id          : "slug",
        accessorKey : "slug",
        header      : "Slug",
    },
    // Actions
    {
        id     : "actions",
        header : "",
        cell   : ( { row } ) =>
            h(
                "div",
                { class: "text-right" },
                h(
                    UDropdownMenu,
                    {
                        content : { align: "end" },
                        items   : [
                            { label: "Edit", icon: "i-lucide-pencil", onSelect: () => handleEdit( row.original ) },
                            { label: "Delete", icon: "i-lucide-trash", onSelect: () => promptDeleteBrand( row.original ) },
                        ],
                    },
                    () =>
                        h( UButton, {
                            icon    : "i-lucide-ellipsis-vertical",
                            color   : "neutral",
                            variant : "ghost",
                            class   : "ml-auto",
                            loading : deletingId.value === row.original._id,
                        } ),
                ),
            ),
    },
]
</script>