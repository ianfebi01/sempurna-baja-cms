import clientPromise, { DB_NAME } from "~~/server/lib/mongodb"
import { ALLOWLIST_COLLECTION, type Role } from "~~/server/models/allowlist.schema"
import { USER_COLLECTION } from "~~/server/models/user.schema"

// Helper to send error message to parent window and close popup
function sendErrorToParent( event: Parameters<typeof setHeader>[0], errorCode: string ) {
  setHeader( event, "Content-Type", "text/html" )
  return send( event, `
    <!DOCTYPE html>
    <html>
    <head><title>Login Error</title></head>
    <body>
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'oauth-error', error: '${errorCode}' }, window.location.origin);
          window.close();
        } else {
          window.location.href = '/login?error=${errorCode}';
        }
      </script>
      <p>Redirecting...</p>
    </body>
    </html>
  ` )
}

export default defineOAuthGoogleEventHandler( {
  config: {
    scope: ["profile", "email"],
  },
  async onSuccess( event, { user } ) {
    const client = await clientPromise
    if ( !client ) return sendErrorToParent( event, "db_connection" )

    const db = client.db( DB_NAME )
    const emailNorm = String( user.email ).trim().toLowerCase()

    // Check if user exists
    const existingUser = await db.collection( USER_COLLECTION ).findOne( { email: emailNorm } )

    let role: Role = "admin"

    if ( existingUser ) {
      // Check if existing user is still in allowlist
      const allowed = await db.collection( ALLOWLIST_COLLECTION ).findOne( { email: emailNorm } )
      role = ( existingUser as { role?: Role } ).role ?? "admin"

      if ( !allowed ) {
        // Edge case: user exists but not in allowlist
        // Check if allowlist is empty (possibly cleared by accident)
        const allowlistCount = await db.collection( ALLOWLIST_COLLECTION ).countDocuments( {} )

        if ( allowlistCount === 0 ) {
          // Restore user to allowlist with their existing role
          await db.collection( ALLOWLIST_COLLECTION ).insertOne( { email: emailNorm, role } )
        } else {
          // Allowlist has entries but user is not in it - deny access
          return sendErrorToParent( event, "not_allowed" )
        }
      }
    } else {
      // New user registration
      const usersCount = await db.collection( USER_COLLECTION ).countDocuments( {} )

      if ( usersCount === 0 ) {
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

        if ( !allowed ) return sendErrorToParent( event, "not_allowed" )
        role = ( allowed as { role?: Role } ).role ?? "admin"
      }

      // Create user
      await db.collection( USER_COLLECTION ).insertOne( {
        email    : emailNorm,
        name     : user.name,
        picture  : user.picture,
        googleId : user.sub,
        role,
      } )
    }

    await setUserSession( event, {
      user: {
        googleId : user.sub,
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
    return sendErrorToParent( event, "oauth_failed" )
  },
} )
