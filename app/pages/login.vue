<template>
  <UAuthForm
    :schema="schema"
    title="Masuk"
    description="Masuk ke akun Anda"
    icon="i-lucide-user"
    :fields="fields"
    @submit="onSubmit">
    <template #description>
      Belum punya akun? <ULink to="/register" class="text-primary font-medium">Daftar</ULink>.
    </template>
  </UAuthForm>
</template>

<script setup lang="ts">
import * as z from "zod"
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui"
import { useAuth } from "~/compossables/useAuth"
import type { ApiError, ApiSuccess, Login } from "~~/shared/types"

definePageMeta( {
    layout     : "auth",
    middleware : "auth",
} )

const toast = useToast()
const router = useRouter()

const fields: AuthFormField[] = [{
    name        : "email",
    type        : "email",
    label       : "Email",
    placeholder : "Masukkan email",
    required    : true,
}, {
    name        : "password",
    label       : "Password",
    type        : "password",
    placeholder : "Masukkan password",
    required    : true,
}]

const schema = z.object( {
    email    : z.email( "Email tidak valid" ),
    password : z.string( "Password tidak boleh kosong" ).min( 8, "Password minimal 8 karakter" ),
} )

type Schema = z.output<typeof schema>

async function onSubmit( payload: FormSubmitEvent<Schema> ) {
    const loginForm = payload.data
    await login( loginForm )
}

const { me } = useAuth()

async function login( loginForm: Schema ) {
    try {
        const data = await $fetch<ApiSuccess<Login> | ApiError>( "/api/auth/login", {
            method : "POST",
            body   : loginForm,
            retry  : 0,
        } )

        if ( data.success ) {
            await me()

            toast.add( {
                title       : "Berhasil Masuk",
                icon        : "i-ph-sign-in",
                description : `${data.data.user} berhasil masuk.`,
            } )
            router.replace( "/" )
        } else {
            // ApiError shape
            toast.add( {
                title       : "Gagal Masuk",
                description : data.error?.message ?? "Login gagal.",
                color       : "error",
            } )
        }
    } catch ( err: unknown ) {
        const error = err as { data: ApiError, status: number }
        if ( ( err as { data: ApiError, status: number } )?.status === 401 ) {
            toast.add( {
                title       : "Gagal Masuk",
                description : error?.data.error?.message ?? "Email atau password salah.",
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