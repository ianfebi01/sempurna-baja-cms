import { ObjectId } from "mongodb"
import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { defineApi, fail } from "~~/server/utils/api"
import { PAGE_COLLECTION } from "~~/server/models/page.schema"

export default defineApi( async ( event ) => {
  await requireRole( event, ["admin", "super-admin"] )

  const id = getRouterParam( event, "id" )

  if ( !id || !ObjectId.isValid( id ) ) {
    return fail( 400, "ID tidak valid", "BAD_REQUEST" )
  }

  const client = await clientPromise
  const db = client.db( DB_NAME )

  const existing = await db.collection( PAGE_COLLECTION ).findOne( { _id: new ObjectId( id ) } )

  if ( !existing ) {
    return fail( 404, "Halaman tidak ditemukan", "NOT_FOUND" )
  }

  await db.collection( PAGE_COLLECTION ).deleteOne( { _id: new ObjectId( id ) } )

  return { deleted: true }
} )
