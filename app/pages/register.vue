<template>
  <UAuthForm
    :schema="schema"
    title="Daftar"
    description="Buat akun"
    icon="i-lucide-user"
    :fields="fields"
    @submit="onSubmit" >
    <template #description>
      Sudah punya akun? <ULink to="/login" class="text-primary font-medium">Masuk</ULink>.
    </template>
  </UAuthForm>
</template>

<script setup lang="ts">
import * as z from "zod"
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui"
import { useAuth } from "~/compossables/useAuth"
import type { ApiError } from "~~/shared/types"

definePageMeta( {
    layout     : "auth",
    middleware : "auth",
} )

const toast = useToast()

const fields: AuthFormField[] = [{
    name        : "email",
    type        : "email",
    label       : "Email",
    placeholder : "Enter your email",
    required    : true,
}, {
    name        : "password",
    label       : "Password",
    type        : "password",
    placeholder : "Enter your password",
    required    : true,
}]

const schema = z.object( {
    email    : z.email( "Invalid email" ),
    password : z.string( "Password is required" ).min( 8, "Must be at least 8 characters" ),
} )

type Schema = z.output<typeof schema>

async function onSubmit( payload: FormSubmitEvent<Schema> ) {
    const registerForm = payload.data
    await register( registerForm )
}

const { me } = useAuth()
const router = useRouter()
const emit = defineEmits( ["onLogin", "onRegister", "onError"] )

async function register( registerForm: Schema ) {
    try {
        const data = await $fetch( "/api/auth/register", { method: "POST", body: registerForm } )
        if ( data.registered ) {
            await me()
            emit( "onRegister", data.user )
            router.replace( "/" )
            toast.add( {
                title       : "Berhasil Membuat Akun",
                icon        : "i-ph-sign-in",
                description : `${data.user} berhasil dibuat dan masuk.`,
            } )
        }
    } catch ( err: unknown ) {
        const error = err as { data: ApiError, status: number }
        if ( error.status === 403 ) {
            toast.add( {
                title       : "Gagal Membuat Akun",
                description : error?.data.error?.message ?? "Email tidak diizinkan untuk mendaftar.",
                color       : "error",
            } )
        } else {
            toast.add( {
                title       : "Error",
                description : error?.data.error?.message ?? "Terjadi kesalahan pada server.",
                color       : "error",
            } )
        }
    }
}
</script>