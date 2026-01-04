import type { H3Error, H3Event } from "h3"
import { createError, setResponseStatus } from "h3"
import type { ZodError } from "zod"
import type { ApiError, ApiMeta, ApiSuccess } from "~~/shared/types"

export function baseMeta( event: H3Event ) {
  // eslint-disable-next-line no-underscore-dangle
  const start = event.context.__start ?? performance.now()
  return {
    requestId  : event.context.requestId as string,
    method     : event.node.req.method || "",
    path       : event.node.req.url || "",
    durationMs : Math.round( performance.now() - start ),
    ts         : new Date().toISOString(),
  } as ApiMeta
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isZodError( e: any ): e is ZodError {
  return e?.issues && Array.isArray( e.issues )
}

export function normalizeError( e: unknown ) {
  // Default
  let statusCode = 500
  let code = "INTERNAL_ERROR"
  let message = "Something went wrong"
  let details: unknown = undefined

  // H3 error
  if ( e && typeof e === "object" && ( e as H3Error ).statusCode ) {
    const he = e as H3Error
    statusCode = he.statusCode ?? 500
    message = he.statusMessage || message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code = ( he as any ).data?.code || code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details = ( he as any ).data?.details
    return { statusCode, code, message, details }
  }

  // Zod
  if ( isZodError( e ) ) {
    statusCode = 400
    code = "VALIDATION_ERROR"
    message = e.issues?.[0]?.message || "Invalid payload"
    details = e.issues
    return { statusCode, code, message, details }
  }

  // Generic Error
  if ( e instanceof Error ) {
    message = e.message || message
  }

  return { statusCode, code, message, details }
}

export function defineApi<T>(
  fn: ( event: H3Event ) => Promise<T> | T,
) {
  return defineEventHandler( async ( event ) => {
    try {
      const data = await fn( event )
      return {
        success : true,
        data,
        meta    : baseMeta( event ),
      } as ApiSuccess<T>
    } catch ( err ) {
      const { statusCode, code, message, details } = normalizeError( err )
      setResponseStatus( event, statusCode )
      return {
        success : false,
        error   : { code, message, details },
        meta    : baseMeta( event ),
      } as ApiError
    }
  } )
}

export function fail(
  statusCode: number,
  message: string,
  code = "ERROR",
  details?: unknown,
) {
  throw createError( {
    statusCode,
    statusMessage : message,
    data          : { code, details },
  } )
}

/**
 * Require specific role(s) for API access.
 * Returns 401 if not authenticated, 403 if role not allowed.
 */
export async function requireRole(
  event: H3Event,
  allowedRoles: string | string[],
): Promise<{ email: string; role: string }> {
  const { user } = await requireUserSession( event )
  if ( !user?.email || !user?.role ) {
    throw fail( 401, "Tidak diizinkan.", "UNAUTHORIZED" )
  }

  const roles = Array.isArray( allowedRoles ) ? allowedRoles : [allowedRoles]
  if ( !roles.includes( user.role as string ) ) {
    throw fail( 403, "Akses ditolak.", "FORBIDDEN" )
  }

  return { email: user.email, role: user.role as string }
}
