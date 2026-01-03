export default defineNuxtRouteMiddleware( ( to ) => {
  const { loggedIn } = useUserSession()

  const authPages = ["/login", "/register"]

  // Redirect logged-in users away from login/register
  if ( authPages.includes( to.path ) && loggedIn.value )
    return navigateTo( "/" )

  // Redirect guests away from protected routes like /auth
  if ( !loggedIn.value && !authPages.includes( to.path ) )
    return navigateTo( "/login" )
} )
