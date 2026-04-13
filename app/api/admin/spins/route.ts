import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { jwtVerify } from 'jose'

const ADMIN_COOKIE = 'chekkit_admin'
const adminSecret = new TextEncoder().encode(
  process.env.ADMIN_SECRET ?? 'fallback-admin-secret-change-in-prod'
)

async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value
  if (!token) return false
  try {
    await jwtVerify(token, adminSecret)
    return true
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Join spins with leads for display
  const { data: spins, error } = await supabaseAdmin
    .from('spins')
    .select(`
      id,
      lead_id,
      prize_slug,
      prize_name,
      claimed,
      claimed_at,
      created_at,
      leads (
        email,
        phone,
        company_name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch spins.' }, { status: 500 })
  }

  // Flatten the join
  const flattened = (spins ?? []).map((s: any) => ({
    id: s.id,
    lead_id: s.lead_id,
    prize_slug: s.prize_slug,
    prize_name: s.prize_name,
    claimed: s.claimed,
    claimed_at: s.claimed_at,
    created_at: s.created_at,
    lead_email: s.leads?.email ?? '',
    lead_phone: s.leads?.phone ?? '',
    lead_company: s.leads?.company_name ?? null,
  }))

  return NextResponse.json({ spins: flattened })
}
