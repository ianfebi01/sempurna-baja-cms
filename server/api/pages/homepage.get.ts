import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { defineApi, fail } from "~~/server/utils/api"
import { PAGE_COLLECTION } from "~~/server/models/page.schema"

/**
 * Public endpoint to fetch the homepage
 * Returns the page where isHomePage is true
 * Optionally filters by published status
 */
export default defineApi( async ( event ) => {
  const isPublished = getQuery( event ).published

  const client = await clientPromise
  const db = client!.db( DB_NAME )

  const query: Record<string, unknown> = { isHomePage: true }

  if ( isPublished !== undefined ) {
    query.isPublished = isPublished === "true"
  }

  const page = await db.collection( PAGE_COLLECTION ).findOne( query )

  if ( !page ) {
    return fail( 404, "Homepage tidak ditemukan", "NOT_FOUND" )
  }

  return page
} )
