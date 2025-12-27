import { defineApi, fail } from "~~/server/utils/api"
import z from "zod"
import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { ObjectId } from "mongodb"

export default defineApi( async ( event ) => {
  const me = await requireAuth( event )
  const email = me?.email
  if ( !email ) return fail( 401, "Tidak diizinkan.", "UNAUTHORIZED" )

  const id = event.context.params?.id
  if ( !id || !ObjectId.isValid( id ) ) return fail( 400, "ID kategori tidak valid.", "BAD_REQUEST" )

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

  const existing = await db.collection( "categories" ).findOne( { slug: parsed.data.slug } )
  if ( existing ) {
    const { _id: existingId } = existing as { _id: ObjectId }
    if ( String( existingId ) !== id ) return fail( 409, `Slug "${parsed.data.slug}" already exists.` )
  }

  await db.collection( "categories" ).updateOne( { _id: new ObjectId( id ) }, { $set: { name: parsed.data.name, slug: parsed.data.slug } } )
  const category = await db.collection( "categories" ).findOne( { _id: new ObjectId( id ) } )

  return category
} )
