import { describe, expect, it } from "vitest"
import { isZodError, normalizeError, fail } from "~~/server/utils/api"
import { z } from "zod"

describe( "server/utils/api", () => {
  describe( "isZodError", () => {
    it( "should return true for Zod validation errors", () => {
      const schema = z.object( { name: z.string().min( 1 ) } )
      const result = schema.safeParse( { name: "" } )

      if ( !result.success ) {
        expect( isZodError( result.error ) ).toBe( true )
      }
    } )

    it( "should return false for non-Zod errors", () => {
      expect( isZodError( new Error( "Regular error" ) ) ).toBeFalsy()
      expect( isZodError( { message: "Plain object" } ) ).toBeFalsy()
      expect( isZodError( null ) ).toBeFalsy()
      expect( isZodError( undefined ) ).toBeFalsy()
    } )
  } )

  describe( "normalizeError", () => {
    it( "should handle Zod validation errors", () => {
      const schema = z.object( { email: z.string().email() } )
      const result = schema.safeParse( { email: "invalid" } )

      if ( !result.success ) {
        const normalized = normalizeError( result.error )
        expect( normalized.statusCode ).toBe( 400 )
        expect( normalized.code ).toBe( "VALIDATION_ERROR" )
        expect( normalized.details ).toBeDefined()
      }
    } )

    it( "should handle generic Error objects", () => {
      const error = new Error( "Something broke" )
      const normalized = normalizeError( error )

      expect( normalized.statusCode ).toBe( 500 )
      expect( normalized.code ).toBe( "INTERNAL_ERROR" )
      expect( normalized.message ).toBe( "Something broke" )
    } )

    it( "should handle unknown error types", () => {
      const normalized = normalizeError( "string error" )

      expect( normalized.statusCode ).toBe( 500 )
      expect( normalized.code ).toBe( "INTERNAL_ERROR" )
    } )

    it( "should handle H3-like errors with statusCode", () => {
      const h3Error = {
        statusCode    : 404,
        statusMessage : "Not found",
        data          : { code: "NOT_FOUND", details: { id: "123" } },
      }
      const normalized = normalizeError( h3Error )

      expect( normalized.statusCode ).toBe( 404 )
      expect( normalized.message ).toBe( "Not found" )
      expect( normalized.code ).toBe( "NOT_FOUND" )
      expect( normalized.details ).toEqual( { id: "123" } )
    } )
  } )

  describe( "fail", () => {
    it( "should throw an H3 error with correct structure", () => {
      expect( () => fail( 400, "Bad request", "BAD_REQUEST" ) ).toThrow()
    } )

    it( "should include details when provided", () => {
      try {
        fail( 422, "Validation failed", "VALIDATION_ERROR", { field: "email" } )
      } catch ( error ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = error as any
        expect( e.statusCode ).toBe( 422 )
        expect( e.data?.code ).toBe( "VALIDATION_ERROR" )
        expect( e.data?.details ).toEqual( { field: "email" } )
      }
    } )
  } )
} )
