import type { H3Event } from "h3"
import { _useSession } from "./session"
import { createJWT, verifyJWT } from "./jwt"
import type { Role } from "#shared/types"

export async function getAuth( event: H3Event ) {
  //  return getCookie(event, 'authorization')
  const token = ( await _useSession( event ) ).data.email
  if ( !token ) return undefined
  try {
    return await verifyJWT( token )
  } catch {
    return undefined
  }
}

export async function setAuth( event: H3Event, email: string, role?: Role ) {
  const token = await createJWT( email, role )
  // return setCookie(event, 'authorization', token)
  return await _useSession( event, token )
}

export async function clearAuth( event: H3Event ) {
  // return deleteCookie(event, 'authorization')
  return ( await _useSession( event ) ).clear()
}

export async function requireAuth( event: H3Event ) {
  const payload = await getAuth( event )

  if ( !payload ) {
    throw createError( {
      statusCode : 401,
      statusText : "Unauthorized! token invalid.",
    } )
  }

  return payload
}

export async function requireRole( event: H3Event, roles: Role | Role[] ) {
  const me = await requireAuth( event )
  const allowed = Array.isArray( roles ) ? roles : [ roles ]
  if ( !me?.role || !allowed.includes( me.role as Role ) ) {
    throw createError( {
      statusCode    : 403,
      statusMessage : "Forbidden: insufficient role",
    } )
  }
  return me
}
