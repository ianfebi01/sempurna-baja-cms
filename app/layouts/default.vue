<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui"

const toast = useToast()
const router = useRouter()
const open = ref( false )
const { loggedIn, user, clear } = useUserSession()

const isPublishing = ref( false )
async function handlePublish() {
  if ( isPublishing.value ) return

  isPublishing.value = true
  try {
    await useNuxtApp().$api( "/api/deploy/trigger", { method: "POST" } )
    toast.add( {
      color       : "success",
      title       : "Berhasil!",
      icon        : "i-ph-rocket-launch",
      description : "Website sedang di-deploy. Proses ini membutuhkan waktu beberapa menit.",
    } )
  } catch ( error ) {
    console.error( error )
    toast.add( {
      color       : "error",
      title       : "Gagal!",
      icon        : "i-ph-warning",
      description : "Gagal memicu deploy. Silakan coba lagi.",
    } )
  } finally {
    isPublishing.value = false
  }
}

const items = computed<NavigationMenuItem[][]>( () => {
  const group: NavigationMenuItem[] = [
    {
      label : "Produk",
      icon  : "fa7-solid:bag-shopping",
      href  : "/",
    },
  ]

  if ( user.value?.role === "super-admin" ) {
    group.push( {
      label : "Kelola Pengguna",
      icon  : "fa7-solid:users-cog",
      href  : "/users",
    } )
  }

  return [group]
} )

const secondaryItems = computed<NavigationMenuItem[]>( () => [
  {
    label    : isPublishing.value ? "Publishing..." : "Publish",
    icon     : "i-ph-rocket-launch",
    disabled : isPublishing.value,
    onSelect : () => handlePublish(),
  },
] )

const profileDropdownItems = computed( () => [
  [
    {
      label    : "Akun",
      slot     : "account",
      disabled : true,
    },
  ],
  [
    {
      label    : "Keluar",
      icon     : "i-ph-sign-out",
      onSelect : async () => {
        // Guard: only logout if actually logged in
        if ( !loggedIn.value ) return
        
        await clear()
        toast.add( {
          color       : "error",
          title       : "Keluar!",
          icon        : "i-ph-sign-out",
          description : "Anda telah keluar dari akun Anda.",
        } )
        router.replace( { path: "/login" } )
      },
    },
  ],
] )
</script>

<template>
  <div>
    <UDashboardGroup unit="rem">
      <UDashboardSidebar
        v-model:open="open"
        collapsible
        resizable
        :ui="{ footer: 'border-t border-default' }">
        <template #header>
          <div class="overflow-hidden aspect-square size-10">
            <img
              src="/sempurna-baja-logo.svg"
              alt="Logo"
              width="40"
              height="40"
              class="w-full h-full object-contain object-center" />
          </div>
        </template>

        <template #default="{ collapsed }">
          <!-- <UButton
            :label="collapsed ? undefined : 'Search...'"
            icon="i-lucide-search"
            color="primary"
            variant="outline"
            block
            :square="collapsed">
            <template v-if="!collapsed" #trailing>
              <div class="flex items-center gap-0.5 ms-auto">
                <UKbd value="meta" variant="subtle" />
                <UKbd value="K" variant="subtle" />
              </div>
            </template>
          </UButton> -->

          <UNavigationMenu :collapsed="collapsed" :items="items[0]" orientation="vertical" />

          <UNavigationMenu
            :collapsed="collapsed"
            :items="secondaryItems"
            orientation="vertical"
            class="mt-auto" />
        </template>

        <template #footer="{ collapsed }">
          <UDropdownMenu v-if="loggedIn" :items="profileDropdownItems" mode="hover">
            <UButton variant="link" class="p-0 cursor-pointer">
              <UAvatar :src="`https://unavatar.io/gravatar/${user?.email}`" class="bg-gray-200 dark:bg-neutral-800" />
              <p v-if="!collapsed" class="truncate">{{ user?.email }}</p>
            </UButton>

            <template #account>
              <div class="text-left w-full">
                <p>
                  Masuk sebagai
                </p>
                <p class="truncate font-medium">
                  {{ user?.email }}
                </p>
              </div>
            </template>
          </UDropdownMenu>
        </template>
      </UDashboardSidebar>
      <slot></slot>
    </UDashboardGroup>
  </div>
</template>
