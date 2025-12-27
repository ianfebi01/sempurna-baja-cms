import z from "zod"

export const CategoryZod = z.object( {
  name : z.string().min( 1 ).trim(),
  slug : z.string().min( 1 ).trim().toLowerCase(),
} )

export type CategoryInput = z.infer<typeof CategoryZod>
export const CATEGORY_COLLECTION = "categories"
