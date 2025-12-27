import { useAuth } from "~/compossables/useAuth"

export default defineNuxtPlugin( {
  name: "sempurna-baja-auth-plugin",
  async setup() {
    try {
      await useAuth().me()
    } catch {
      // Swallow 401/expired token errors during plugin init
    }
  },
} )
