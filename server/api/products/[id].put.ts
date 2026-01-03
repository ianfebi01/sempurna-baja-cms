import { createError, readMultipartFormData } from "h3"
import { Buffer } from "node:buffer"
import * as z from "zod"
import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { defineApi, fail } from "~~/server/utils/api"
import { uploadImageToCloudinary } from "~~/server/utils/cloudinary"
import { ObjectId } from "mongodb"

export default defineApi( async ( event ) => {
  const id = event.context.params?.id
  if ( !id || !ObjectId.isValid( id ) ) return fail( 400, "ID produk tidak valid.", "BAD_REQUEST" )

  const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
  const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

  const formatBytes = ( bytes: number, decimals = 2 ) => {
    if ( bytes === 0 ) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    const i = Math.floor( Math.log( bytes ) / Math.log( k ) )
    return parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( dm ) ) + " " + sizes[i]
  }

  const form = await readMultipartFormData( event )
  if ( !form ) return fail( 400, "Data form tidak valid.", "BAD_REQUEST" )

  const data: Record<string, string> = {}
  let imagePart: { filename?: string | null; type?: string | null; data: Uint8Array } | null = null

  for ( const part of form ) {
    if ( !part.name ) continue
    if ( part.name === "image" && part.filename && part.type && part.data ) {
      imagePart = { filename: part.filename, type: part.type, data: part.data || new Uint8Array() }
    } else {
      data[part.name] = part.data ? Buffer.from( part.data ).toString( "utf8" ) : ""
    }
  }

  const { user } = await requireUserSession( event )
  const email = user?.email
  if ( !email ) return fail( 401, "Tidak diizinkan.", "UNAUTHORIZED" )

  const textSchema = z.object( {
    name        : z.string().min( 2, "Nama terlalu pendek" ),
    slug        : z.string().min( 2, "Slug terlalu pendek" ).optional(),
    description : z.string().min( 10, "Deskripsi terlalu pendek" ),
    category    : z.string().min( 2, "Kategori terlalu pendek" ),
    price       : z.coerce.number().min( 1000, "Harga minimal adalah 1000" ),
    unit        : z.string().min( 1, "Satuan wajib diisi" ),
    brand       : z.string().min( 2, "Brand terlalu pendek" ),
    image       : z.string().url().optional(),
  } )

  const parsed = textSchema.safeParse( data )
  if ( !parsed.success ) {
    const first = parsed.error.issues[0]
    throw createError( { statusCode: 400, statusMessage: first.message } )
  }

  const slug = ( parsed.data.slug || parsed.data.name )
    .toLowerCase()
    .replace( /[^a-z0-9]+/g, "-" )
    .replace( /^-+|-+$/g, "" )

  const client = await clientPromise
  if ( !client ) return fail( 500, "Koneksi database gagal", "INTERNAL_SERVER_ERROR" )
  const db = client.db( DB_NAME )

  const existing = await db.collection( "products" ).findOne( { slug } )
  if ( existing ) {
    const { _id: existingId } = existing as { _id: ObjectId }
    if ( String( existingId ) !== id ) return fail( 409, `Slug "${slug}" sudah digunakan.` )
  }

  let imageUrl: string | null = null
  if ( imagePart ) {
    const mime = imagePart.type || ""
    const size = imagePart.data.length
    if ( !ACCEPTED_IMAGE_TYPES.includes( mime ) ) return fail( 400, "Format gambar tidak valid. Format yang diperbolehkan: JPEG, PNG, atau WebP." )
    if ( size > MAX_FILE_SIZE ) return fail( 400, `Ukuran gambar terlalu besar. Maksimal ${formatBytes( MAX_FILE_SIZE )}.` )

    const buf = Buffer.from( imagePart.data )
    imageUrl = await uploadImageToCloudinary( { data: buf, type: imagePart.type, filename: imagePart.filename }, { folder: "sempurna-baja", maxBytes: MAX_FILE_SIZE } )
  } else if ( parsed.data.image ) {
    imageUrl = parsed.data.image
  } else {
    const current = await db.collection( "products" ).findOne( { _id: new ObjectId( id ) }, { projection: { image: 1 } } )
    imageUrl = ( current as { image?: string } )?.image || null
  }

  await db.collection( "products" ).updateOne( { _id: new ObjectId( id ) }, {
    $set: {
      name        : parsed.data.name,
      slug,
      description : parsed.data.description,
      category    : new ObjectId( parsed.data.category ),
      price       : parsed.data.price,
      unit        : parsed.data.unit,
      brand       : new ObjectId( parsed.data.brand ),
      image       : imageUrl,
      updatedAt   : new Date(),
    },
  } )

  const product = await db.collection( "products" ).findOne( { _id: new ObjectId( id ) } )
  return product
} )