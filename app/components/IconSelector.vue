<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()

const searchQuery = ref( "" )
const isOpen = ref( false )

// Popular Font Awesome icons
const popularIcons = [
  { name: "fa7-solid:paper-plane", label: "Paper Plane" },
  { name: "fa7-solid:images", label: "Images" },
  { name: "fa7-solid:phone", label: "Phone" },
  { name: "fa7-solid:envelope", label: "Envelope" },
  { name: "fa7-solid:location-dot", label: "Location" },
  { name: "fa7-solid:star", label: "Star" },
  { name: "fa7-solid:check", label: "Check" },
  { name: "fa7-solid:xmark", label: "X Mark" },
  { name: "fa7-solid:arrow-right", label: "Arrow Right" },
  { name: "fa7-solid:arrow-left", label: "Arrow Left" },
  { name: "fa7-solid:cart-shopping", label: "Shopping Cart" },
  { name: "fa7-solid:user", label: "User" },
  { name: "fa7-solid:home", label: "Home" },
  { name: "fa7-solid:heart", label: "Heart" },
  { name: "fa7-solid:quote-left", label: "Quote Left" },
  { name: "fa7-solid:quote-right", label: "Quote Right" },
  { name: "fa7-solid:magnifying-glass", label: "Search" },
  { name: "fa7-solid:gear", label: "Settings" },
  { name: "fa7-solid:bell", label: "Bell" },
  { name: "fa7-solid:calendar", label: "Calendar" },
  { name: "fa7-solid:clock", label: "Clock" },
  { name: "fa7-solid:download", label: "Download" },
  { name: "fa7-solid:upload", label: "Upload" },
  { name: "fa7-solid:share", label: "Share" },
  { name: "fa7-solid:link", label: "Link" },
  { name: "fa7-solid:trash", label: "Trash" },
  { name: "fa7-solid:pen", label: "Pen" },
  { name: "fa7-solid:eye", label: "Eye" },
  { name: "fa7-solid:circle-info", label: "Info" },
  { name: "fa7-solid:circle-question", label: "Question" },
  { name: "fa7-solid:circle-check", label: "Circle Check" },
  { name: "fa7-solid:circle-xmark", label: "Circle X" },
  { name: "fa7-solid:triangle-exclamation", label: "Warning" },
  { name: "fa7-solid:bolt", label: "Bolt" },
  { name: "fa7-solid:fire", label: "Fire" },
  { name: "fa7-solid:thumbs-up", label: "Thumbs Up" },
  { name: "fa7-solid:thumbs-down", label: "Thumbs Down" },
  { name: "fa7-solid:comment", label: "Comment" },
  { name: "fa7-solid:comments", label: "Comments" },
  { name: "fa7-solid:bookmark", label: "Bookmark" },
  { name: "fa7-solid:tag", label: "Tag" },
  { name: "fa7-solid:tags", label: "Tags" },
  { name: "fa7-solid:folder", label: "Folder" },
  { name: "fa7-solid:file", label: "File" },
  { name: "fa7-solid:image", label: "Image" },
  { name: "fa7-solid:video", label: "Video" },
  { name: "fa7-solid:music", label: "Music" },
  { name: "fa7-solid:play", label: "Play" },
  { name: "fa7-solid:pause", label: "Pause" },
  { name: "fa7-solid:stop", label: "Stop" },
  { name: "fa7-solid:volume-high", label: "Volume High" },
  { name: "fa7-solid:volume-xmark", label: "Volume Mute" },
]

const filteredIcons = computed( () => {
  if ( !searchQuery.value ) return popularIcons
  const query = searchQuery.value.toLowerCase()
  return popularIcons.filter(
    icon =>
      icon.label.toLowerCase().includes( query ) ||
      icon.name.toLowerCase().includes( query ),
  )
} )

const selectedIconLabel = computed( () => {
  const icon = popularIcons.find( i => i.name === props.modelValue )
  return icon?.label || props.modelValue || "Pilih icon"
} )

function selectIcon( iconName: string ) {
  emit( "update:modelValue", iconName )
  isOpen.value = false
  searchQuery.value = ""
}

function handleCustomIcon() {
  if ( searchQuery.value && searchQuery.value.includes( ":" ) ) {
    emit( "update:modelValue", searchQuery.value )
    isOpen.value = false
    searchQuery.value = ""
  }
}

function clearIcon() {
  emit( "update:modelValue", "" )
}
</script>

<template>
  <div class="relative">
    <!-- Selected Icon Display -->
    <UPopover
      v-model:open="isOpen"
      :disabled="disabled"
      mode="click"
      :content="{ side: 'bottom', align: 'start' }">
      <UButton
        color="neutral"
        variant="outline"
        class="w-full justify-between"
        :disabled="disabled">
        <span class="flex items-center gap-2">
          <Icon v-if="modelValue" :name="modelValue" class="size-4" />
          <span :class="{ 'text-muted': !modelValue }">{{ selectedIconLabel }}</span>
        </span>
        <Icon name="i-lucide-chevron-down" class="size-4" />
      </UButton>

      <template #content>
        <div class="w-72 p-3">
          <!-- Search Input -->
          <UInput
            v-model="searchQuery"
            placeholder="Cari icon atau ketik nama custom..."
            icon="i-lucide-search"
            class="mb-3 w-full"
            @keydown.enter="handleCustomIcon" />

          <!-- Custom Icon Hint -->
          <p v-if="searchQuery && searchQuery.includes(':')" class="text-xs text-muted mb-2">
            Tekan Enter untuk menggunakan: <code class="bg-muted px-1 rounded">{{ searchQuery }}</code>
          </p>

          <!-- Icon Grid -->
          <div class="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
            <button
              v-for="icon in filteredIcons"
              :key="icon.name"
              type="button"
              class="p-2 rounded hover:bg-elevated transition-colors flex items-center justify-center"
              :class="{ 'bg-primary/10 text-primary': modelValue === icon.name }"
              :title="icon.label"
              @click="selectIcon(icon.name)">
              <Icon :name="icon.name" class="size-5" />
            </button>
          </div>

          <!-- No Results -->
          <p v-if="filteredIcons.length === 0" class="text-sm text-muted text-center py-4">
            Tidak ada icon ditemukan. Ketik nama lengkap (contoh: fa7-solid:star) dan tekan Enter.
          </p>

          <!-- Clear Button -->
          <div v-if="modelValue" class="mt-3 pt-3 border-t border-default">
            <UButton
              color="error"
              variant="ghost"
              size="xs"
              class="w-full"
              icon="fa7-solid:trash"
              @click="clearIcon">
              Hapus Icon
            </UButton>
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>
