import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { defineApi, fail } from "~~/server/utils/api"
import { ObjectId } from "mongodb"

export default defineApi( async ( event ) => {
  // Require auth
  const me = await requireAuth( event )
  const email = me?.email
  if ( !email ) {
    return fail( 401, "Unauthorized", "UNAUTHORIZED" )
  }

  // Get Id
  const id = event.context.params?.id
  if ( !id || !ObjectId.isValid( id ) ) {
    return fail( 400, "Produk tidak valid", "BAD_REQUEST" )
  }

  const client = await clientPromise
  if ( !client ) {
    return fail( 500, "Koneksi database gagal", "INTERNAL_SERVER_ERROR" )
  }
  const db = client.db( DB_NAME )

  // Delete
  const deleted = await db.collection( "products" ).findOneAndDelete( { _id: new ObjectId( id ) } )
  const deletedDoc = deleted?.value
  if ( !deletedDoc ) {
    return fail( 404, "Produk tidak ditemukan", "NOT_FOUND" )
  }

  return deletedDoc
} )
