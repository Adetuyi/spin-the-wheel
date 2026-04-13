import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSession, getSessionCookieName } from '@/lib/session'
import { isPersonalEmail, PERSONAL_EMAIL_ERROR } from '@/lib/email-validation'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, company_name, role, referred_by_code } = body

    if (!email || !phone) {
      return NextResponse.json({ error: 'Email and phone are required.' }, { status: 400 })
    }

    const normalisedEmail = email.toLowerCase().trim()

    // Check allowlist before domain validation
    const { data: allowed } = await supabaseAdmin
      .from('email_allowlist')
      .select('id')
      .eq('email', normalisedEmail)
      .maybeSingle()

    if (!allowed && isPersonalEmail(normalisedEmail)) {
      return NextResponse.json({ error: PERSONAL_EMAIL_ERROR }, { status: 422 })
    }

    // Check if email already registered
    const { data: existing } = await supabaseAdmin
      .from('leads')
      .select('id, spins_remaining, referral_code')
      .eq('email', normalisedEmail)
      .maybeSingle()

    if (existing) {
      // Already registered — create new session with their remaining spins
      const token = await createSession({
        leadId: existing.id,
        spinsRemaining: existing.spins_remaining,
      })
      const response = NextResponse.json({ success: true, alreadyRegistered: true })
      response.cookies.set(getSessionCookieName(), token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      })
      return response
    }

    // Validate referral code if provided
    let referrerId: string | null = null
    if (referred_by_code) {
      const { data: referrer } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('referral_code', referred_by_code.toUpperCase().trim())
        .maybeSingle()
      if (referrer) referrerId = referrer.id
    }

    // Generate unique referral code
    let referralCode = nanoid()
    // Ensure uniqueness (retry on collision)
    for (let i = 0; i < 5; i++) {
      const { data: collision } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('referral_code', referralCode)
        .maybeSingle()
      if (!collision) break
      referralCode = nanoid()
    }

    // Insert lead
    const { data: lead, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({
        email: normalisedEmail,
        phone: phone.trim(),
        company_name: company_name?.trim() || null,
        role: role || null,
        referral_code: referralCode,
        referred_by_code: referred_by_code?.toUpperCase().trim() || null,
        spins_remaining: 1,
      })
      .select('id, spins_remaining')
      .single()

    if (insertError || !lead) {
      console.error('Lead insert error:', insertError)
      return NextResponse.json({ error: 'Failed to register. Please try again.' }, { status: 500 })
    }

    // Credit referrer with a bonus spin
    if (referrerId) {
      await supabaseAdmin.rpc('increment_spins', { lead_id: referrerId })
    }

    // Create session
    const token = await createSession({
      leadId: lead.id,
      spinsRemaining: lead.spins_remaining,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    return response
  } catch (err) {
    console.error('Lead API error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
