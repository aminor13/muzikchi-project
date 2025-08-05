import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 })
    }

    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
    
    if (!secretKey) {
      console.error('Secret key not configured')
      return NextResponse.json({ success: false, error: 'Secret key not configured' }, { status: 500 })
    }

    // Verify the token with Cloudflare
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    })

    const verifyData = await verifyResponse.json()

    if (verifyData.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Token verification failed',
        details: verifyData['error-codes']
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
} 