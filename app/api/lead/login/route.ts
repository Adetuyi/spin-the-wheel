import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSession, getSessionCookieName } from '@/lib/session'

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('id, spins_remaining')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 })

  const token = await createSession({ leadId: lead.id, spinsRemaining: lead.spins_remaining })

  const response = NextResponse.json({ success: true })
  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return response
}
