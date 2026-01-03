<template>
    <UAuthForm title="Masuk" description="Masuk ke akun Anda" icon="i-lucide-user" :providers="providers" />
</template>

<script setup lang="ts">
definePageMeta({
    layout: "auth",
    middleware: "auth",
})

const toast = useToast()

const { openInPopup } = useUserSession()

const providers = [{
    label: 'Google',
    icon: 'i-simple-icons-google',
    onClick: () => {
        openInPopup('/api/auth/google')
    }
}
]
</script>