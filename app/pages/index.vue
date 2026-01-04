<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Produk" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Tambah Produk"
            icon="i-lucide-plus"
            color="neutral"
            to="/add-product" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          :model-value="(table?.tableApi?.getColumn('name')?.getFilterValue() as string)"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter produk..."
          :ui="{trailing: 'pe-1'}"
          :loading="status === 'pending'"
          @update:model-value="table?.tableApi?.getColumn('name')?.setFilterValue($event)" >
          <template v-if="(table?.tableApi?.getColumn('name')?.getFilterValue() as string)?.length" #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              icon="i-lucide-circle-x"
              aria-label="Clear input"
              @click="(table?.tableApi?.getColumn('name')?.setFilterValue(''))"
            />
          </template>
        </UInput>

        <div class="flex flex-wrap items-center gap-1.5">
          <USelect
            v-model="categoryFilter"
            :items="categories"
            :loading="categoriesPending"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            placeholder="Filter kategori"
            class="min-w-28" />
          <UDropdownMenu
            :items="table?.tableApi
              ?.getAllColumns()
              .filter((column: any) => column.getCanHide())
              .map((column: any) => ({
                label: upperFirst(column.id),
                type: 'checkbox' as const,
                checked: column.getIsVisible(),
                onUpdateChecked(checked: boolean) {
                  table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                },
                onSelect(e?: Event) {
                  e?.preventDefault()
                }
              }))
            "
            :content="{ align: 'end' }">
            <UButton
              label="Display"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2" />
          </UDropdownMenu>
        </div>
      </div>

      <ClientOnly>
        <UTable
          ref="table"
          v-model:column-filters="columnFilters"
          v-model:column-visibility="columnVisibility"
          v-model:row-selection="rowSelection"
          v-model:pagination="pagination"
          :pagination-options="{
            getPaginationRowModel: getPaginationRowModel(),
            manualPagination:true
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
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} dari
          {{ data?.data?.meta?.total || 0 }} baris dipilih.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="data?.data?.meta?.total || 0"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)" />
        </div>
      </div>
      <UModal
        v-model:open="showDeleteConfirm"
        title="Konfirmasi Hapus"
        description="Anda yakin ingin menghapus produk ini?"
        :ui="{ footer: 'justify-end' }">
        <template #footer>
          <UButton variant="ghost" @click="showDeleteConfirm = false">Batal</UButton>
          <UButton color="error" :loading="deletingId === productToDelete?._id" @click="confirmDeleteProduct">Hapus
          </UButton>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import { upperFirst } from "scule"
import { getPaginationRowModel } from "@tanstack/table-core"
import type { Product, ProductResponse } from "#shared/types/product"
import type { ApiError, ApiSuccess } from "~~/shared/types"

definePageMeta( {
  layout     : "default",
  middleware : "auth",
} )

const router = useRouter()
const UAvatar = resolveComponent( "UAvatar" )
const UButton = resolveComponent( "UButton" )
const UTooltip = resolveComponent( "UTooltip" )
const UDropdownMenu = resolveComponent( "UDropdownMenu" )
const UCheckbox = resolveComponent( "UCheckbox" )

const toast = useToast()

const table = useTemplateRef( "table" )

const columnFilters = ref( [{
  id    : "name",
  value : "",
}] )

const columnVisibility = ref()
const rowSelection = ref()
const pagination = ref( {
  pageIndex : 0,
  pageSize  : 10,
} )
const columnFiltersDebounced = useDebounce( columnFilters, 500 )

const { data, status } = await useAPI<ApiSuccess<ProductResponse>>( "/api/products", {
  lazy   : true,
  server : false,
  key    : "products",
  method : "GET",
  params : {
    page     : computed( () => pagination.value.pageIndex + 1 ),
    pageSize : computed( () => pagination.value.pageSize ),
    search   : computed( () => columnFiltersDebounced.value.find( ( filter ) => filter.id === "name" )?.value || "" ),
    category : computed( () => columnFiltersDebounced.value.find( ( filter ) => filter.id === "category" )?.value || "" ),
  },
  watch: [ pagination, columnFiltersDebounced ],
} )

const rows = computed( () => data.value?.data?.data || [] )

const columns: TableColumn<Product>[] = [
  // Select column
  {
    id     : "select",
    header : ( { table } ) =>
      h( UCheckbox, {
        "modelValue": table.getIsSomePageRowsSelected()
          ? "indeterminate"
          : table.getIsAllPageRowsSelected(),
        "onUpdate:modelValue": ( value: boolean | "indeterminate" ) =>
          table.toggleAllPageRowsSelected( !!value ),
        "ariaLabel": "Select all",
      } ),
    cell: ( { row } ) =>
      h( UCheckbox, {
        "modelValue"          : row.getIsSelected(),
        "onUpdate:modelValue" : ( value: boolean | "indeterminate" ) =>
          row.toggleSelected( !!value ),
        "ariaLabel": "Select row",
      } ),
  },

  // ID column
  {
    accessorKey : "id",
    header      : "ID",
  },

  // Product name + image column
  {
    accessorKey : "name",
    header      : ( { column } ) => {
      const isSorted = column.getIsSorted()

      return h( UButton, {
        color   : "neutral",
        variant : "ghost",
        label   : "Produk",
        icon    : isSorted
          ? isSorted === "asc"
            ? "i-lucide-arrow-up-narrow-wide"
            : "i-lucide-arrow-down-wide-narrow"
          : "i-lucide-arrow-up-down",
        class   : "-mx-2.5",
        onClick : () => column.toggleSorting( isSorted === "asc" ),
      } )
    },
    cell: ( { row } ) => {
      const product = row.original
      return h( "div", { class: "flex items-center gap-3" }, [
        h( UAvatar, {
          src  : product.image,
          size : "lg",
        } ),
        h( "div", undefined, [
          h( "p", { class: "font-medium text-highlighted" }, product.name ),
          h( "p", { class: "text-sm text-muted" }, product.brand.name ),
        ] ),
      ] )
    },
  },

  // Slug
  {
    accessorKey : "slug",
    header      : "Slug",
  },

  // Category
  {
    id          : "category",
    accessorKey : "category",
    header      : "Kategori",
    cell        : ( { row } ) => row.original.category.name,
    filterFn    : ( row, id, filterValue ) => {
      if ( filterValue === "all" ) return true
      return row.original.category._id === filterValue
    },
  },

  // Price
  {
    accessorKey : "price",
    header      : "Harga",
    cell        : ( { row } ) => `Rp ${row.original.price.toLocaleString()} /${row.original.unit}`,
  },

  // Description
  {
    accessorKey : "description",
    header      : "Deskripsi",
    cell        : ( { row } ) => {
      const desc = row.original.description
      return h(

        UTooltip,
        {
          side  : "top",
          align : "start",
          class : "max-w-xs whitespace-pre-line text-sm",
          ui    : {
            base    : "h-full",
            content : "max-w-xs h-auto",
          },
        },
        {
          default: () =>
            h(
              "p",
              { class: "text-sm text-muted line-clamp-2 cursor-help" },
              desc,
            ),
          content: () =>
            h(
              "div",
              { class: "max-w-xs whitespace-pre-line break-words text-sm" },
              desc,
            ),
        },

      )
    },
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
              {
                label    : "Lihat", icon     : "i-lucide-eye", onSelect : () => {
                  const route = router.resolve( {
                    name   : "products-slug",
                    params : { slug: row.original.slug },
                  } )
                  window.open( route.href, "_blank" )
                },
              },
              { label: "Edit", icon: "i-lucide-pencil", onSelect: () => router.push( `/edit-product/${row.original._id}` ) },
              { label: "Delete", icon: "i-lucide-trash", onSelect: () => promptDeleteProduct( row.original ) },
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

// Categories

const { data: categoriesData, pending: categoriesPending } = useAPI<{ data: Category[] }>( "/api/categories", {
  server : true,
  key    : "categories",
} )

const categories = computed( () => [
  { label: "Semua Kategori", value: "all" },
  ...( Array.isArray( categoriesData.value?.data )
    ? categoriesData.value.data.map( ( category ) => ( {
      label : category.name,
      value : category._id,
    } ) )
    : [] ),
] )

const categoryFilter = ref( "all" )

watch( () => categoryFilter.value, ( newVal ) => {
  if ( !table?.value?.tableApi ) return

  const categoryColumn = table.value.tableApi.getColumn( "category" )
  if ( !categoryColumn ) return

  if ( newVal === "all" ) {
    categoryColumn.setFilterValue( undefined )
  } else {
    categoryColumn.setFilterValue( newVal )
  }
} )

/**
 * Delete product
 */
const showDeleteConfirm = ref( false )
const deletingId = ref<string | null>( null )
const productToDelete = ref<Product | null>( null )

async function deleteProduct( id: string ) {
  deletingId.value = id
  try {
    await useNuxtApp().$api( `/api/products/${id}`, {
      method: "delete",
    } )
    toast.add( { title: "Sukses", description: "Produk dihapus", color: "success" } )
    refreshNuxtData( "products" )
  } catch ( error: unknown ) {
    let err: ApiError
    if ( typeof error === "object" && error !== null && "data" in error ) {
      err = ( error ).data as ApiError
      toast.add( { title: "Gagal menghapus produk.", description: err.error.message, color: "error" } )
    }
  } finally {
    deletingId.value = null
  }
}

async function confirmDeleteProduct() {
  if ( !productToDelete.value ) return
  await deleteProduct( productToDelete.value._id )
  showDeleteConfirm.value = false
  productToDelete.value = null
}

function promptDeleteProduct( product: Product ) {
  productToDelete.value = product
  showDeleteConfirm.value = true
}
</script>

