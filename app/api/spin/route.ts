import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession, createSession, getSessionCookieName } from '@/lib/session'
import { PRIZES, getAvailablePrizes, pickPrize } from '@/lib/prizes'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { leadId } = session

  // Fetch lead and check spins
  const { data: lead, error: leadError } = await supabaseAdmin
    .from('leads')
    .select('id, spins_remaining')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found.' }, { status: 404 })
  }

  if (lead.spins_remaining <= 0) {
    return NextResponse.json({ error: 'No spins remaining.' }, { status: 403 })
  }

  // Get prize inventory counts
  const { data: spentData } = await supabaseAdmin
    .from('spins')
    .select('prize_slug')
    .not('prize_slug', 'in', '(no_prize,spin_again)')

  const spentCounts: Record<string, number> = {}
  for (const row of spentData ?? []) {
    spentCounts[row.prize_slug] = (spentCounts[row.prize_slug] ?? 0) + 1
  }

  // Pick a prize
  const available = getAvailablePrizes(spentCounts)
  const prize = pickPrize(available)

  // Decrement spins atomically
  const { data: updatedLead, error: updateError } = await supabaseAdmin
    .from('leads')
    .update({ spins_remaining: lead.spins_remaining - 1 })
    .eq('id', leadId)
    .eq('spins_remaining', lead.spins_remaining) // optimistic lock
    .select('spins_remaining')
    .single()

  if (updateError || !updatedLead) {
    // Race condition — re-check
    return NextResponse.json({ error: 'Spin failed. Please try again.' }, { status: 409 })
  }

  const newSpinsRemaining = updatedLead.spins_remaining

  // Handle "spin again" — don't save as a win, just grant a spin back
  if (prize.slug === 'spin_again') {
    await supabaseAdmin
      .from('leads')
      .update({ spins_remaining: newSpinsRemaining + 1 })
      .eq('id', leadId)

    await supabaseAdmin.from('spins').insert({
      lead_id: leadId,
      prize_slug: 'spin_again',
      prize_name: 'Spin Again!',
      claimed: false,
    })

    const newToken = await createSession({ leadId, spinsRemaining: newSpinsRemaining + 1 })
    const response = NextResponse.json({
      prizeSlug: 'spin_again',
      prizeName: 'Spin Again!',
      spinsRemaining: newSpinsRemaining + 1,
    })
    response.cookies.set(getSessionCookieName(), newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })
    return response
  }

  // Save the spin result
  await supabaseAdmin.from('spins').insert({
    lead_id: leadId,
    prize_slug: prize.slug,
    prize_name: prize.name,
    claimed: false,
  })

  // Refresh session with updated spin count
  const newToken = await createSession({ leadId, spinsRemaining: newSpinsRemaining })
  const response = NextResponse.json({
    prizeSlug: prize.slug,
    prizeName: prize.name,
    spinsRemaining: newSpinsRemaining,
  })
  response.cookies.set(getSessionCookieName(), newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return response
}
