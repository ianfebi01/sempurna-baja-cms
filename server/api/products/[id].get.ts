import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { defineApi, fail } from "~~/server/utils/api"
import { ObjectId } from "mongodb"

export default defineApi(async (event) => {
  const { user } = await requireUserSession(event)
  const email = user?.email
  if (!email) return fail(401, "Unauthorized", "UNAUTHORIZED")

  const id = event.context.params?.id
  if (!id || !ObjectId.isValid(id)) return fail(400, "Produk tidak valid", "BAD_REQUEST")

  const client = await clientPromise
  if (!client) return fail(500, "Koneksi database gagal", "INTERNAL_SERVER_ERROR")
  const db = client.db(DB_NAME)

  const product = await db.collection("products").findOne({ _id: new ObjectId(id) })
  if (!product) return fail(404, "Produk tidak ditemukan", "NOT_FOUND")

  const [brand, category] = await Promise.all([
    db.collection("brands").findOne({ _id: new ObjectId(String(product.brand)) }),
    db.collection("categories").findOne({ _id: new ObjectId(String(product.category)) }),
  ])

  return { ...product, brand, category }
})