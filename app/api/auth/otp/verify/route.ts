import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'

const OTP_SECRET_PEPPER = process.env.OTP_SECRET_PEPPER as string

function deriveInternalEmail(phoneE164: string): string {
  // Create a stable, unique email alias for phone users
  const sanitized = phoneE164.replace(/[^0-9+]/g, '')
  return `${sanitized}@sms.local`
}

function deriveInternalPassword(phoneE164: string): string {
  const crypto = require('crypto') as typeof import('crypto')
  // Strong deterministic password derived from phone and server secret
  return crypto
    .createHmac('sha256', OTP_SECRET_PEPPER)
    .update(`pw:${phoneE164}`)
    .digest('hex')
}

function hashCode(code: string): string {
  const crypto = require('crypto') as typeof import('crypto')
  return crypto.createHash('sha256').update(`${code}:${OTP_SECRET_PEPPER}`).digest('hex')
}

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json()
    if (!phone || !code) return NextResponse.json({ error: 'ورودی نامعتبر' }, { status: 400 })

    const supabase = await createClient()
    const admin = await createAdminClient()

    const { data: rows, error } = await admin
      .from('otp_codes')
      .select('*')
      .eq('phone', phone.startsWith('+') ? phone : `+98${phone.replace(/^0/, '')}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !rows) return NextResponse.json({ error: 'کدی یافت نشد' }, { status: 400 })

    if (rows.consumed) return NextResponse.json({ error: 'کد مصرف شده است' }, { status: 400 })
    if (new Date(rows.expires_at).getTime() < Date.now()) return NextResponse.json({ error: 'کد منقضی شده' }, { status: 400 })

    const ok = rows.code_hash === hashCode(String(code))
    if (!ok) {
      await admin.from('otp_codes').update({ attempts: rows.attempts + 1 }).eq('id', rows.id)
      return NextResponse.json({ error: 'کد اشتباه است' }, { status: 400 })
    }

    await admin.from('otp_codes').update({ consumed: true }).eq('id', rows.id)

    // Create or fetch a Supabase user using Service Role
    const phoneE164 = rows.phone as string
    const emailAlias = deriveInternalEmail(phoneE164)
    const derivedPassword = deriveInternalPassword(phoneE164)

    // Try to find user by email alias
    // Admin list users by email not available directly; try sign in; if fails create
    let needCreate = false
    let signInRes = await supabase.auth.signInWithPassword({ email: emailAlias, password: derivedPassword })
    if (signInRes.error) {
      needCreate = true
    }

    if (needCreate) {
      const createRes = await admin.auth.admin.createUser({
        email: emailAlias,
        password: derivedPassword,
        email_confirm: true,
        user_metadata: { phone: phoneE164, auth_via: 'sms_ir' },
      })
      if (createRes.error) {
        return NextResponse.json({ error: 'ساخت کاربر ناموفق بود' }, { status: 500 })
      }
      // Now sign in to create a session and set cookies
      signInRes = await supabase.auth.signInWithPassword({ email: emailAlias, password: derivedPassword })
      if (signInRes.error) {
        return NextResponse.json({ error: 'ورود کاربر ناموفق بود' }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'خطای غیرمنتظره' }, { status: 500 })
  }
}


