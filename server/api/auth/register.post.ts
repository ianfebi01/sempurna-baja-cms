import bcrypt from "bcryptjs"
import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { ALLOWLIST_COLLECTION } from "~~/server/models/allowlist.schema"
import { USER_COLLECTION } from "~~/server/models/user.schema"
import type { Role } from "~~/server/models/allowlist.schema"

export default defineEventHandler( async ( event ) => {
  // Connect DB
  const client = await clientPromise

  if ( !client ) {
    return fail( 500, "Koneksi database gagal" )
  }

  const db = client.db( DB_NAME )
  
  // TODO: use validation
  const { email, password, ...rest } = await readBody( event )

  // Normalize email
  const emailNorm = String( email ).trim().toLowerCase()

  // Determine if bootstrap (first user)
  const usersCount = await db.collection( USER_COLLECTION ).countDocuments( {} )
  let role: Role = "admin"

  if ( usersCount === 0 ) {
    // First user becomes super-admin and implicitly allowed
    role = "super-admin"
    await db.collection( ALLOWLIST_COLLECTION ).updateOne(
      { email: emailNorm },
      { $setOnInsert: { email: emailNorm, role } },
      { upsert: true },
    )
  } else {
    // Require pre-approved email in DB allowlist for subsequent users
    const allowed = await db.collection( ALLOWLIST_COLLECTION ).findOne( { email: emailNorm } )
    if ( !allowed ) {
      throw createError( {
        statusCode    : 403,
        statusMessage : "Email tidak diizinkan untuk mendaftar.",
      } )
    }
    const allowedRole = ( allowed as { role?: Role } ).role
    role = allowedRole ?? "admin"
  }

  const hashed = bcrypt.hashSync( password, 10 )

  try {
    const res = await db.collection( USER_COLLECTION ).insertOne( { email: emailNorm, password: hashed, role, ...rest } )
    console.log( res )
  } catch ( error ) {
    console.log( error )
    throw createError( {
      statusMessage: "Pengguna sudah terdaftar.",
    } )
  }

  await setAuth( event, emailNorm, role )

  return {
    registered : true,
    user       : emailNorm as string,
    role,
  }
} )