import z from "zod"

export const ProductZod = z.object( {
  image       : z.string().min( 1 ),
  name        : z.string().min( 1 ).trim(),
  slug        : z.string().min( 1 ).trim().toLowerCase(),
  description : z.string().optional(),
  category    : z.string().min( 1 ), // store ObjectId as string input, convert to ObjectId when inserting
  price       : z.number().min( 0 ),
  unit        : z.string().default( "pcs" ),
  brand       : z.string().min( 1 ), // store ObjectId as string input, convert to ObjectId when inserting
} )

export type ProductInput = z.infer<typeof ProductZod>
export const PRODUCT_COLLECTION = "products"
