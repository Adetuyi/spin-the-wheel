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

export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { spinId } = await request.json()
  if (!spinId) {
    return NextResponse.json({ error: 'spinId is required.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('spins')
    .update({ claimed: true, claimed_at: new Date().toISOString() })
    .eq('id', spinId)

  if (error) {
    return NextResponse.json({ error: 'Failed to mark as claimed.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
