<script setup lang="ts">
import { generateFieldSchema, type FieldDefinition } from "~~/shared/utils/fieldDefinitions"

const props = defineProps<{
  fields: FieldDefinition[]
  modelValue: Record<string, unknown>
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, unknown>]
}>()

const toast = useToast()

// Track field errors
const fieldErrors = ref<Record<string, string>>( {} )

// Get field definition by name
function getFieldByName( fieldName: string ): FieldDefinition | undefined {
  return props.fields.find( ( f ) => f.name === fieldName )
}

// Validate a single field on blur
function validateField( fieldName: string ) {
  const field = getFieldByName( fieldName )
  if ( !field ) return

  const fieldSchema = generateFieldSchema( field )
  const value = props.modelValue[fieldName]
  const result = fieldSchema.safeParse( value )

  if ( !result.success ) {
    // Zod 4 uses .issues instead of .errors
    const issues = result.error?.issues || []
    fieldErrors.value[fieldName] = issues[0]?.message || "Nilai tidak valid"
  } else {
    const { [fieldName]: _, ...rest } = fieldErrors.value
    fieldErrors.value = rest
  }
}

// Clear error when field value changes
function updateField( name: string, value: unknown ) {
  // Clear error on change
  if ( fieldErrors.value[name] ) {
    const { [name]: _, ...rest } = fieldErrors.value
    fieldErrors.value = rest
  }
  emit( "update:modelValue", { ...props.modelValue, [name]: value } )
}

function updateArrayItem( fieldName: string, index: number, value: Record<string, unknown> ) {
  const array = [...( props.modelValue[fieldName] as Record<string, unknown>[] || [] )]
  array[index] = value
  emit( "update:modelValue", { ...props.modelValue, [fieldName]: array } )
}

function addArrayItem( fieldName: string, arrayFields: FieldDefinition[] ) {
  const array = [...( props.modelValue[fieldName] as Record<string, unknown>[] || [] )]
  const newItem: Record<string, unknown> = {}
  for ( const field of arrayFields ) {
    newItem[field.name] = field.default ?? ( field.type === "number" ? 0 : "" )
  }
  array.push( newItem )
  emit( "update:modelValue", { ...props.modelValue, [fieldName]: array } )
}

function removeArrayItem( fieldName: string, index: number ) {
  const array = [...( props.modelValue[fieldName] as Record<string, unknown>[] || [] )]
  array.splice( index, 1 )
  emit( "update:modelValue", { ...props.modelValue, [fieldName]: array } )
}

// Track uploading and pending files per field
const uploadingFields = ref<Set<string>>( new Set() )
const pendingFiles = ref<Record<string, File | undefined>>( {} )

// Watch for file changes and upload
watch( pendingFiles, async ( files ) => {
  for ( const fieldName in files ) {
    const file = files[fieldName]
    if ( file && !uploadingFields.value.has( fieldName ) ) {
      await uploadImage( fieldName, file )
      pendingFiles.value[fieldName] = undefined
    }
  }
}, { deep: true } )

async function uploadImage( fieldName: string, file: File ) {
  uploadingFields.value.add( fieldName )

  try {
    const formData = new FormData()
    formData.append( "file", file )

    const response = await useNuxtApp().$api<{ url: string }>( "/api/upload", {
      method : "POST",
      body   : formData,
    } )

    console.log( "Upload response:", response )

    if ( response?.url ) {
      updateField( fieldName, response.url )
      // Clear any image validation error after successful upload
      if ( fieldErrors.value[fieldName] ) {
        const { [fieldName]: _, ...rest } = fieldErrors.value
        fieldErrors.value = rest
      }
      toast.add( { title: "Sukses", description: "Gambar berhasil diunggah", color: "success" } )
    } else {
      console.error( "No URL in response:", response )
      toast.add( { title: "Gagal", description: "URL gambar tidak ditemukan", color: "error" } )
    }
  } catch ( error ) {
    console.error( "Upload error:", error )
    toast.add( { title: "Gagal", description: "Gagal mengunggah gambar", color: "error" } )
  } finally {
    uploadingFields.value.delete( fieldName )
  }
}

function clearImage( fieldName: string ) {
  updateField( fieldName, "" )
  // Validate after clearing to show required error if applicable
  nextTick( () => validateField( fieldName ) )
}
</script>

<template>
  <div class="space-y-4">
    <template v-for="field in fields" :key="field.name">
      <!-- Text Input -->
      <UFormField
        v-if="field.type === 'text'"
        :label="field.label"
        :name="field.name"
        :required="field.required"
        :error="fieldErrors[field.name]">
        <UInput
          :model-value="(modelValue[field.name] as string) || ''"
          :placeholder="field.placeholder"
          :disabled="disabled"
          class="w-full"
          @update:model-value="updateField(field.name, $event)"
          @blur="validateField(field.name)" />
      </UFormField>

      <!-- Textarea -->
      <UFormField
        v-else-if="field.type === 'textarea'"
        :label="field.label"
        :name="field.name"
        :required="field.required"
        :error="fieldErrors[field.name]">
        <UTextarea
          :model-value="(modelValue[field.name] as string) || ''"
          :placeholder="field.placeholder"
          :disabled="disabled"
          class="w-full"
          @update:model-value="updateField(field.name, $event)"
          @blur="validateField(field.name)" />
      </UFormField>

      <!-- URL Input -->
      <UFormField
        v-else-if="field.type === 'url'"
        :label="field.label"
        :name="field.name"
        :required="field.required"
        :error="fieldErrors[field.name]">
        <UInput
          :model-value="(modelValue[field.name] as string) || ''"
          :placeholder="field.placeholder || 'https://'"
          :disabled="disabled"
          class="w-full"
          @update:model-value="updateField(field.name, $event)"
          @blur="validateField(field.name)" />
      </UFormField>

      <!-- Number Input -->
      <UFormField
        v-else-if="field.type === 'number'"
        :label="field.label"
        :name="field.name"
        :required="field.required"
        :error="fieldErrors[field.name]">
        <UInputNumber
          :model-value="(modelValue[field.name] as number) || 0"
          :min="field.min"
          :max="field.max"
          :disabled="disabled"
          class="w-full"
          @update:model-value="updateField(field.name, $event)"
          @blur="validateField(field.name)" />
      </UFormField>

      <!-- Image Upload -->
      <UFormField
        v-else-if="field.type === 'image'"
        :label="field.label"
        :name="field.name"
        :required="field.required"
        :error="fieldErrors[field.name]">
        <div class="space-y-3">
          <!-- Show preview if already uploaded -->
          <div v-if="modelValue[field.name]" class="mb-2 relative w-full max-w-xs aspect-square">
            <img
              :src="(modelValue[field.name] as string)"
              alt="Preview"
              class="w-full h-full object-cover rounded border border-muted" />

            <UButton
              icon="lucide:x"
              color="neutral"
              size="xs"
              variant="link"
              class="font-medium inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors text-xs gap-1 text-inverted bg-inverted hover:bg-inverted/90 active:bg-inverted/90 disabled:bg-inverted aria-disabled:bg-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inverted absolute -top-1.5 -end-1.5 p-0 rounded-full border-2 border-bg"
              :disabled="disabled"
              @click="clearImage(field.name)" />

          </div>

          <!-- Upload button if no image -->
          <UFileUpload
            v-else
            v-model="pendingFiles[field.name]"
            accept="image/*"
            :max-files="1"
            label="Pilih gambar"
            description="PNG, JPG, atau WEBP (maks 2 MB)"
            class="w-full max-w-xs aspect-square"
            :disabled="disabled || uploadingFields.has(field.name)" />

          <!-- Loading state -->
          <div v-if="uploadingFields.has(field.name)" class="flex items-center gap-2 text-sm text-muted">
            <UIcon name="i-lucide-loader-2" class="animate-spin" />
            <span>Mengunggah...</span>
          </div>
        </div>
      </UFormField>

      <!-- Icon Selector -->
      <UFormField
        v-else-if="field.type === 'icon'"
        :label="field.label"
        :name="field.name"
        :required="field.required"
        :error="fieldErrors[field.name]">
        <IconSelector
          :model-value="(modelValue[field.name] as string) || ''"
          :disabled="disabled"
          @update:model-value="updateField(field.name, $event)" />
      </UFormField>

      <!-- Array (nested items) -->
      <div v-else-if="field.type === 'array'" class="border border-default rounded-lg p-4">
        <div class="flex items-center justify-between mb-4">
          <p class="font-medium">{{ field.label }}</p>
          <UButton
            size="xs"
            color="primary"
            variant="soft"
            icon="i-lucide-plus"
            :disabled="disabled"
            @click="addArrayItem(field.name, field.arrayFields!)">
            Tambah
          </UButton>
        </div>

        <div
          v-for="(item, idx) in (modelValue[field.name] as Record<string, unknown>[])"
          :key="idx"
          class="border-b border-default pb-4 mb-4 last:border-b-0 last:mb-0 last:pb-0">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-muted">Item {{ idx + 1 }}</span>
            <UButton
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              :disabled="disabled || (modelValue[field.name] as Record<string, unknown>[]).length <= 1"
              @click="removeArrayItem(field.name, idx)" />
          </div>
          <DynamicForm
            :fields="field.arrayFields!"
            :model-value="item"
            :disabled="disabled"
            @update:model-value="updateArrayItem(field.name, idx, $event)" />
        </div>

        <p
          v-if="!(modelValue[field.name] as Record<string, unknown>[])?.length"
          class="text-sm text-muted text-center py-4">
          Belum ada item. Klik "Tambah" untuk menambahkan.
        </p>
      </div>
    </template>
  </div>
</template>
