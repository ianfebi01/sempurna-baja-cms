import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { defineApi, fail } from "~~/server/utils/api"

export default defineApi( async ( event ) => {
  const query = getQuery( event )
  const slug = ( query.slug as string ) || ""

  const client = await clientPromise
  if ( !client ) return fail( 500, "Koneksi database gagal", "INTERNAL_SERVER_ERROR" )
  const db = client.db( DB_NAME )

  const pipeline = [
    ...( slug ? [{ $match: { slug: { $ne: slug } } }] : [] ),
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$category", product: { $first: "$$ROOT" } } },
    { $limit: 3 },
    { $replaceRoot: { newRoot: "$product" } },
    // lookups for brand and category
    { $lookup: { from: "brands", localField: "brand", foreignField: "_id", as: "brand" } },
    { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "category" } },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
  ]

  const products = await db.collection( "products" ).aggregate( pipeline ).toArray()

  return {
    data : products,
    meta : { total: products.length },
  }
} )
