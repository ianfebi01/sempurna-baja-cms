/**
 * Section Types (Embedded in Page)
 */


// AboutUs Section
export interface AboutUsItem {
  image: string
  title: string
  description: string
}

export interface AboutUsSection {
  type: "aboutUs"
  title: string
  items: AboutUsItem[]
}

// Catalog Section
export interface CatalogSection {
  type: "catalog"
  title: string
  showAllLink: string
}

// ContactUs Section
export interface ContactUsSection {
  type: "contactUs"
  title: string
  address: string
  phone: string
  whatsappNumber: string
  image?: string
}

// Quote Section
export interface QuoteSection {
  type: "quote"
  quoteText: string
  citeUrl?: string
}

// Service Section
export interface ServiceStep {
  title: string
  description: string
}

export interface ServiceSection {
  type: "service"
  title: string
  description: string
  steps: ServiceStep[]
  ctaText: string
  ctaLink: string
}

// Testimoni Section
export interface TestimoniSection {
  type: "testimoni"
  title: string
  testimonialText: string
  customerName: string
  customerImage?: string
  rating: number
}

// BodyCopy Section
export interface BodyCopyItem {
  content: string
}

export interface BodyCopySection {
  type: "bodyCopy"
  title: string
  items: BodyCopyItem[]
}

// Discriminated Union for all Section types
export type Section =
  | AboutUsSection
  | CatalogSection
  | ContactUsSection
  | QuoteSection
  | ServiceSection
  | TestimoniSection

/**
 * Banner Types (Embedded in Page)
 */

export interface MainHeroBanner {
  type: "mainHero"
  title: string
  subtitle?: string
  image: string
  imageTitle: string
  imageSubtitle: string
  ctaText?: string
  ctaLink?: string
  ctaIcon?: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
  secondaryCtaIcon?: string
}

export interface SimpleHeroBanner {
  type: "simpleHero"
  title: string
  subtitle?: string
  backgroundImage?: string
}

export interface VideoHeroBanner {
  type: "videoHero"
  title: string
  subtitle?: string
  videoUrl: string
}

export type Banner = MainHeroBanner | SimpleHeroBanner | VideoHeroBanner

/**
 * Page Types
 */

export interface Page {
  _id: string
  name: string
  slug: string
  banner: Banner
  sections: Section[]
  isPublished: boolean
  metaTitle?: string
  metaDescription?: string
  createdAt: string
  updatedAt: string
}

export interface PageListItem {
  _id: string
  name: string
  slug: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface PageResponse {
  data: PageListItem[]
  meta: {
    total: number
    page: number
    pageSize: number
  }
}
