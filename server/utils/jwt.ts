import type { AuthPayload } from "#shared/types"
import type { JWTVerifyOptions} from "jose"
import { SignJWT, jwtVerify } from "jose"

const { mongo } = useRuntimeConfig().auth

if ( !mongo.secret ) throw new Error( "JWT secret is missing" )
const JWT_SECRET = new TextEncoder().encode( mongo.secret )

export async function createJWT( email: string, role?: string ) {
  return await new SignJWT( { email, role } as AuthPayload )
    .setProtectedHeader( { alg: "HS256" } )
    .setIssuer( "sempurna-baja.nuxt.space" )
    .setIssuedAt()
    .setExpirationTime( "2h" )
    .sign( JWT_SECRET )  
}

export async function verifyJWT( token: string ) {
  const options: JWTVerifyOptions = { clockTolerance: 60 }
  return ( await jwtVerify( token, JWT_SECRET, options ) ).payload as AuthPayload
}
