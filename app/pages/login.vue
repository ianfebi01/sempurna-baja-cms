<template>
  <UAuthForm
    title="Masuk"
    description="Masuk ke akun Anda"
    icon="i-lucide-user"
    :providers="providers" />
    <pre>{{ user }}</pre>
</template>

<script setup lang="ts">
definePageMeta( {
    layout     : "auth",
    middleware : "auth",
} )

const toast = useToast()

const { openInPopup, user } = useUserSession()

const providers = [{
    label   : "Google",
    icon    : "i-simple-icons-google",
    onClick : () => {
        openInPopup( "/api/auth/google" )
    },
},
]
</script>