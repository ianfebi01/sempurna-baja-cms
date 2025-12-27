import type { AuthPayload } from "#shared/types"
import type { H3Event } from "h3"

const { mongo } = useRuntimeConfig().auth

// eslint-disable-next-line no-underscore-dangle
export async function _useSession( event: H3Event, token?: string ) {
  const session = await useSession( event, {
    password : mongo.secret,
    name     : "authorization",
  } )
  if ( token )
    await session.update( { email: token } )
  return {
    ...session,
    data: session.data as AuthPayload,
  }
}