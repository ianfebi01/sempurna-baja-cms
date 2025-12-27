import type { JWTPayload } from "jose"

export type Role = "admin" | "super-admin"

export interface AuthPayload extends JWTPayload {
  email?: string
  role?: Role
}

export interface ApiMeta {
  requestId: string
  method: string
  path: string
  durationMs: number
  ts: string
}

type ApiSuccess<T> = {
  success: true
  data: T
  meta: ApiMeta
}

type ApiError = {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
  meta: ApiMeta
}

// Auth

export interface Login {
  loggedIn: boolean,
  user: string,
  role?: Role,
}