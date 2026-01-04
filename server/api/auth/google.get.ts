import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { ALLOWLIST_COLLECTION, type Role } from "~~/server/models/allowlist.schema"
import { USER_COLLECTION } from "~~/server/models/user.schema"

export default defineOAuthGoogleEventHandler( {
  config: {
    scope: ["profile", "email"],
  },
  async onSuccess( event, { user } ) {
    const client = await clientPromise
    if ( !client ) return sendRedirect( event, "/login?error=db_connection" )

    const db = client.db( DB_NAME )
    const emailNorm = String( user.email ).trim().toLowerCase()

    // Check if user exists
    const existingUser = await db.collection( USER_COLLECTION ).findOne( { email: emailNorm } )

    let role: Role = "admin"

    if ( existingUser ) {
      role = ( existingUser as { role?: Role } ).role ?? "admin"
    } else {
      // New user registration
      const usersCount = await db.collection( USER_COLLECTION ).countDocuments( {} )

      if ( usersCount <= 1 ) {
        // First user = super-admin
        role = "super-admin"
        await db.collection( ALLOWLIST_COLLECTION ).updateOne(
          { email: emailNorm },
          { $setOnInsert: { email: emailNorm, role } },
          { upsert: true },
        )
      } else {
        // Check allowlist
        const allowed = await db.collection( ALLOWLIST_COLLECTION ).findOne( { email: emailNorm } )
        if ( !allowed ) return sendRedirect( event, "/login?error=not_allowed" )
        role = ( allowed as { role?: Role } ).role ?? "admin"
      }

      // Create user
      await db.collection( USER_COLLECTION ).insertOne( {
        email    : emailNorm,
        name     : user.name,
        picture  : user.picture,
        googleId : user.id,
        role,
      } )
    }

    await setUserSession( event, {
      user: {
        googleId : user.id,
        name     : user.name,
        email    : user.email,
        picture  : user.picture,
        role,
      },
    } )
    return sendRedirect( event, "/" )
  },
  onError( event, error ) {
    console.error( "Google OAuth error:", error )
    return sendRedirect( event, "/login?error=oauth_failed" )
  },
} )
