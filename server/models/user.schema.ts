import z from "zod"
import { RoleEnum, type Role } from "~~/server/models/allowlist.schema"

// Zod schema for user validation
export const UserZod = z.object( {
  email    : z.string().email( "Email tidak valid" ),
  password : z.string().min( 8, "Password harus terdiri dari minimal 8 karakter" ),
  role     : RoleEnum.default( "admin" ),
} )

export type UserInput = z.infer<typeof UserZod>
export type { Role }

// Mongo collection name helper
export const USER_COLLECTION = "users"
