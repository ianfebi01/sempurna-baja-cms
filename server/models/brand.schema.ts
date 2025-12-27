import z from "zod"

export const BrandZod = z.object( {
  name : z.string().min( 1 ).trim(),
  slug : z.string().min( 1 ).trim().toLowerCase(),
} )

export type BrandInput = z.infer<typeof BrandZod>
export const BRAND_COLLECTION = "brands"
