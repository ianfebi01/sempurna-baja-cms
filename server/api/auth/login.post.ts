import bcrypt from "bcryptjs"
import z from "zod"
import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { ALLOWLIST_COLLECTION } from "~~/server/models/allowlist.schema"

const errorMessage = "Email atau password salah."

export default defineApi( async ( event ) => {
  // Connect DB
  const client = await clientPromise

  if ( !client ) {
    return fail( 500, "Koneksi database gagal" )
  }
  const db = client.db( DB_NAME )

  const { email, password } = await readBody( event )

  const schema = z.object( {
    email    : z.email( "Email tidak valid" ),
    password : z.string( "Password tidak boleh kosong" ).min( 8, "Password harus terdiri dari minimal 8 karakter" ),
  } )

  const result = schema.safeParse( { email, password } )

  if ( !result.success ) {
    const first = result.error.issues[0]
    throw createError( { statusCode: 400, statusMessage: first.message } )
  }

  // Normalize and enforce allowlist from DB
  const emailNorm = String( email ).trim().toLowerCase()
  const allowed = await db.collection( ALLOWLIST_COLLECTION ).findOne( { email: emailNorm } )
  if ( !allowed ) {
    return fail( 403, "Email tidak diizinkan untuk masuk" )
  }

  const user = await db.collection( "users" ).findOne( { email: emailNorm } )

  if ( !user ) {
    return fail( 401, "Pengguna tidak ditemukan" )
  }

  const matches = await bcrypt.compare( password, user.password )

  if ( !matches ) {
    return fail( 401, errorMessage )
  }

  const role = user.role ?? allowed.role ?? "admin"
  await setAuth( event, user.email, role )

  return {
    loggedIn : true,
    user     : user.email as string,
    role,
  }
} )
