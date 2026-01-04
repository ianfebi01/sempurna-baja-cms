import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { USER_COLLECTION } from "~~/server/models/user.schema"

export default defineApi( async ( event ) => {
  await requireRole( event, "super-admin" )

  const client = await clientPromise
  if ( !client ) return fail( 500, "Koneksi database gagal", "INTERNAL_SERVER_ERROR" )
  const db = client.db( DB_NAME )

  const users = await db.collection( USER_COLLECTION )
    .find( {} )
    .project( {
      _id        : 1,
      email      : 1,
      name       : 1,
      picture    : 1,
      role       : 1,
      isApproved : 1,
      googleId   : 1,
    } )
    .sort( { email: 1 } )
    .toArray()

  // Ensure isApproved has a default value for existing users
  return users.map( ( u ) => ( {
    ...u,
    isApproved: u.isApproved !== false, // Default to true for existing users without the field
  } ) )
} )
