<template>
  <UDashboardPanel id="users-management">
    <template #header>
      <UDashboardNavbar title="Manajemen Pengguna" :ui="{ right: 'gap-3' }">
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
      <!-- Registered Users Section -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">Pengguna Terdaftar</h3>
        <div class="flex flex-wrap items-center justify-between gap-1.5 mb-4">
          <UInput
            v-model="userSearch"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Cari pengguna..."
            :ui="{ trailing: 'pe-1' }">
            <template v-if="userSearch?.length" #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-lucide-circle-x"
                aria-label="Clear input"
                @click="userSearch = ''" />
            </template>
          </UInput>
        </div>

        <ClientOnly>
          <UTable
            class="shrink-0"
            :data="filteredUsers"
            :columns="userColumns"
            :loading="usersStatus === 'pending'"
            :ui="{
              base: 'table-fixed border-separate border-spacing-0',
              thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
              td: 'border-b border-default',
              separator: 'h-0'
            }" />
        </ClientOnly>

        <div class="text-sm text-muted mt-3">
          {{ filteredUsers.length }} dari {{ usersData?.data?.length || 0 }} pengguna.
        </div>
      </div>

      <USeparator class="my-6" />

      <!-- Allowlist Section -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Allowlist Email</h3>
        <p class="text-sm text-muted mb-4">Email yang diizinkan untuk mendaftar. Hanya email di daftar ini yang dapat login.</p>
        
        <div class="flex flex-wrap items-center justify-between gap-1.5 mb-4">
          <UInput
            v-model="allowlistSearch"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Cari email..."
            :ui="{ trailing: 'pe-1' }">
            <template v-if="allowlistSearch?.length" #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-lucide-circle-x"
                aria-label="Clear input"
                @click="allowlistSearch = ''" />
            </template>
          </UInput>
        </div>

        <ClientOnly>
          <UTable
            class="shrink-0"
            :data="filteredAllowlist"
            :columns="allowlistColumns"
            :loading="allowlistStatus === 'pending'"
            :ui="{
              base: 'table-fixed border-separate border-spacing-0',
              thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
              td: 'border-b border-default',
              separator: 'h-0'
            }" />
        </ClientOnly>

        <div class="text-sm text-muted mt-3">
          {{ filteredAllowlist.length }} dari {{ allowlistData?.data?.length || 0 }} email.
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
                placeholder="Pilih initial role"
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
const USwitch = resolveComponent( "USwitch" )
const UAvatar = resolveComponent( "UAvatar" )
const USelect = resolveComponent( "USelect" )

const toast = useToast()

// Auth role
const { user } = useUserSession()
const isSuperAdmin = computed( () => user.value?.role === "super-admin" )

// ==================== USERS SECTION ====================

interface UserItem { 
  _id: string
  email: string
  name?: string
  picture?: string
  role: Role
  isApproved: boolean
}

const { data: usersData, status: usersStatus } = await useAPI<ApiSuccess<UserItem[]>>( "/api/users", {
    lazy   : true,
    server : false,
    key    : "users-list",
    method : "GET",
} )

const usersList = computed( () => usersData.value?.data || [] )

// Search filter for users
const userSearch = ref( "" )
const filteredUsers = computed( () => {
    const q = userSearch.value.trim().toLowerCase()
    if ( !q ) return usersList.value
    return usersList.value.filter( ( r ) => 
      r.email.toLowerCase().includes( q ) || 
      r.name?.toLowerCase().includes( q ), 
    )
} )

// Track loading state for each user toggle
const togglingUser = ref<string | null>( null )

async function toggleUserApproval( userItem: UserItem ) {
    if ( !isSuperAdmin.value || togglingUser.value ) return
    togglingUser.value = userItem._id
    try {
        await useNuxtApp().$api( `/api/users/${userItem._id}`, { 
            method : "PATCH", 
            body   : { isApproved: !userItem.isApproved }, 
        } )
        toast.add( { 
            title       : "Sukses", 
            description : userItem.isApproved ? "Pengguna dinonaktifkan" : "Pengguna diaktifkan", 
            color       : "success", 
        } )
        await refreshNuxtData( "users-list" )
    } catch {
        toast.add( { title: "Gagal", description: "Tidak dapat mengubah status", color: "error" } )
    } finally {
        togglingUser.value = null
    }
}

// Track loading state for role change
const updatingRole = ref<string | null>( null )

async function updateUserRole( userItem: UserItem, newRole: Role ) {
    if ( !isSuperAdmin.value || updatingRole.value || newRole === userItem.role ) return
    updatingRole.value = userItem._id
    try {
        await useNuxtApp().$api( `/api/users/${userItem._id}`, { 
            method : "PATCH", 
            body   : { role: newRole }, 
        } )
        toast.add( { 
            title       : "Sukses", 
            description : `Role diubah menjadi ${newRole === "super-admin" ? "Super Admin" : "Admin"}`, 
            color       : "success", 
        } )
        await refreshNuxtData( "users-list" )
    } catch {
        toast.add( { title: "Gagal", description: "Tidak dapat mengubah role", color: "error" } )
    } finally {
        updatingRole.value = null
    }
}

// User table columns
const userColumns: TableColumn<UserItem>[] = [
    { 
        accessorKey : "name", 
        header      : "Pengguna",
        cell        : ( { row } ) => {
            const item = row.original
            return h( "div", { class: "flex items-center gap-3" }, [
                h( UAvatar, { 
                    src  : item.picture, 
                    alt  : item.name || item.email,
                    size : "sm",
                } ),
                h( "div", {}, [
                    h( "div", { class: "font-medium" }, item.name || "—" ),
                    h( "div", { class: "text-sm text-muted" }, item.email ),
                ] ),
            ] )
        },
    },
    { 
        accessorKey : "role", 
        header      : "Role", 
        cell        : ( { row } ) => {
            const item = row.original
            const isCurrentUser = user.value?.email === item.email
            
            if ( !isSuperAdmin.value ) {
                return h( "span", {}, item.role === "super-admin" ? "Super Admin" : "Admin" )
            }
            
            return h( USelect, {
                modelValue            : item.role,
                items                 : roleItems,
                disabled              : isCurrentUser || updatingRole.value === item._id,
                loading               : updatingRole.value === item._id,
                class                 : "w-36",
                "onUpdate:modelValue" : ( val: Role ) => updateUserRole( item, val ),
            } )
        },
    },
    { 
        accessorKey : "isApproved", 
        header      : "Status",
        cell        : ( { row } ) => {
            const item = row.original
            const isCurrentUser = user.value?.email === item.email
            
            if ( !isSuperAdmin.value ) {
                return h( "span", { 
                    class: item.isApproved ? "text-success" : "text-error", 
                }, item.isApproved ? "Aktif" : "Nonaktif" )
            }
            
            return h( "div", { class: "flex items-center gap-2" }, [
                h( USwitch, {
                    modelValue            : item.isApproved,
                    disabled              : isCurrentUser || togglingUser.value === item._id,
                    loading               : togglingUser.value === item._id,
                    "onUpdate:modelValue" : () => toggleUserApproval( item ),
                } ),
                h( "span", { 
                    class: `text-sm ${item.isApproved ? "text-success" : "text-error"}`, 
                }, item.isApproved ? "Aktif" : "Nonaktif" ),
            ] )
        },
    },
]

// ==================== ALLOWLIST SECTION ====================

interface AllowItem { email: string; role: Role }

const { data: allowlistData, status: allowlistStatus } = await useAPI<ApiSuccess<AllowItem[]>>( "/api/allowlist", {
    lazy   : true,
    server : false,
    key    : "allowlist",
    method : "GET",
} )

const allowlistRows = computed( () => allowlistData.value?.data || [] )

// Search filter for allowlist
const allowlistSearch = ref( "" )
const filteredAllowlist = computed( () => {
    const q = allowlistSearch.value.trim().toLowerCase()
    if ( !q ) return allowlistRows.value
    return allowlistRows.value.filter( ( r ) => r.email.toLowerCase().includes( q ) )
} )

// Allowlist table columns
const allowlistColumns: TableColumn<AllowItem>[] = [
    { accessorKey: "email", header: "Email" },
    { accessorKey: "role", header: "Initial Role", cell: ( { row } ) => row.original.role === "super-admin" ? "Super Admin" : "Admin" },
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
        await useNuxtApp().$api( "/api/allowlist/delete", { method: "POST", body: { email: itemToDelete.value.email } } )
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
