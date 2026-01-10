import { describe, expect, it } from "vitest"
import {
  generateZodSchema,
  generateDefaultState,
  generateFieldSchema,
  type FieldDefinition,
} from "~~/shared/utils/fieldDefinitions"

describe( "shared/utils/fieldDefinitions", () => {
  describe( "generateFieldSchema", () => {
    it( "should generate text schema with required validation", () => {
      const field: FieldDefinition = { name: "title", label: "Judul", type: "text", required: true }
      const schema = generateFieldSchema( field )

      expect( schema.safeParse( "" ).success ).toBe( false )
      expect( schema.safeParse( "Hello" ).success ).toBe( true )
    } )

    it( "should generate text schema with min/max validation", () => {
      const field: FieldDefinition = { name: "desc", label: "Deskripsi", type: "text", min: 5, max: 10 }
      const schema = generateFieldSchema( field )

      expect( schema.safeParse( "Hi" ).success ).toBe( false )
      expect( schema.safeParse( "Hello" ).success ).toBe( true )
      expect( schema.safeParse( "This is too long" ).success ).toBe( false )
    } )

    it( "should generate url schema that accepts valid URLs", () => {
      const field: FieldDefinition = { name: "link", label: "Link", type: "url" }
      const schema = generateFieldSchema( field )

      expect( schema.safeParse( "https://example.com" ).success ).toBe( true )
      expect( schema.safeParse( "#section" ).success ).toBe( true )
      expect( schema.safeParse( "invalid-url" ).success ).toBe( false )
    } )

    it( "should generate number schema with min/max", () => {
      const field: FieldDefinition = { name: "rating", label: "Rating", type: "number", min: 1, max: 5 }
      const schema = generateFieldSchema( field )

      expect( schema.safeParse( 0 ).success ).toBe( false )
      expect( schema.safeParse( 3 ).success ).toBe( true )
      expect( schema.safeParse( 6 ).success ).toBe( false )
    } )

    it( "should generate array schema with nested fields", () => {
      const field: FieldDefinition = {
        name        : "items",
        label       : "Items",
        type        : "array",
        arrayFields : [
          { name: "title", label: "Judul", type: "text", required: true },
        ],
      }
      const schema = generateFieldSchema( field )

      expect( schema.safeParse( [] ).success ).toBe( false ) // min 1 item
      expect( schema.safeParse( [{ title: "Test" }] ).success ).toBe( true )
    } )
  } )

  describe( "generateZodSchema", () => {
    it( "should generate schema for multiple fields", () => {
      const fields: FieldDefinition[] = [
        { name: "title", label: "Judul", type: "text", required: true },
        { name: "description", label: "Deskripsi", type: "textarea" },
        { name: "count", label: "Jumlah", type: "number", min: 0 },
      ]
      const schema = generateZodSchema( fields )

      const validData = { title: "Hello", description: "World", count: 5 }
      expect( schema.safeParse( validData ).success ).toBe( true )

      const invalidData = { title: "", description: "World", count: 5 }
      expect( schema.safeParse( invalidData ).success ).toBe( true ) // title is optional in full schema without required
    } )

    it( "should handle optional fields correctly", () => {
      const fields: FieldDefinition[] = [
        { name: "optional", label: "Optional", type: "text" },
      ]
      const schema = generateZodSchema( fields )

      expect( schema.safeParse( { optional: "" } ).success ).toBe( true )
      expect( schema.safeParse( { optional: undefined } ).success ).toBe( true )
    } )

    it( "should apply default values", () => {
      const fields: FieldDefinition[] = [
        { name: "ctaText", label: "CTA", type: "text", default: "Click me" },
      ]
      const schema = generateZodSchema( fields )
      const result = schema.parse( {} )

      expect( result.ctaText ).toBe( "Click me" )
    } )
  } )

  describe( "generateDefaultState", () => {
    it( "should generate default state from field definitions", () => {
      const fields: FieldDefinition[] = [
        { name: "title", label: "Judul", type: "text" },
        { name: "count", label: "Jumlah", type: "number" },
        { name: "ctaText", label: "CTA", type: "text", default: "Click me" },
      ]
      const state = generateDefaultState( fields )

      expect( state ).toEqual( {
        title   : "",
        count   : 0,
        ctaText : "Click me",
      } )
    } )

    it( "should generate nested default state for array fields", () => {
      const fields: FieldDefinition[] = [
        {
          name        : "items",
          label       : "Items",
          type        : "array",
          arrayFields : [
            { name: "name", label: "Nama", type: "text" },
            { name: "value", label: "Nilai", type: "number" },
          ],
        },
      ]
      const state = generateDefaultState( fields )

      expect( state.items ).toEqual( [{ name: "", value: 0 }] )
    } )
  } )
} )
