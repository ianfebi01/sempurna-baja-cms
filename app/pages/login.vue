<template>
  <UAuthForm
    title="Masuk"
    description="Masuk ke akun Anda"
    icon="i-lucide-user"
    :providers="providers" />
</template>

<script setup lang="ts">
definePageMeta( {
    layout     : "auth",
    middleware : "auth",
} )

const toast = useToast()
const router = useRouter()

const { openInPopup, loggedIn } = useUserSession()

// Watch for login state changes (e.g., after OAuth popup completes)
watch( loggedIn, ( isLoggedIn ) => {
    if ( isLoggedIn ) {
        // Clear any lingering toasts (e.g., logout toast from previous session)
        toast.clear()
        toast.add( {
            color       : "success",
            title       : "Berhasil!",
            icon        : "i-ph-check-circle",
            description : "Anda berhasil masuk.",
        } )
        router.replace( "/" )
    }
} )

const providers = [{
    label   : "Google",
    icon    : "i-simple-icons-google",
    onClick : () => {
        openInPopup( "/api/auth/google" )
    },
},
]
</script>