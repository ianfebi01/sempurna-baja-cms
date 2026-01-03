import z from "zod"
import { RoleEnum, type Role } from "~~/server/models/allowlist.schema"

// Zod schema for user validation
export const UserZod = z.object( {
  email    : z.string().email( "Email tidak valid" ),
  password : z.string().min( 8, "Password harus terdiri dari minimal 8 karakter" ),
  name     : z.string().min( 3, "Nama harus terdiri dari minimal 3 karakter" ),
  picture  : z.string().optional(),
  role     : RoleEnum.default( "admin" ),
} )

export type UserInput = z.infer<typeof UserZod>
export type { Role }

// Mongo collection name helper
export const USER_COLLECTION = "users"
