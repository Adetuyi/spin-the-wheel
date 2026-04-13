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

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? ''
          const str = String(val).replace(/"/g, '""')
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str}"`
            : str
        })
        .join(',')
    ),
  ]
  return lines.join('\r\n')
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const type = request.nextUrl.searchParams.get('type') ?? 'leads'

  if (type === 'leads') {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('id, email, phone, company_name, role, referral_code, referred_by_code, spins_remaining, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Export failed.' }, { status: 500 })

    const csv = toCSV(data as Record<string, unknown>[])
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="chekkit-leads-${Date.now()}.csv"`,
      },
    })
  }

  if (type === 'spins') {
    const { data, error } = await supabaseAdmin
      .from('spins')
      .select(`
        id,
        prize_slug,
        prize_name,
        claimed,
        claimed_at,
        created_at,
        leads ( email, phone, company_name, role )
      `)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Export failed.' }, { status: 500 })

    const rows = (data ?? []).map((s: any) => ({
      id: s.id,
      email: s.leads?.email ?? '',
      phone: s.leads?.phone ?? '',
      company: s.leads?.company_name ?? '',
      role: s.leads?.role ?? '',
      prize_slug: s.prize_slug,
      prize_name: s.prize_name,
      claimed: s.claimed ? 'Yes' : 'No',
      claimed_at: s.claimed_at ?? '',
      spun_at: s.created_at,
    }))

    const csv = toCSV(rows)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="chekkit-spins-${Date.now()}.csv"`,
      },
    })
  }

  return NextResponse.json({ error: 'Invalid type.' }, { status: 400 })
}
