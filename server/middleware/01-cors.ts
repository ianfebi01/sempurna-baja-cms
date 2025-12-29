const allowedOrigins = [
  'http://localhost:3000',
  'https://www.sempurnabaja.com',
  'https://sempurnabaja.com',
]

export default defineEventHandler((event) => {
  const origin = getHeader(event, 'origin')

  if (origin && allowedOrigins.includes(origin)) {
    setHeader(event, 'Access-Control-Allow-Origin', origin)
    setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
    setHeader(event, 'Access-Control-Allow-Credentials', 'true')
  }

  // Handle preflight requests
  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
