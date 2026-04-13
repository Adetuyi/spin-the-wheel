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

// GET — list all allowlisted emails
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('email_allowlist')
    .select('*')
    .order('added_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch allowlist.' }, { status: 500 })
  return NextResponse.json({ allowlist: data })
}

// POST — add an email to the allowlist
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, note } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('email_allowlist')
    .insert({ email: email.toLowerCase().trim(), note: note ?? null })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Email already in allowlist.' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to add email.' }, { status: 500 })
  }
  return NextResponse.json({ entry: data }, { status: 201 })
}

// DELETE — remove an email from the allowlist
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })

  const { error } = await supabaseAdmin.from('email_allowlist').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to remove email.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
