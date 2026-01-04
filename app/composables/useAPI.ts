/**
 * Custom fetch composable with centralized error handling
 * - Clears session and redirects to login on 401/UNAUTHORIZED
 */

export function useAPI<T>(
  url: string | ( () => string ),
  options: Parameters<typeof useFetch<T>>[1] = {},
) {
  const { clear } = useUserSession()
  const toast = useToast()

  return useFetch<T>( url, {
    ...options,
    async onResponseError( { response } ) {
      // Handle 401 Unauthorized
      if ( response.status === 401 ) {
        await clear()
        toast.add( {
          color       : "error",
          title       : "Sesi Berakhir",
          description : "Silakan masuk kembali.",
          icon        : "i-ph-warning",
        } )
        await navigateTo( "/login" )
        return
      }

      // Handle API-level UNAUTHORIZED error code  
      const data = response._data as Record<string, unknown> | undefined
      if ( ( data?.error as Record<string, unknown> )?.code === "UNAUTHORIZED" ) {
        await clear()
        toast.add( {
          color       : "error",
          title       : "Sesi Berakhir",
          description : "Silakan masuk kembali.",
          icon        : "i-ph-warning",
        } )
        await navigateTo( "/login" )
      }
    },
  } as Parameters<typeof useFetch<T>>[1] )
}
