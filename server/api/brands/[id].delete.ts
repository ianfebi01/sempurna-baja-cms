import { defineApi, fail } from "~~/server/utils/api"
import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { ObjectId } from "mongodb"

export default defineApi( async ( event ) => {
  const { user } = await requireUserSession( event )
  const email = user?.email
  if ( !email ) return fail( 401, "Unauthorized", "UNAUTHORIZED" )

  const id = event.context.params?.id
  if ( !id || !ObjectId.isValid( id ) ) return fail( 400, "Kategori tidak valid", "BAD_REQUEST" )

  const client = await clientPromise
  if ( !client ) return fail( 500, "Koneksi database gagal", "INTERNAL_SERVER_ERROR" )
  const db = client.db( DB_NAME )

  const usedByProduct = await db.collection( "products" ).findOne( { brand: new ObjectId( id ) } )
  if ( usedByProduct ) return fail( 400, "Brand sedang digunakan oleh produk lain", "BRAND_IN_USE" )

  const deleted = await db.collection( "brands" ).findOneAndDelete( { _id: new ObjectId( id ) } )
  const deletedDoc = deleted?.value
  if ( !deletedDoc ) return fail( 404, "Brand tidak ditemukan", "NOT_FOUND" )

  return deletedDoc
} )
