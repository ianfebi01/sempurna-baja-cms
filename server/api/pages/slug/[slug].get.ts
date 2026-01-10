import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { defineApi, fail } from "~~/server/utils/api"
import { PAGE_COLLECTION } from "~~/server/models/page.schema"

/**
 * Public endpoint to fetch a page by slug
 * Returns full page data with banner and sections
 * Only returns published pages
 */
export default defineApi( async ( event ) => {
  const slug = getRouterParam( event, "slug" )
  const isPublished = getQuery( event ).published
  const isHomePage = getQuery( event ).homePage

  if ( !slug ) {
    return fail( 400, "Slug wajib diisi", "BAD_REQUEST" )
  }

  const client = await clientPromise
  const db = client!.db( DB_NAME )

  const query: Record<string, unknown> = { slug: slug.toLowerCase() }

  if ( isPublished !== undefined ) {
    query.isPublished = isPublished === "true"
  }
  if ( isHomePage !== undefined ) {
    query.isHomePage = isHomePage === "true"
  }

  const page = await db.collection( PAGE_COLLECTION ).findOne( query )

  if ( !page ) {
    return fail( 404, "Halaman tidak ditemukan", "NOT_FOUND" )
  }

  return page
} )
