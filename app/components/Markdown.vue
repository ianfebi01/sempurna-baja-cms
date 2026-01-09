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

// Local value synced with modelValue
const value = computed( {
  get: () => props.modelValue || "",
  set: ( val: string ) => emit( "update:modelValue", val ),
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
  <UEditor
    v-slot="{ editor }"
    v-model="value"
    content-type="markdown"
    :ui="{ base: 'p-2 sm:p-4' }"
    class="w-full min-h-74 border border-muted rounded-lg bg-background"
    @blur="handleBlur">
    <UEditorToolbar
      :editor="editor"
      :items="items"
      class="border-b border-muted py-2 px-2 sm:px-4 overflow-x-auto" />
  </UEditor>
</template>
