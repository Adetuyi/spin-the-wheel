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
  try { await jwtVerify(token, adminSecret); return true } catch { return false }
}

// PATCH — set spins_remaining for a lead to a given count (default 1)
export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leadId, spins = 1 } = await request.json()
  if (!leadId) return NextResponse.json({ error: 'leadId is required.' }, { status: 400 })

  const count = Math.max(0, Math.min(10, Number(spins))) // clamp 0–10

  const { error } = await supabaseAdmin
    .from('leads')
    .update({ spins_remaining: count })
    .eq('id', leadId)

  if (error) return NextResponse.json({ error: 'Failed to reset spins.' }, { status: 500 })
  return NextResponse.json({ success: true, spins_remaining: count })
}
