import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ referralCode: null })
  }

  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('referral_code')
    .eq('id', session.leadId)
    .single()

  return NextResponse.json({ referralCode: lead?.referral_code ?? null })
}
