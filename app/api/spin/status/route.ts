import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ spinsRemaining: 0 })
  }

  const { data: lead } = await supabaseAdmin
    .from('leads')
    .select('spins_remaining')
    .eq('id', session.leadId)
    .single()

  return NextResponse.json({ spinsRemaining: lead?.spins_remaining ?? 0 })
}
