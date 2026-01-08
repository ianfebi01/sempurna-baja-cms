import { defineVitestConfig } from "@nuxt/test-utils/config"

export default defineVitestConfig( {
  test: {
    environment : "nuxt",
    globals     : true,
    include     : ["tests/**/*.test.ts"],
    coverage    : {
      provider  : "v8",
      reporter  : ["text", "html"],
      include   : ["server/utils/**", "shared/utils/**", "app/composables/**"],
      exclude   : ["node_modules", "tests", ".nuxt"],
    },
  },
} )
