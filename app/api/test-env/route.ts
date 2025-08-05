import { NextResponse } from 'next/server'

export async function GET() {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
  
  return NextResponse.json({
    secretKeyExists: !!secretKey,
    siteKeyExists: !!siteKey,
    secretKeyLength: secretKey ? secretKey.length : 0,
    siteKeyLength: siteKey ? siteKey.length : 0,
    secretKeyStart: secretKey ? secretKey.substring(0, 10) + '...' : 'not found',
    siteKeyStart: siteKey ? siteKey.substring(0, 10) + '...' : 'not found'
  })
} 