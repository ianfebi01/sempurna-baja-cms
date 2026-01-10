import { createError } from "h3"
import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { defineApi, fail } from "~~/server/utils/api"
import { PAGE_COLLECTION, PageZod, validateBannerData, validateSections } from "~~/server/models/page.schema"
import type { BannerType } from "~~/shared/utils/fieldDefinitions"

export default defineApi( async ( event ) => {
  await requireRole( event, ["admin", "super-admin"] )

  const body = await readBody( event )

  if ( !body || typeof body !== "object" ) {
    return fail( 400, "Data tidak valid", "BAD_REQUEST" )
  }

  // Validate banner separately with dynamic schema
  if ( body.banner?.type ) {
    const bannerValidation = validateBannerData( body.banner.type as BannerType, body.banner )
    if ( !bannerValidation.success ) {
      const firstError = bannerValidation.error.issues[0]
      throw createError( {
        statusCode    : 400,
        statusMessage : `Banner: ${firstError?.message || "Invalid banner"}`,
      } )
    }
    body.banner = bannerValidation.data
  }

  // Validate each section based on its type
  if ( body.sections?.length ) {
    const { errors, validatedSections } = validateSections( body.sections )
    if ( errors.length ) {
      throw createError( {
        statusCode    : 400,
        statusMessage : errors[0]?.message || "Section tidak valid",
      } )
    }
    body.sections = validatedSections
  }

  // Validate page structure
  const parsed = PageZod.safeParse( body )

  if ( !parsed.success ) {
    const firstError = parsed.error.issues[0]
    throw createError( {
      statusCode    : 400,
      statusMessage : firstError?.message || "Invalid page data",
    } )
  }

  const client = await clientPromise
  const db = client!.db( DB_NAME )

  // Generate slug if not provided
  const slug = ( parsed.data.slug || parsed.data.name )
    .toLowerCase()
    .replace( /[^a-z0-9]+/g, "-" )
    .replace( /^-+|-+$/g, "" )

  // Check for duplicate slug
  const existing = await db.collection( PAGE_COLLECTION ).findOne( { slug } )
  if ( existing ) {
    return fail( 409, `Slug "${slug}" sudah ada`, "CONFLICT" )
  }

  // If setting as homepage, unset any existing homepage first
  if ( parsed.data.isHomePage ) {
    await db.collection( PAGE_COLLECTION ).updateMany(
      { isHomePage: true },
      { $set: { isHomePage: false } },
    )
  }

  // Sections are now embedded directly in the page document
  const doc = {
    name            : parsed.data.name,
    slug,
    banner          : parsed.data.banner,
    sections        : parsed.data.sections, // Embedded sections
    isPublished     : parsed.data.isPublished,
    isHomePage      : parsed.data.isHomePage,
    metaTitle       : parsed.data.metaTitle,
    metaDescription : parsed.data.metaDescription,
    createdAt       : new Date(),
    updatedAt       : new Date(),
  }

  const result = await db.collection( PAGE_COLLECTION ).insertOne( doc )
  const page = await db.collection( PAGE_COLLECTION ).findOne( { _id: result.insertedId } )

  return page
} )
