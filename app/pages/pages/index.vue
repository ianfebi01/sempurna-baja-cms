<template>
  <UDashboardPanel id="pages">
    <template #header>
      <UDashboardNavbar title="Halaman" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Tambah Halaman"
            icon="i-lucide-plus"
            color="neutral"
            to="/pages/add" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-4">
        <UInput
          :model-value="(table?.tableApi?.getColumn('name')?.getFilterValue() as string)"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Cari halaman..."
          :ui="{trailing: 'pe-1'}"
          :loading="status === 'pending'"
          @update:model-value="table?.tableApi?.getColumn('name')?.setFilterValue($event)">
          <template v-if="(table?.tableApi?.getColumn('name')?.getFilterValue() as string)?.length" #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              icon="i-lucide-circle-x"
              aria-label="Clear input"
              @click="(table?.tableApi?.getColumn('name')?.setFilterValue(''))" />
          </template>
        </UInput>

        <USelect
          v-model="publishedFilter"
          :items="publishedOptions"
          placeholder="Status"
          class="min-w-28" />
      </div>

      <ClientOnly>
        <UTable
          ref="table"
          v-model:column-filters="columnFilters"
          v-model:pagination="pagination"
          :pagination-options="{
            getPaginationRowModel: getPaginationRowModel(),
            manualPagination: true
          }"
          :column-filters-options="{
            manualFiltering: true
          }"
          class="shrink-0"
          :data="rows"
          :columns="columns"
          :loading="status === 'pending'"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default',
            separator: 'h-0'
          }" />
      </ClientOnly>

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          Total: {{ data?.data?.meta?.total || 0 }} halaman
        </div>

        <UPagination
          :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="data?.data?.meta?.total || 0"
          @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)" />
      </div>

      <UModal
        v-model:open="showDeleteConfirm"
        title="Konfirmasi Hapus"
        description="Anda yakin ingin menghapus halaman ini?"
        :ui="{ footer: 'justify-end' }">
        <template #footer>
          <UButton variant="ghost" @click="showDeleteConfirm = false">Batal</UButton>
          <UButton color="error" :loading="isDeleting" @click="confirmDelete">Hapus</UButton>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import { getPaginationRowModel } from "@tanstack/table-core"
import type { PageListItem, PageResponse } from "~~/shared/types/page"
import type { ApiError, ApiSuccess } from "~~/shared/types"

definePageMeta( {
  layout     : "default",
  middleware : "auth",
} )

const router = useRouter()
const toast = useToast()

const UButton = resolveComponent( "UButton" )
const UBadge = resolveComponent( "UBadge" )
const UDropdownMenu = resolveComponent( "UDropdownMenu" )

const table = useTemplateRef( "table" )

const columnFilters = ref( [{
  id    : "name",
  value : "",
}] )

const pagination = ref( {
  pageIndex : 0,
  pageSize  : 10,
} )

const publishedFilter = ref( "all" )
const columnFiltersDebounced = useDebounce( columnFilters, 500 )

const { data, status } = await useAPI<ApiSuccess<PageResponse>>( "/api/pages", {
  lazy   : true,
  server : false,
  key    : "pages",
  method : "GET",
  params : {
    page      : computed( () => pagination.value.pageIndex + 1 ),
    pageSize  : computed( () => pagination.value.pageSize ),
    search    : computed( () => columnFiltersDebounced.value.find( ( f ) => f.id === "name" )?.value || "" ),
    published : computed( () => publishedFilter.value === "all" ? "" : publishedFilter.value ),
  },
  watch: [pagination, columnFiltersDebounced, publishedFilter],
} )

const rows = computed( () => data.value?.data?.data || [] )

const publishedOptions = [
  { label: "Semua Status", value: "all" },
  { label: "Diterbitkan", value: "true" },
  { label: "Draft", value: "false" },
]

const columns: TableColumn<PageListItem>[] = [
  {
    accessorKey : "name",
    header      : "Nama",
  },
  {
    accessorKey : "slug",
    header      : "Slug",
    cell        : ( { row } ) => `/${row.original.slug}`,
  },
  {
    accessorKey : "isPublished",
    header      : "Status",
    cell        : ( { row } ) =>
      h( UBadge, {
        color   : row.original.isPublished ? "success" : "neutral",
        variant : "subtle",
      }, () => row.original.isPublished ? "Diterbitkan" : "Draft" ),
  },
  {
    accessorKey : "createdAt",
    header      : "Dibuat",
    cell        : ( { row } ) => new Date( row.original.createdAt ).toLocaleDateString( "id-ID" ),
  },
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
              { label: "Edit", icon: "i-lucide-pencil", onSelect: () => router.push( `/pages/edit/${row.original._id}` ) },
              { label: "Hapus", icon: "i-lucide-trash", onSelect: () => promptDelete( row.original ) },
            ],
          },
          () =>
            h( UButton, {
              icon    : "i-lucide-ellipsis-vertical",
              color   : "neutral",
              variant : "ghost",
              class   : "ml-auto",
            } ),
        ),
      ),
  },
]

// Delete
const showDeleteConfirm = ref( false )
const isDeleting = ref( false )
const pageToDelete = ref<PageListItem | null>( null )

function promptDelete( page: PageListItem ) {
  pageToDelete.value = page
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if ( !pageToDelete.value ) return

  isDeleting.value = true
  try {
    await useNuxtApp().$api( `/api/pages/${pageToDelete.value._id}`, { method: "DELETE" } )
    toast.add( { title: "Sukses", description: "Halaman berhasil dihapus", color: "success" } )
    refreshNuxtData( "pages" )
  } catch ( error: unknown ) {
    if ( typeof error === "object" && error !== null && "data" in error ) {
      const err = ( error as { data: ApiError } ).data
      toast.add( { title: "Gagal", description: err.error.message, color: "error" } )
    }
  } finally {
    isDeleting.value = false
    showDeleteConfirm.value = false
    pageToDelete.value = null
  }
}
</script>
