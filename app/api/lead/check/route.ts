import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isPersonalEmail, PERSONAL_EMAIL_ERROR, getEmailDomain } from '@/lib/email-validation'

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

  const normalised = email.toLowerCase().trim()

  // Check allowlist first — if explicitly allowed, skip domain check
  const { data: allowed } = await supabaseAdmin
    .from('email_allowlist')
    .select('id')
    .eq('email', normalised)
    .maybeSingle()

  if (!allowed && isPersonalEmail(normalised)) {
    return NextResponse.json({ error: PERSONAL_EMAIL_ERROR }, { status: 422 })
  }

  // Check if this email is already registered
  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('email', normalised)
    .maybeSingle()

  return NextResponse.json({ exists: !!lead })
}
