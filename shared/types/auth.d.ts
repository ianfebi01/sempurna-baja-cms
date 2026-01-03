import type { RoleEnum } from "~~/server/models/allowlist.schema"

declare module "#auth-utils" {
  interface User {
    email: string
    role: RoleEnum
    googleId: string
    name: string
    picture: string
  }

  interface UserSession {
    user: User
  }

  interface SecureSessionData {
    user: User
  }
}

export {}