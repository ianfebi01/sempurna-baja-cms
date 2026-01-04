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
const route = useRoute()

const { openInPopup, loggedIn } = useUserSession()

// Error message mapping
const errorMessages: Record<string, string> = {
    not_allowed   : "Anda tidak memiliki izin untuk masuk. Hubungi administrator.",
    oauth_failed  : "Gagal masuk dengan Google. Silakan coba lagi.",
    db_connection : "Terjadi kesalahan koneksi. Silakan coba lagi nanti.",
}

// Show error toast helper
function showError( errorCode: string ) {
    toast.add( {
        color       : "error",
        title       : "Gagal Masuk",
        icon        : "i-ph-x-circle",
        description : errorMessages[errorCode] || "Terjadi kesalahan. Silakan coba lagi.",
    } )
}

// Listen for error messages from OAuth popup
function handleOAuthMessage( event: MessageEvent ) {
    if ( event.origin !== window.location.origin ) return
    if ( event.data?.type === "oauth-error" && event.data?.error ) {
        showError( event.data.error )
    }
}

onMounted( () => {
    // Listen for postMessage from popup
    window.addEventListener( "message", handleOAuthMessage )

    // Handle error from direct redirect (fallback)
    const error = route.query.error as string
    if ( error ) {
        showError( error )
        router.replace( { query: {} } )
    }
} )

onUnmounted( () => {
    window.removeEventListener( "message", handleOAuthMessage )
} )

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