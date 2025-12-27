export type Product = {
  _id: ObjectId
  image: string
  name: string
  slug: string
  description: string
  category: ObjectId
  price: number
  unit: string
  brand: ObjectId
}

export type ProductResponse = {
  data: Product[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type Category = {
  _id: ObjectId
  name: string
  slug: string
}

export type Brand = {
  _id: ObjectId
  name: string
  slug: string
}
