import z from "zod"
import {
  bannerFieldsConfig,
  generateZodSchema,
  type BannerType,
} from "~~/shared/utils/fieldDefinitions"

// ============================================
// Banner Types
// ============================================

export const bannerTypeValues = [
  "mainHero",
  "simpleHero",
  "videoHero",
] as const

export const BannerTypeZod = z.enum( bannerTypeValues )

// ============================================
// Banner Schema (embedded in page)
// ============================================

const BaseBannerZod = z.object( {
  type: BannerTypeZod,
} )

export function validateBannerData( type: BannerType, data: unknown ) {
  const fields = bannerFieldsConfig[type]
  if ( !fields ) {
    return {
      success : false as const,
      error   : new z.ZodError( [{ code: "custom", message: `Tipe banner tidak valid: ${type}`, path: ["type"] }] ),
    }
  }

  const dynamicSchema = generateZodSchema( fields )
  const fullSchema = BaseBannerZod.merge( dynamicSchema )

  return fullSchema.safeParse( data )
}

// ============================================
// Section Types (for embedded sections)
// ============================================

export const sectionTypeValues = [
  "aboutUs",
  "catalog",
  "contactUs",
  "quote",
  "service",
  "testimoni",
] as const

export const SectionTypeZod = z.enum( sectionTypeValues )

// Base section schema
const BaseSectionZod = z.object( {
  type: SectionTypeZod,
} )

// Import section field configs
import { sectionFieldsConfig, type SectionType } from "~~/shared/utils/fieldDefinitions"

// Validate section data dynamically based on type
export function validateSectionData( type: SectionType, data: unknown ) {
  const fields = sectionFieldsConfig[type]
  if ( !fields ) {
    return {
      success : false as const,
      error   : new z.ZodError( [{ code: "custom", message: `Tipe section tidak valid: ${type}`, path: ["type"] }] ),
    }
  }

  const dynamicSchema = generateZodSchema( fields )
  const fullSchema = BaseSectionZod.merge( dynamicSchema )

  return fullSchema.safeParse( data )
}

// Validate all sections in a page
export function validateSections( sections: Array<{ type: string; [key: string]: unknown }> ) {
  const errors: Array<{ index: number; message: string }> = []
  const validatedSections: Array<Record<string, unknown>> = []

  for ( let i = 0; i < sections.length; i++ ) {
    const section = sections[i]!
    const type = section.type as SectionType
    const result = validateSectionData( type, section )

    if ( !result.success ) {
      const firstError = result.error.issues[0]
      errors.push( { index: i, message: `Section ${i + 1}: ${firstError?.message || "Invalid"}` } )
    } else {
      validatedSections.push( result.data as Record<string, unknown> )
    }
  }

  return { errors, validatedSections }
}

// ============================================
// Page Schema
// ============================================

export const PageZod = z.object( {
  name            : z.string().min( 1, "Nama halaman wajib diisi" ).trim(),
  slug            : z.string().min( 1, "Slug wajib diisi" ).trim().toLowerCase(),
  banner          : z.object( { type: BannerTypeZod } ).passthrough(), // Embedded banner with dynamic fields
  sections        : z.array( z.object( { type: SectionTypeZod } ).passthrough() ), // Embedded sections with dynamic fields
  isPublished     : z.boolean().default( false ),
  metaTitle       : z.string().optional(),
  metaDescription : z.string().optional(),
} )

export type PageInput = z.infer<typeof PageZod>

export interface PageDocument {
  _id: string
  name: string
  slug: string
  banner: {
    type: BannerType
    [key: string]: unknown
  }
  sections: Array<{
    type: string
    [key: string]: unknown
  }>
  isPublished: boolean
  metaTitle?: string
  metaDescription?: string
  createdAt: Date
  updatedAt: Date
}

export const PAGE_COLLECTION = "pages"
