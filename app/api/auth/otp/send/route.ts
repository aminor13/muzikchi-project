export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'

const SMSIR_API_KEY = process.env.SMSIR_API_KEY as string
const SMSIR_TEMPLATE_ID = process.env.SMSIR_TEMPLATE_ID as string
const OTP_SECRET_PEPPER = process.env.OTP_SECRET_PEPPER as string

function normalizeIranPhone(input: string): string | null {
  const digits = input.replace(/[^0-9]/g, '')
  if (digits.startsWith('09') && digits.length === 11) return `+98${digits.slice(1)}`
  if (digits.startsWith('989') && digits.length === 12) return `+${digits}`
  if (digits.startsWith('9') && digits.length === 10) return `+98${digits}`
  return null
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(`${code}:${OTP_SECRET_PEPPER}`).digest('hex')
}

export async function POST(req: Request) {
  try {
    const missing: string[] = []
    if (!SMSIR_API_KEY) missing.push('SMSIR_API_KEY')
    if (!SMSIR_TEMPLATE_ID) missing.push('SMSIR_TEMPLATE_ID')
    if (!OTP_SECRET_PEPPER) missing.push('OTP_SECRET_PEPPER')
    if (missing.length > 0) {
      return NextResponse.json({ error: 'Server not configured', missing }, { status: 500 })
    }

    const { phone } = await req.json()
    const normalized = normalizeIranPhone(phone)
    if (!normalized) {
      return NextResponse.json({ error: 'شماره معتبر نیست' }, { status: 400 })
    }

    // rate limit by phone: reuse last non-expired code
    const supabase = await createClient()
    const admin = await createAdminClient()

    const expiresAt = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const codeHash = hashCode(code)

    const { error: insertError } = await admin
      .from('otp_codes')
      .insert({ phone: normalized, code_hash: codeHash, expires_at: expiresAt })

    if (insertError) {
      return NextResponse.json({ error: 'خطا در ذخیره کد', details: insertError.message }, { status: 500 })
    }

    // send via sms.ir
    const payload = {
      mobile: normalized.replace('+98', '0').replace('+', ''),
      templateId: Number(SMSIR_TEMPLATE_ID),
      parameters: [
        {
          name: 'CODE',
          value: code,
        },
      ],
    }

    // TEMP LOG: mask phone and log outbound payload (no secrets)
    const mask = (msisdn: string) => msisdn.replace(/(\d{3})\d{5}(\d{3})/, '$1*****$2')
    console.log('otp/send -> payload', {
      mobile: mask(payload.mobile),
      templateId: payload.templateId,
      params: payload.parameters?.map(p => ({ name: p.name, len: String(p.value).length })),
    })

    const smsResponse = await fetch('https://api.sms.ir/v1/send/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-api-key': SMSIR_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await smsResponse.text();
    // TEMP LOG: only read body once
    console.log('otp/send -> sms.ir response', { status: smsResponse.status, body: responseText.slice(0, 500) });
    let smsData: any = {};
    try { smsData = JSON.parse(responseText); } catch {}

    if (!smsResponse.ok || smsData?.status === 0) {
      return NextResponse.json({
        error: 'ارسال پیامک ناموفق بود',
        status: smsResponse.status,
        sms: smsData,
        raw: smsData && Object.keys(smsData).length ? undefined : responseText
      }, { status: 502 });
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('otp/send error', e)
    return NextResponse.json({ error: 'خطای غیرمنتظره', details: e?.message || String(e) }, { status: 500 })
  }
}


