import z from "zod"

/**
 * Field Definition Types
 */

export interface FieldDefinition {
  name: string
  label: string
  type: "text" | "textarea" | "image" | "number" | "url" | "array" | "icon" | "markdown"
  required?: boolean
  default?: unknown
  min?: number
  max?: number
  placeholder?: string
  arrayFields?: FieldDefinition[]
}

/**
 * Banner Field Definitions
 */

export const bannerFieldsConfig: Record<string, FieldDefinition[]> = {
  mainHero: [
    { name: "title", label: "Judul", type: "text", required: true, placeholder: "Solusi Baja Ringan" },
    { name: "subtitle", label: "Subtitle", type: "text", placeholder: "Material lengkap + jasa pemasangan" },
    { name: "image", label: "Gambar", type: "image", required: true },
    { name: "imageTitle", label: "Judul Gambar", type: "text", required: true },
    { name: "imageSubtitle", label: "Subtitle Gambar", type: "text", required: true },
    { name: "ctaText", label: "Tombol CTA", type: "text", default: "Chat WhatsApp" },
    { name: "ctaLink", label: "Link CTA", type: "url", default: "https://wa.me/6283144512987" },
    { name: "ctaIcon", label: "Icon CTA", type: "icon", default: "fa7-solid:paper-plane" },
    { name: "secondaryCtaText", label: "Tombol CTA 2", type: "text" },
    { name: "secondaryCtaLink", label: "Link CTA 2", type: "url" },
    { name: "secondaryCtaIcon", label: "Icon CTA 2", type: "icon", default: "fa7-solid:images" },
  ],
  simpleHero: [
    { name: "title", label: "Judul", type: "text", required: true },
    { name: "subtitle", label: "Subtitle", type: "textarea" },
    { name: "backgroundImage", label: "Background", type: "image" },
  ],
  videoHero: [
    { name: "title", label: "Judul", type: "text", required: true },
    { name: "subtitle", label: "Subtitle", type: "textarea" },
    { name: "videoUrl", label: "URL Video", type: "url", required: true },
  ],
}

/**
 * Section Field Definitions
 */

export const sectionFieldsConfig: Record<string, FieldDefinition[]> = {
  aboutUs: [
    { name: "title", label: "Judul", type: "text", default: "Tentang Kami" },
    {
      name        : "items",
      label       : "Items",
      type        : "array",
      arrayFields : [
        { name: "image", label: "Gambar", type: "image", required: true },
        { name: "title", label: "Judul", type: "text", required: true },
        { name: "description", label: "Deskripsi", type: "textarea", required: true },
      ],
    },
  ],
  catalog: [
    { name: "title", label: "Judul", type: "text", default: "Katalog Produk" },
    { name: "showAllLink", label: "Link Lihat Semua", type: "url", default: "/products" },
  ],
  contactUs: [
    { name: "title", label: "Judul", type: "text", default: "Hubungi Kami" },
    { name: "address", label: "Alamat", type: "textarea", required: true },
    { name: "phone", label: "Telepon", type: "text", required: true },
    { name: "whatsappNumber", label: "Nomor WhatsApp", type: "text", required: true, placeholder: "6283144512987" },
    { name: "image", label: "Gambar", type: "image" },
  ],
  quote: [
    { name: "quoteText", label: "Teks Quote", type: "textarea", required: true, min: 10 },
    { name: "citeUrl", label: "URL Sumber", type: "url" },
  ],
  service: [
    { name: "title", label: "Judul", type: "text", required: true },
    { name: "description", label: "Deskripsi", type: "textarea", required: true },
    {
      name        : "steps",
      label       : "Langkah-langkah",
      type        : "array",
      arrayFields : [
        { name: "title", label: "Judul Step", type: "text", required: true },
        { name: "description", label: "Deskripsi", type: "textarea", required: true },
      ],
    },
    { name: "ctaText", label: "Tombol CTA", type: "text", default: "Pesan sekarang" },
    { name: "ctaLink", label: "Link CTA", type: "url", default: "https://wa.me/6283144512987" },
  ],
  testimoni: [
    { name: "title", label: "Judul", type: "text", default: "Testimoni Pelanggan" },
    { name: "testimonialText", label: "Teks Testimoni", type: "textarea", required: true },
    { name: "customerName", label: "Nama Pelanggan", type: "text", required: true },
    { name: "customerImage", label: "Foto Pelanggan", type: "image" },
    { name: "rating", label: "Rating", type: "number", min: 1, max: 5, default: 5 },
  ],
}

/**
 * Generate Zod schema for a single field (used for individual field validation)
 */
export function generateFieldSchema( field: FieldDefinition ): z.ZodTypeAny {
  let fieldSchema: z.ZodTypeAny

  switch ( field.type ) {
    case "text":
    case "textarea": {
      let s = z.string()
      if ( field.required ) s = s.min( 1, `${field.label} wajib diisi` )
      if ( field.min ) s = s.min( field.min, `${field.label} minimal ${field.min} karakter` )
      if ( field.max ) s = s.max( field.max, `${field.label} maksimal ${field.max} karakter` )
      fieldSchema = s
      break
    }
    case "url": {
      let s = z.string()
      if ( field.required ) {
        s = s.min( 1, `${field.label} wajib diisi` )
      }
      fieldSchema = s.refine(
        ( val ) => val === "" || val.startsWith( "#" ) || val.startsWith( "/" ) || z.string().url().safeParse( val ).success,
        { message: `${field.label} harus URL atau anchor yang valid` },
      )
      break
    }
    case "image": {
      fieldSchema = field.required
        ? z.string().min( 1, `${field.label} wajib diisi` )
        : z.string()
      break
    }
    case "icon": {
      fieldSchema = z.string()
      break
    }
    case "number": {
      let n = z.number()
      if ( field.min !== undefined ) n = n.min( field.min, `${field.label} minimal ${field.min}` )
      if ( field.max !== undefined ) n = n.max( field.max, `${field.label} maksimal ${field.max}` )
      fieldSchema = n
      break
    }
    case "array": {
      if ( field.arrayFields ) {
        const itemSchema = generateZodSchema( field.arrayFields )
        fieldSchema = z.array( itemSchema ).min( 1, `${field.label} minimal 1 item` )
      } else {
        fieldSchema = z.array( z.any() )
      }
      break
    }
    default:
      fieldSchema = z.any()
  }

  return fieldSchema
}

/**
 * Schema Generator
 */

export function generateZodSchema( fields: FieldDefinition[] ): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for ( const field of fields ) {
    let fieldSchema: z.ZodTypeAny

    switch ( field.type ) {
      case "text":
      case "textarea": {
        let s = z.string()
        if ( field.required ) s = s.min( 1, `${field.label} wajib diisi` )
        if ( field.min ) s = s.min( field.min, `${field.label} minimal ${field.min} karakter` )
        if ( field.max ) s = s.max( field.max, `${field.label} maksimal ${field.max} karakter` )
        fieldSchema = s
        break
      }
      case "url": {
        fieldSchema = z.string().refine(
          ( val ) => val.startsWith( "#" ) || val.startsWith( "/" ) || z.string().url().safeParse( val ).success,
          { message: `${field.label} harus URL atau anchor yang valid` },
        )
        break
      }
      case "image": {
        fieldSchema = z.string().min( 1, `${field.label} wajib diisi` )
        break
      }
      case "icon": {
        fieldSchema = z.string()
        break
      }
      case "number": {
        let n = z.number()
        if ( field.min !== undefined ) n = n.min( field.min, `${field.label} minimal ${field.min}` )
        if ( field.max !== undefined ) n = n.max( field.max, `${field.label} maksimal ${field.max}` )
        fieldSchema = n
        break
      }
      case "array": {
        if ( field.arrayFields ) {
          const itemSchema = generateZodSchema( field.arrayFields )
          fieldSchema = z.array( itemSchema ).min( 1, `${field.label} minimal 1 item` )
        } else {
          fieldSchema = z.array( z.any() )
        }
        break
      }
      default:
        fieldSchema = z.any()
    }

    // Handle optional fields
    if ( !field.required && field.type !== "array" ) {
      fieldSchema = fieldSchema.optional().or( z.literal( "" ) )
    }

    // Handle default values
    if ( field.default !== undefined ) {
      fieldSchema = fieldSchema.default( field.default )
    }

    shape[field.name] = fieldSchema
  }

  return z.object( shape )
}

/**
 * Generate Default Form State
 */

export function generateDefaultState( fields: FieldDefinition[] ): Record<string, unknown> {
  const state: Record<string, unknown> = {}

  for ( const field of fields ) {
    if ( field.default !== undefined ) {
      state[field.name] = field.default
    } else if ( field.type === "array" && field.arrayFields ) {
      state[field.name] = [generateDefaultState( field.arrayFields )]
    } else if ( field.type === "number" ) {
      state[field.name] = 0
    } else {
      state[field.name] = ""
    }
  }

  return state
}

/**
 * Type Helpers
 */

export type BannerType = keyof typeof bannerFieldsConfig
export type SectionType = keyof typeof sectionFieldsConfig

export const bannerTypes: { label: string; value: BannerType }[] = [
  { label: "Hero Utama", value: "mainHero" },
  { label: "Hero Sederhana", value: "simpleHero" },
  { label: "Hero Video", value: "videoHero" },
]

export const sectionTypes: { label: string; value: SectionType }[] = [
  { label: "Tentang Kami", value: "aboutUs" },
  { label: "Katalog Produk", value: "catalog" },
  { label: "Hubungi Kami", value: "contactUs" },
  { label: "Quote", value: "quote" },
  { label: "Jasa / Layanan", value: "service" },
  { label: "Testimoni", value: "testimoni" },
]
