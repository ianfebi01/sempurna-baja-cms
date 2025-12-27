import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { defineApi, fail } from "~~/server/utils/api"

export default defineApi( async () => {
  const client = await clientPromise
  if ( !client ) return fail( 500, "Koneksi database gagal", "INTERNAL_SERVER_ERROR" )
  const db = client.db( DB_NAME )

  const brands = await db.collection( "brands" ).find( {} ).toArray()
  if ( !brands ) return fail( 500, "Gagal mengambil data brand.", "INTERNAL_SERVER_ERROR" )

  return brands
} )