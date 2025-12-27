import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { defineApi, fail } from "~~/server/utils/api"
import { ObjectId } from "mongodb"

export default defineApi( async ( event ) => {
  const query = getQuery( event )
  const page = parseInt( query.page as string ) || 1
  const pageSize = parseInt( query.pageSize as string ) || 10
  const search = ( query.search as string ) || ""
  const category = ( query.category as string ) || ""
  const brand = ( query.brand as string ) || ""
  const sortBy = ( query.sortBy as string ) || "createdAt"
  const sortOrder = ( query.sortOrder as string ) === "desc" ? -1 : 1
  const slug = ( query.slug as string ) || ""

  const client = await clientPromise
  if ( !client ) return fail( 500, "Koneksi database gagal", "INTERNAL_SERVER_ERROR" )
  const db = client.db( DB_NAME )

  const filter: Record<string, unknown> = {}
  if ( search ) filter.name = { $regex: search, $options: "i" }

  if ( category && category !== "all" ) {
    const categoryArray = category.split( "," ).filter( ( v ) => ObjectId.isValid( v ) ).map( ( v ) => new ObjectId( v ) )
    if ( categoryArray.length ) filter.category = { $in: categoryArray }
  }
  if ( brand && brand !== "all" ) {
    const brandArray = brand.split( "," ).filter( ( v ) => ObjectId.isValid( v ) ).map( ( v ) => new ObjectId( v ) )
    if ( brandArray.length ) filter.brand = { $in: brandArray }
  }
  if ( slug ) filter.slug = slug

  const total = await db.collection( "products" ).countDocuments( filter )

  const products = await db.collection( "products" )
    .find( filter )
    .sort( { [sortBy]: sortOrder } )
    .skip( ( page - 1 ) * pageSize )
    .limit( pageSize )
    .toArray()

  // Optional: enrich brand and category via lookup
  const brandIds = Array.from( new Set( products.map( ( p ) => String( p.brand ) ) ) ).filter( ObjectId.isValid ).map( ( id ) => new ObjectId( id ) )
  const categoryIds = Array.from( new Set( products.map( ( p ) => String( p.category ) ) ) ).filter( ObjectId.isValid ).map( ( id ) => new ObjectId( id ) )

  const [brands, categories] = await Promise.all( [
    db.collection( "brands" ).find( { _id: { $in: brandIds } } ).toArray(),
    db.collection( "categories" ).find( { _id: { $in: categoryIds } } ).toArray(),
  ] )

  const brandMap = new Map( brands.map( ( b ) => { const { _id: id } = b as { _id: ObjectId }; return [String( id ), b] as const } ) )
  const categoryMap = new Map( categories.map( ( c ) => { const { _id: id } = c as { _id: ObjectId }; return [String( id ), c] as const } ) )

  const enriched = products.map( ( p ) => ( {
    ...p,
    brand    : brandMap.get( String( p.brand ) ) || p.brand,
    category : categoryMap.get( String( p.category ) ) || p.category,
  } ) )

  return {
    data : enriched,
    meta : {
      page,
      pageSize,
      total,
      totalPages: Math.ceil( total / pageSize ),
    },
  }
} )