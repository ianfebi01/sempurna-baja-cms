import { defineApi, fail } from "~~/server/utils/api"

export default defineApi( async ( event ) => {
  await requireRole( event, ["admin", "super-admin"] )

  const config = useRuntimeConfig()
  const deployHookUrl = config.deployHook

  if ( !deployHookUrl ) {
    return fail( 500, "Deploy hook URL tidak dikonfigurasi.", "CONFIGURATION_ERROR" )
  }

  try {
    const response = await $fetch( deployHookUrl, {
      method: "POST",
    } )

    return {
      message : "Deploy berhasil dipicu.",
      result  : response,
    }
  } catch ( error ) {
    console.error( "Deploy hook error:", error )
    return fail( 500, "Gagal memicu deploy.", "DEPLOY_HOOK_ERROR" )
  }
} )
