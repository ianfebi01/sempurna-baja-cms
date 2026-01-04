import { ObjectId } from "mongodb"
import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { USER_COLLECTION } from "~~/server/models/user.schema"
import z from "zod"

export default defineApi( async ( event ) => {
  const { email: currentUserEmail } = await requireRole( event, "super-admin" )

  const client = await clientPromise
  if ( !client ) return fail( 500, "Koneksi database gagal", "INTERNAL_SERVER_ERROR" )
  const db = client.db( DB_NAME )

  // Validate request body
  const body = await readBody( event )
  const schema = z.object( {
    isApproved: z.boolean(),
  } )
  const { isApproved } = schema.parse( body )

  // Get user ID from route params
  const id = getRouterParam( event, "id" )
  if ( !id || !ObjectId.isValid( id ) ) {
    return fail( 400, "ID pengguna tidak valid", "BAD_REQUEST" )
  }

  // Fetch the target user
  const targetUser = await db.collection( USER_COLLECTION ).findOne( { _id: new ObjectId( id ) } )
  if ( !targetUser ) {
    return fail( 404, "Pengguna tidak ditemukan", "NOT_FOUND" )
  }

  // Prevent super-admin from modifying their own approval status
  if ( currentUserEmail.toLowerCase() === targetUser.email?.toLowerCase() ) {
    return fail( 403, "Tidak boleh mengubah status approval sendiri", "FORBIDDEN" )
  }

  // Update approval status
  await db.collection( USER_COLLECTION ).updateOne(
    { _id: new ObjectId( id ) },
    { $set: { isApproved } },
  )

  return { 
    _id: id, 
    email: targetUser.email, 
    isApproved,
    message: isApproved ? "Pengguna diaktifkan" : "Pengguna dinonaktifkan",
  }
} )
