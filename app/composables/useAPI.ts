import type { UseFetchOptions } from "nuxt/app"

/**
 * Custom useFetch wrapper that uses the $api instance with 401 handling
 */
export function useAPI<T>(
  url: string | ( () => string ),
  options?: UseFetchOptions<T>,
) {
  return useFetch( url, {
    ...options,
    $fetch: useNuxtApp().$api as typeof $fetch,
  } )
}
