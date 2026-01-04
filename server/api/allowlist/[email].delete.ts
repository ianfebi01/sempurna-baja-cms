import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { ALLOWLIST_COLLECTION } from "~~/server/models/allowlist.schema"

export default defineApi( async ( event ) => {
  const { user } = await requireUserSession( event )
  if ( !user?.email || user?.role !== "super-admin" ) return fail( 401, "Tidak diizinkan.", "UNAUTHORIZED" )

  const email = event.context.params?.email
  if ( !email ) return fail( 400, "Email tidak valid", "BAD_REQUEST" )
  const emailNorm = String( email ).trim().toLowerCase()

  // Prevent super-admin from deleting their own allowlist entry
  if ( user?.email && user.email.toLowerCase() === emailNorm ) {
    return fail( 403, "Tidak boleh menghapus email sendiri", "FORBIDDEN" )
  }

  const client = await clientPromise
  if ( !client ) return fail( 500, "Koneksi database gagal", "INTERNAL_SERVER_ERROR" )
  const db = client.db( DB_NAME )

  await db.collection( ALLOWLIST_COLLECTION ).deleteOne( { email: emailNorm } )
  return { deleted: true }
} )
