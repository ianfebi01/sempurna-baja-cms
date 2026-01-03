import { createError } from "h3"
import * as z from "zod"
import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { defineApi, fail } from "~~/server/utils/api"

export default defineApi( async ( event ) => {
  const { user } = await requireUserSession( event )
  const email = user?.email
  if ( !email ) return fail( 401, "Tidak diizinkan.", "UNAUTHORIZED" )

  const body = await readBody( event )
  if ( !body ) return fail( 400, "Data tidak valid.", "BAD_REQUEST" )

  const schema = z.object( {
    name : z.string().min( 2, "Nama terlalu pendek" ),
    slug : z.string().min( 2, "Slug terlalu pendek" )
      .max( 100, "Slug maksimal 100 karakter" )
      .regex( /^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda minus. Tidak boleh diawali/diakhiri dengan '-' atau ada '--'" ),
  } )
  const parsed = schema.safeParse( body )
  if ( !parsed.success ) {
    const first = parsed.error.issues[0]
    throw createError( { statusCode: 400, statusMessage: first.message } )
  }

  const client = await clientPromise
  if ( !client ) return fail( 500, "Koneksi database gagal", "INTERNAL_SERVER_ERROR" )
  const db = client.db( DB_NAME )

  const existing = await db.collection( "brands" ).findOne( { slug: parsed.data.slug } )
  if ( existing ) return fail( 409, `Slug "${parsed.data.slug}" sudah digunakan.` )

  const res = await db.collection( "brands" ).insertOne( { name: parsed.data.name, slug: parsed.data.slug } )
  const brand = await db.collection( "brands" ).findOne( { _id: res.insertedId } )

  return brand
} )
