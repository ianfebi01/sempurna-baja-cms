import { describe, expect, it } from "vitest"
import formatRupiah from "~~/shared/utils/formatRupiah"

describe( "shared/utils/formatRupiah", () => {
  describe( "with currency prefix (default)", () => {
    it( "should format number with Rp. prefix", () => {
      expect( formatRupiah( 1000 ) ).toBe( "Rp. 1.000" )
      expect( formatRupiah( 1500000 ) ).toBe( "Rp. 1.500.000" )
      expect( formatRupiah( 25000000 ) ).toBe( "Rp. 25.000.000" )
    } )

    it( "should format string numbers", () => {
      expect( formatRupiah( "50000" ) ).toBe( "Rp. 50.000" )
      expect( formatRupiah( "1234567" ) ).toBe( "Rp. 1.234.567" )
    } )

    it( "should handle numbers with non-digit characters", () => {
      expect( formatRupiah( "Rp. 100.000" ) ).toBe( "Rp. 100.000" )
      expect( formatRupiah( "$1,500" ) ).toBe( "Rp. 1.500" )
    } )
  } )

  describe( "without currency prefix (withoutText: true)", () => {
    it( "should format number without Rp. prefix", () => {
      expect( formatRupiah( 1000, true ) ).toBe( "1.000" )
      expect( formatRupiah( 1500000, true ) ).toBe( "1.500.000" )
    } )

    it( "should format string numbers without prefix", () => {
      expect( formatRupiah( "75000", true ) ).toBe( "75.000" )
    } )
  } )

  describe( "edge cases", () => {
    it( "should return '0' for falsy values", () => {
      expect( formatRupiah( 0 ) ).toBe( "0" )
      expect( formatRupiah( "" ) ).toBe( "0" )
    } )

    it( "should return empty string for non-numeric strings", () => {
      expect( formatRupiah( "abc" ) ).toBe( "" )
      expect( formatRupiah( "---" ) ).toBe( "" )
    } )

    it( "should handle small numbers", () => {
      expect( formatRupiah( 1 ) ).toBe( "Rp. 1" )
      expect( formatRupiah( 99 ) ).toBe( "Rp. 99" )
      expect( formatRupiah( 999 ) ).toBe( "Rp. 999" )
    } )

    it( "should handle large numbers", () => {
      expect( formatRupiah( 1000000000 ) ).toBe( "Rp. 1.000.000.000" )
    } )
  } )
} )
