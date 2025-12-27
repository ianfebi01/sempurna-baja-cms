import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { ALLOWLIST_COLLECTION } from "~~/server/models/allowlist.schema"

export default defineApi( async ( event ) => {
  await requireRole( event, [ "admin", "super-admin" ] )

  const client = await clientPromise
  if ( !client ) return fail( 500, "Koneksi database gagal", "INTERNAL_SERVER_ERROR" )
  const db = client.db( DB_NAME )

  const list = await db.collection( ALLOWLIST_COLLECTION ).find( {} ).sort( { email: 1 } ).toArray()
  return list
} )
