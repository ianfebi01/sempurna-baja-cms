<template>
  <UDashboardPanel id="allowlist">
    <template #header>
      <UDashboardNavbar title="Allowlist Pengguna" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            v-if="isSuperAdmin"
            label="Tambah Email"
            icon="i-lucide-plus"
            color="neutral"
            @click="showAddModal = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Cari email..."
          :ui="{ trailing: 'pe-1' }">
          <template v-if="search?.length" #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              icon="i-lucide-circle-x"
              aria-label="Clear input"
              @click="search = ''" />
          </template>
        </UInput>
      </div>

      <ClientOnly>
        <UTable
          class="shrink-0"
          :data="filteredRows"
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
          {{ filteredRows.length }} dari {{ data?.data?.length || 0 }} email ditampilkan.
        </div>
      </div>

      <!-- Add allowlist modal -->
      <UModal v-model:open="showAddModal" title="Tambah Email ke Allowlist" :ui="{ footer: 'justify-end' }">
        <template #body>
          <UForm
            :schema="schema"
            class="space-y-4"
            :state="addingState"
            @submit="onAdd">

            <UFormField name="email">
              <UInput
                v-model="addingState.email"
                label="Email"
                placeholder="nama@email.com"
                class="w-full" />
            </UFormField>
            <UFormField name="role">
              <USelect
                v-model="addingState.role"
                :items="roleItems"
                placeholder="Pilih peran"
                class="w-full" />
            </UFormField>

            <USeparator />
            <div class="flex justify-end gap-2 mt-4">
              <UButton variant="ghost" @click="onCloseAdd">Batal</UButton>
              <UButton
                color="neutral"
                type="submit"
                :loading="adding"
                :disabled="!canSubmit">Simpan
              </UButton>
            </div>

          </UForm>

        </template>
      </UModal>

      <!-- Delete confirmation modal -->
      <UModal
        v-model:open="showDeleteConfirm"
        title="Konfirmasi Hapus"
        description="Anda yakin ingin menghapus email ini dari allowlist?"
        :ui="{ footer: 'justify-end' }">
        <template #footer>
          <UButton variant="ghost" @click="showDeleteConfirm = false">Batal</UButton>
          <UButton color="error" :loading="deletingEmail === itemToDelete?.email" @click="confirmDelete">Hapus
          </UButton>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import type { Role } from "#shared/types"
import type { ApiSuccess } from "~~/shared/types"
import z from "zod"
import { RoleEnum } from "~~/server/models/allowlist.schema"

definePageMeta( {
    layout     : "default",
    middleware : "auth",
} )

const UButton = resolveComponent( "UButton" )

const toast = useToast()

// Auth role
const { user } = useUserSession()
const isSuperAdmin = computed( () => user.value?.role === "super-admin" )

// Fetch allowlist
interface AllowItem { email: string; role: Role }
const { data, status } = await useAPI<ApiSuccess<AllowItem[]>>( "/api/allowlist", {
    lazy   : true,
    server : false,
    key    : "allowlist",
    method : "GET",
} )

const rows = computed( () => data.value?.data || [] )

// Search filter
const search = ref( "" )
const filteredRows = computed( () => {
    const q = search.value.trim().toLowerCase()
    if ( !q ) return rows.value
    return rows.value.filter( ( r ) => r.email.toLowerCase().includes( q ) )
} )

// Table columns
const columns: TableColumn<AllowItem>[] = [
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role", header: "Peran", cell: ( { row } ) => row.original.role === "super-admin" ? "Super Admin" : "Admin" },
    {
        id     : "actions",
        header : "",
        cell   : ( { row } ) => {
            const item = row.original
            if ( !isSuperAdmin.value ) return null
            return h(
                "div",
                { class: "text-right" },
                h(
                    UButton,
                    {
                        icon     : "i-lucide-trash",
                        color    : "neutral",
                        variant  : "ghost",
                        class    : "ml-auto text-error",
                        disabled : user.value?.email === item.email,
                        onClick  : () => promptDelete( item ),
                    },
                ),
            )
        },
    },
]

// Add allowlist state
const showAddModal = ref( false )
const adding = ref( false )

const roleItems = [
    { label: "Admin", value: "admin" },
    { label: "Super Admin", value: "super-admin" },
]

const schema = z.object( {
    email : z.email( "Invalid email" ),
    role  : RoleEnum.default( "admin" ),
} )

const addingState = reactive<Partial<{ email: string; role: Role }>>( {
    email : "",
    role  : "admin",
} )

const canSubmit = computed( () => !!addingState.email && !!addingState.role )

function onCloseAdd() {
    showAddModal.value = false
    addingState.email = ""
    addingState.role = "admin"
}

async function onAdd() {
    if ( !isSuperAdmin.value ) return
    adding.value = true
    try {
        const payload = { email: addingState.email, role: addingState.role }
        await useNuxtApp().$api( "/api/allowlist/create", { method: "POST", body: payload } )
        toast.add( { title: "Sukses", description: "Email ditambahkan ke allowlist", color: "success" } )
        onCloseAdd()
        await refreshNuxtData( "allowlist" )
    } catch {
        toast.add( { title: "Gagal", description: "Tidak dapat menambah email", color: "error" } )
    } finally {
        adding.value = false
    }
}

// Delete allowlist item
const showDeleteConfirm = ref( false )
const itemToDelete = ref<AllowItem | null>( null )
const deletingEmail = ref<string | null>( null )

function promptDelete( item: AllowItem ) {
    itemToDelete.value = item
    showDeleteConfirm.value = true
}

async function confirmDelete() {
    if ( !itemToDelete.value || !isSuperAdmin.value ) return
    deletingEmail.value = itemToDelete.value.email
    try {
        await useNuxtApp().$api( `/api/allowlist/${encodeURIComponent( itemToDelete.value.email )}`.toString(), { method: "DELETE" } )
        toast.add( { title: "Sukses", description: "Email dihapus dari allowlist", color: "success" } )
        await refreshNuxtData( "allowlist" )
    } catch {
        toast.add( { title: "Gagal", description: "Tidak dapat menghapus email", color: "error" } )
    } finally {
        deletingEmail.value = null
        showDeleteConfirm.value = false
        itemToDelete.value = null
    }
}
</script>
