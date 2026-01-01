const allowedOrigins = [
  "http://localhost:3000",
  "https://www.sempurnabaja.com",
  "https://sempurnabaja.com",
]

// Check if origin is a Vercel domain (*.vercel.app)
function isVercelDomain( origin: string ): boolean {
  return /^https:\/\/[\w-]+\.vercel\.app$/.test( origin )
}

export default defineEventHandler( ( event ) => {
  const origin = getHeader( event, "origin" )

  if ( origin && ( allowedOrigins.includes( origin ) || isVercelDomain( origin ) ) ) {
    setHeader( event, "Access-Control-Allow-Origin", origin )
    setHeader( event, "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS" )
    setHeader( event, "Access-Control-Allow-Headers", "Content-Type, Authorization" )
    setHeader( event, "Access-Control-Allow-Credentials", "true" )
  }

  // Handle preflight requests
  if ( event.method === "OPTIONS" ) {
    setResponseStatus( event, 204 )
    return ""
  }
} )
