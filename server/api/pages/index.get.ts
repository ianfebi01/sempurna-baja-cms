import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { defineApi } from "~~/server/utils/api"
import { PAGE_COLLECTION } from "~~/server/models/page.schema"

export default defineApi( async ( event ) => {
  // await requireRole(event, ["admin", "super-admin"])

  const query = getQuery( event )
  const page = Number( query.page ) || 1
  const pageSize = Number( query.pageSize ) || 20
  const search = String( query.search || "" ).trim()
  const slug = String( query.slug || "" ).trim()
  const published = query.published

  const client = await clientPromise
  const db = client?.db( DB_NAME )

  if ( !db ) {
    return fail(
      500,
      "Database connection error",
    )
  }

  const filter: Record<string, unknown> = {}

  const orConditions = []
  if ( search ) {
    orConditions.push( { name: { $regex: search, $options: "i" } } )
  }
  if ( slug ) {
    orConditions.push( { slug: { $regex: slug, $options: "i" } } )
  }
  if ( orConditions.length > 0 ) {
    filter.$or = orConditions
  }

  if ( published === "true" ) {
    filter.isPublished = true
  } else if ( published === "false" ) {
    filter.isPublished = false
  }

  const total = await db?.collection( PAGE_COLLECTION ).countDocuments( filter )

  const pages = await db
    .collection( PAGE_COLLECTION )
    .find( filter )
    .sort( { createdAt: -1 } )
    .skip( ( page - 1 ) * pageSize )
    .limit( pageSize )
    .project( {
      name        : 1,
      slug        : 1,
      isPublished : 1,
      createdAt   : 1,
      updatedAt   : 1,
    } )
    .toArray()

  return {
    data : pages,
    meta : {
      total,
      page,
      pageSize,
    },
  }
} )
