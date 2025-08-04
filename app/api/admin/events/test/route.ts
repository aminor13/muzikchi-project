import { NextRequest } from 'next/server'

export async function GET() {
  return new Response(JSON.stringify({ message: 'Test API route working' }), {
    headers: { 'Content-Type': 'application/json' }
  })
} 