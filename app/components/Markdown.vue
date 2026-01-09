<script setup lang="ts">
import type { EditorToolbarItem } from "@nuxt/ui"

const props = defineProps<{
  modelValue?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string]
  blur: []
}>()

// Use a local ref for better TipTap reactivity with empty strings
const localValue = ref( props.modelValue ?? "" )

// Sync from parent to local (when parent changes externally)
watch( () => props.modelValue, ( newVal ) => {
  if ( newVal !== localValue.value ) {
    localValue.value = newVal ?? ""
  }
} )

// Sync from local to parent (when user types)
watch( localValue, ( newVal ) => {
  emit( "update:modelValue", newVal )
} )

const items = [ [{
    icon    : "i-lucide-heading",
    content : {
        align: "start",
    },
    items: [{
        kind  : "heading",
        level : 1,
        icon  : "i-lucide-heading-1",
        label : "Heading 1",
    }, {
        kind  : "heading",
        level : 2,
        icon  : "i-lucide-heading-2",
        label : "Heading 2",
    }, {
        kind  : "heading",
        level : 3,
        icon  : "i-lucide-heading-3",
        label : "Heading 3",
    }, {
        kind  : "heading",
        level : 4,
        icon  : "i-lucide-heading-4",
        label : "Heading 4",
    }],
}], [{
    kind : "mark",
    mark : "bold",
    icon : "i-lucide-bold",
}, {
    kind : "mark",
    mark : "italic",
    icon : "i-lucide-italic",
}, {
    kind : "mark",
    mark : "underline",
    icon : "i-lucide-underline",
}, {
    kind : "mark",
    mark : "strike",
    icon : "i-lucide-strikethrough",
}, {
    kind : "mark",
    mark : "code",
    icon : "i-lucide-code",
}]] satisfies EditorToolbarItem[][]

function handleBlur() {
  emit( "blur" )
}
</script>

<template>
  <ClientOnly>
    <UEditor
      v-slot="{ editor }"
      v-model="localValue"
      :content-type="localValue ? 'markdown' : undefined"
      :ui="{ base: 'p-2 sm:p-4' }"
      class="w-full min-h-74 border border-muted rounded-lg bg-background"
      @blur="handleBlur">
      <UEditorToolbar
        :editor="editor"
        :items="items"
        class="border-b border-muted py-2 px-2 sm:px-4 overflow-x-auto" />
    </UEditor>
  </ClientOnly>
</template>
