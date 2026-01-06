import type { BannerType, SectionType } from "../utils/fieldDefinitions"

// ============================================
// Section Types
// ============================================

export interface BaseSection {
  _id: string
  name: string
  type: SectionType
  order: number
  createdAt: string
  updatedAt: string
}

// AboutUs Section
export interface AboutUsItem {
  image: string
  title: string
  description: string
}

export interface AboutUsSection extends BaseSection {
  type: "aboutUs"
  title: string
  items: AboutUsItem[]
}

// Catalog Section
export interface CatalogSection extends BaseSection {
  type: "catalog"
  title: string
  showAllLink: string
}

// ContactUs Section
export interface ContactUsSection extends BaseSection {
  type: "contactUs"
  title: string
  address: string
  phone: string
  whatsappNumber: string
  image?: string
}

// Quote Section
export interface QuoteSection extends BaseSection {
  type: "quote"
  quoteText: string
  citeUrl?: string
}

// Service Section
export interface ServiceStep {
  title: string
  description: string
}

export interface ServiceSection extends BaseSection {
  type: "service"
  title: string
  description: string
  steps: ServiceStep[]
  ctaText: string
  ctaLink: string
}

// Testimoni Section
export interface TestimoniSection extends BaseSection {
  type: "testimoni"
  title: string
  testimonialText: string
  customerName: string
  customerImage?: string
  rating: number
}

// Discriminated Union
export type Section =
  | AboutUsSection
  | CatalogSection
  | ContactUsSection
  | QuoteSection
  | ServiceSection
  | TestimoniSection

// ============================================
// Banner Types
// ============================================

export interface BaseBanner {
  type: BannerType
}

export interface MainHeroBanner extends BaseBanner {
  type: "mainHero"
  title: string
  subtitle?: string
  image: string
  ctaText?: string
  ctaLink?: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
}

export interface SimpleHeroBanner extends BaseBanner {
  type: "simpleHero"
  title: string
  subtitle?: string
  backgroundImage?: string
}

export interface VideoHeroBanner extends BaseBanner {
  type: "videoHero"
  title: string
  subtitle?: string
  videoUrl: string
}

export type Banner = MainHeroBanner | SimpleHeroBanner | VideoHeroBanner

// ============================================
// Page Types
// ============================================

export interface Page {
  _id: string
  name: string
  slug: string
  banner: Banner
  sections: Section[] // Populated
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
