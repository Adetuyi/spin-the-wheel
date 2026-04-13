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

  const [leadsRes, spinsRes] = await Promise.all([
    supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('spins').select('prize_slug, claimed'),
  ])

  const totalLeads = leadsRes.count ?? 0
  const spins = spinsRes.data ?? []
  const totalSpins = spins.length
  const claimed = spins.filter((s) => s.claimed).length
  const unclaimed = spins.filter(
    (s) => !s.claimed && s.prize_slug !== 'no_prize' && s.prize_slug !== 'spin_again'
  ).length

  const prizeCounts: Record<string, number> = {}
  for (const spin of spins) {
    prizeCounts[spin.prize_slug] = (prizeCounts[spin.prize_slug] ?? 0) + 1
  }

  return NextResponse.json({ totalLeads, totalSpins, claimed, unclaimed, prizeCounts })
}
