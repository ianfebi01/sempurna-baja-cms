<script setup lang="ts">
const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits( ["update:modelValue"] )

const toast = useToast()
const preview = ref( props.modelValue || "" )
const uploading = ref( false )
const file = ref<File | null>( null )

async function handleUpload() {
  if ( !file.value ) return

  const maxSizeMB = 4
  if ( file.value.size > maxSizeMB * 1024 * 1024 ) {
    toast.add( {
      title       : "File terlalu besar",
      description : `Ukuran maksimum ${maxSizeMB} MB`,
      color       : "error",
    } )
    file.value = null
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append( "file", file.value )

    const res = await useNuxtApp().$api<{ url: string }>( "/api/upload", {
      method : "POST",
      body   : formData,
    } )

    preview.value = res.url
    emit( "update:modelValue", res.url )
    toast.add( {
      title       : "Upload berhasil",
      description : "Gambar berhasil diunggah",
      color       : "success",
    } )
  } catch ( error: unknown ) {
    const err = error as Error
    toast.add( {
      title       : "Upload gagal",
      description : err.message,
      color       : "error",
    } )
  } finally {
    uploading.value = false
  }
}

watch( file,( newVal )=>{
    if( !newVal ){
        emit( "update:modelValue", "" )
    }
} )
</script>

<template>
  <div class="space-y-3 relative">
    <UFileUpload
      v-model="file"
      accept="image/*"
      :max-files="1"
      label="Pilih gambar"
      description="PNG, JPG, atau WEBP (maks 4 MB)"
      :disabled="uploading"
      class="w-full max-w-xs aspect-square"
      @change.stop.prevent="handleUpload"
    />
    <div
      class="absolute w-full max-w-xs aspect-square left-0 top-0 flex items-center justify-center bg-black/70 pointer-events-none rounded-lg"
      :class="{
        'opacity-100': uploading,
        'opacity-0': !uploading,

      }">
      <Icon name="i-lucide-loader" class="animate-spin text-white" size="40px"/>
    </div>
  </div>
</template>
