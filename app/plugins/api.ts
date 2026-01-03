export default defineNuxtPlugin( ( nuxtApp ) => {
  const api = $fetch.create( {
    async onResponse( { response } ) {
      // Handle API wrapper returning success: false with UNAUTHORIZED
      // Your defineApi wrapper returns 200 OK with { success: false, error: { code: 'UNAUTHORIZED' } }
      const data = response._data
      if (
        data &&
        data.success === false &&
        data.error?.code === "UNAUTHORIZED"
      ) {
        const { clear } = useUserSession()
        await clear()
        await nuxtApp.runWithContext( () => navigateTo( "/login" ) )
      }
    },
    async onResponseError( { response } ) {
      // Handle actual HTTP 401 status (e.g., from requireUserSession throwing before defineApi catches it)
      if ( response.status === 401 ) {
        const { clear } = useUserSession()
        await clear()
        await nuxtApp.runWithContext( () => navigateTo( "/login" ) )
      }
    },
  } )

  return {
    provide: {
      api,
    },
  }
} )

