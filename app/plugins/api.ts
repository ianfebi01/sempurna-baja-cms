/**
 * Custom $api plugin with centralized error handling
 * - Provides $api as a drop-in replacement for $fetch
 * - Clears session and redirects to login on 401/UNAUTHORIZED
 */
export default defineNuxtPlugin( () => {
  const { clear } = useUserSession()
  const toast = useToast()

  const api = $fetch.create( {
    onResponseError: async ( { response } ) => {
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
      const data = response._data
      if ( data?.error?.code === "UNAUTHORIZED" ) {
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
    },
  } )

  return {
    provide: {
      api,
    },
  }
} )
