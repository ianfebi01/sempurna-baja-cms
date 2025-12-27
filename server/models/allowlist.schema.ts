import z from "zod"

export const RoleEnum = z.enum( [ "admin", "super-admin" ] )
export type Role = z.infer<typeof RoleEnum>

// Zod schema for allowed (pre-approved) user emails
export const AllowlistZod = z.object( {
  email : z.string().email( "Email tidak valid" ),
  role  : RoleEnum.default( "admin" ),
} )

export type AllowlistInput = z.infer<typeof AllowlistZod>

// Mongo collection name helper
export const ALLOWLIST_COLLECTION = "allowed_users"
