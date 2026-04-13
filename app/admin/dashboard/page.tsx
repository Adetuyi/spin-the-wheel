'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PRIZES } from '@/lib/prizes'

type Lead = {
  id: string
  email: string
  phone: string
  company_name: string | null
  role: string | null
  referral_code: string
  referred_by_code: string | null
  spins_remaining: number
  created_at: string
}

type Spin = {
  id: string
  lead_id: string
  prize_slug: string
  prize_name: string
  claimed: boolean
  claimed_at: string | null
  created_at: string
  lead_email: string
  lead_phone: string
  lead_company: string | null
}

type Stats = {
  totalLeads: number
  totalSpins: number
  claimed: number
  unclaimed: number
  prizeCounts: Record<string, number>
}

type AllowlistEntry = {
  id: string
  email: string
  note: string | null
  added_at: string
}

type Tab = 'spins' | 'leads' | 'stats' | 'allowlist'

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('spins')
  const [leads, setLeads] = useState<Lead[]>([])
  const [spins, setSpins] = useState<Spin[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [allowlist, setAllowlist] = useState<AllowlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unclaimed' | 'claimed'>('unclaimed')
  // Allowlist form
  const [newEmail, setNewEmail] = useState('')
  const [newNote, setNewNote] = useState('')
  const [allowlistLoading, setAllowlistLoading] = useState(false)
  const [allowlistError, setAllowlistError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [leadsRes, spinsRes, statsRes, allowlistRes] = await Promise.all([
        fetch('/api/admin/leads'),
        fetch('/api/admin/spins'),
        fetch('/api/admin/stats'),
        fetch('/api/admin/allowlist'),
      ])
      if (leadsRes.status === 401 || spinsRes.status === 401) {
        router.push('/admin')
        return
      }
      const leadsData = await leadsRes.json()
      const spinsData = await spinsRes.json()
      const statsData = await statsRes.json()
      const allowlistData = await allowlistRes.json()
      setLeads(leadsData.leads ?? [])
      setSpins(spinsData.spins ?? [])
      setStats(statsData)
      setAllowlist(allowlistData.allowlist ?? [])
    } catch {
      // silently retry on next tab switch
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleClaim = async (spinId: string) => {
    setClaimingId(spinId)
    try {
      const res = await fetch('/api/admin/claim', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spinId }),
      })
      if (res.ok) {
        setSpins((prev) => prev.map((s) => s.id === spinId ? { ...s, claimed: true, claimed_at: new Date().toISOString() } : s))
      }
    } finally {
      setClaimingId(null)
    }
  }

  const handleResetSpins = async (leadId: string, spins: number) => {
    setResettingId(leadId)
    try {
      const res = await fetch('/api/admin/reset-spins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, spins }),
      })
      if (res.ok) {
        setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, spins_remaining: spins } : l))
      }
    } finally {
      setResettingId(null)
    }
  }

  const handleAddAllowlist = async (e: React.FormEvent) => {
    e.preventDefault()
    setAllowlistError('')
    setAllowlistLoading(true)
    try {
      const res = await fetch('/api/admin/allowlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, note: newNote }),
      })
      const data = await res.json()
      if (!res.ok) { setAllowlistError(data.error ?? 'Failed to add email.'); return }
      setAllowlist((prev) => [data.entry, ...prev])
      setNewEmail('')
      setNewNote('')
    } finally {
      setAllowlistLoading(false)
    }
  }

  const handleRemoveAllowlist = async (id: string) => {
    await fetch('/api/admin/allowlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setAllowlist((prev) => prev.filter((e) => e.id !== id))
  }

  const handleExportLeads = () => {
    window.open('/api/admin/export?type=leads', '_blank')
  }

  const handleExportSpins = () => {
    window.open('/api/admin/export?type=spins', '_blank')
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  const filteredSpins = spins.filter((s) => {
    if (filter === 'unclaimed') return !s.claimed && s.prize_slug !== 'no_prize' && s.prize_slug !== 'spin_again'
    if (filter === 'claimed') return s.claimed
    return true
  })

  const tabStyle = (t: Tab) => ({
    fontFamily: 'var(--font-syne)',
    fontWeight: 700,
    fontSize: '0.8rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: tab === t ? 'var(--primary)' : 'transparent',
    color: tab === t ? 'var(--secondary-dark)' : 'var(--text-muted)',
  })

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ fontFamily: 'var(--font-instrument), sans-serif' }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
        style={{
          background: 'rgba(11,34,51,0.9)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <Image src="/logo.webp" alt="Chekkit" width={80} height={26} style={{ objectFit: 'contain', height: 24, width: 'auto' }} />
          <div
            className="badge badge-primary"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Admin
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </header>

      {/* Tab nav */}
      <div
        className="flex items-center gap-1 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button style={tabStyle('spins')} onClick={() => setTab('spins')}>Prizes</button>
        <button style={tabStyle('leads')} onClick={() => setTab('leads')}>Leads</button>
        <button style={tabStyle('stats')} onClick={() => setTab('stats')}>Stats</button>
        <button style={tabStyle('allowlist')} onClick={() => setTab('allowlist')}>Allowlist</button>
      </div>

      <main className="flex-1 px-4 py-4 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-syne)', fontSize: '0.85rem' }}>
              Loading…
            </p>
          </div>
        ) : (
          <>
            {/* ── Spins / Prizes tab ── */}
            {tab === 'spins' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex gap-1">
                    {(['all', 'unclaimed', 'claimed'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                          fontFamily: 'var(--font-syne)',
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: '1px solid',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          borderColor: filter === f ? 'var(--primary)' : 'var(--border)',
                          background: filter === f ? 'rgba(71,247,173,0.12)' : 'transparent',
                          color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleExportSpins}
                    style={{
                      fontFamily: 'var(--font-syne)',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-bright)',
                      background: 'transparent',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                    }}
                  >
                    ↓ Export CSV
                  </button>
                </div>

                {filteredSpins.length === 0 ? (
                  <div className="card p-8 text-center">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No results found.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {filteredSpins.map((spin) => {
                      const prize = PRIZES.find((p) => p.slug === spin.prize_slug)
                      return (
                        <div
                          key={spin.id}
                          className="card p-4 flex items-center justify-between gap-3"
                          style={{
                            borderColor: spin.claimed ? 'rgba(71,247,173,0.1)' : 'rgba(71,247,173,0.25)',
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{prize?.emoji ?? '🎁'}</span>
                            <div className="min-w-0">
                              <p
                                style={{
                                  fontFamily: 'var(--font-syne)',
                                  fontWeight: 700,
                                  fontSize: '0.875rem',
                                  color: 'var(--text-primary)',
                                  marginBottom: '2px',
                                }}
                              >
                                {spin.prize_name}
                              </p>
                              <p
                                className="truncate"
                                style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
                              >
                                {spin.lead_email}
                              </p>
                              {spin.lead_company && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                  {spin.lead_company}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {spin.claimed ? (
                              <span className="badge badge-primary" style={{ fontFamily: 'var(--font-syne)' }}>
                                ✓ Given
                              </span>
                            ) : (
                              <button
                                onClick={() => handleClaim(spin.id)}
                                disabled={claimingId === spin.id}
                                style={{
                                  fontFamily: 'var(--font-syne)',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  letterSpacing: '0.05em',
                                  textTransform: 'uppercase',
                                  padding: '7px 14px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: 'var(--primary)',
                                  color: 'var(--secondary-dark)',
                                  cursor: 'pointer',
                                  opacity: claimingId === spin.id ? 0.6 : 1,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {claimingId === spin.id ? '…' : 'Mark Given'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Leads tab ── */}
            {tab === 'leads' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {leads.length} total lead{leads.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={handleExportLeads}
                    style={{
                      fontFamily: 'var(--font-syne)',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-bright)',
                      background: 'transparent',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                    }}
                  >
                    ↓ Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto card-solid">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Company</th>
                        <th>Role</th>
                        <th>Spins Left</th>
                        <th>Ref Code</th>
                        <th>Referred By</th>
                        <th>Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id}>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{lead.email}</td>
                          <td>{lead.phone}</td>
                          <td>{lead.company_name ?? '—'}</td>
                          <td>{lead.role ?? '—'}</td>
                          <td>
                            <div className="flex items-center gap-1">
                              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, color: lead.spins_remaining > 0 ? 'var(--primary)' : 'var(--text-muted)', minWidth: '18px' }}>
                                {lead.spins_remaining}
                              </span>
                              <button
                                onClick={() => handleResetSpins(lead.id, 1)}
                                disabled={resettingId === lead.id}
                                title="Reset to 1 spin"
                                style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.04em', padding: '3px 8px', borderRadius: '5px', border: '1px solid var(--border-bright)', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', opacity: resettingId === lead.id ? 0.5 : 1, whiteSpace: 'nowrap' }}
                              >
                                {resettingId === lead.id ? '…' : '↺ Reset'}
                              </button>
                              <button
                                onClick={() => handleResetSpins(lead.id, lead.spins_remaining + 1)}
                                disabled={resettingId === lead.id}
                                title="Give +1 spin"
                                style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.04em', padding: '3px 8px', borderRadius: '5px', border: '1px solid rgba(71,247,173,0.15)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', opacity: resettingId === lead.id ? 0.5 : 1 }}
                              >
                                +1
                              </button>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-primary" style={{ fontFamily: 'var(--font-syne)', fontSize: '0.65rem' }}>
                              {lead.referral_code}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{lead.referred_by_code ?? '—'}</td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {new Date(lead.created_at).toLocaleString('en-NG', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {leads.length === 0 && (
                    <div className="p-8 text-center">
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No leads yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Stats tab ── */}
            {tab === 'stats' && stats && (
              <div className="flex flex-col gap-4">
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Leads', value: stats.totalLeads, emoji: '👥' },
                    { label: 'Total Spins', value: stats.totalSpins, emoji: '🎰' },
                    { label: 'Prizes Claimed', value: stats.claimed, emoji: '✅' },
                    { label: 'Unclaimed', value: stats.unclaimed, emoji: '⏳' },
                  ].map((item) => (
                    <div key={item.label} className="card p-4 flex flex-col gap-1">
                      <p style={{ fontSize: '1.5rem' }}>{item.emoji}</p>
                      <p
                        style={{
                          fontFamily: 'var(--font-syne)',
                          fontSize: '1.6rem',
                          fontWeight: 800,
                          color: 'var(--primary)',
                          lineHeight: 1,
                        }}
                      >
                        {item.value}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-syne)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Prize breakdown */}
                <div className="card p-4">
                  <p
                    style={{
                      fontFamily: 'var(--font-syne)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: '12px',
                    }}
                  >
                    Prize Breakdown
                  </p>
                  <div className="flex flex-col gap-3">
                    {PRIZES.map((prize) => {
                      const count = stats.prizeCounts[prize.slug] ?? 0
                      const max = prize.maxQty ?? 999
                      const pct = prize.maxQty ? Math.min((count / prize.maxQty) * 100, 100) : 0
                      return (
                        <div key={prize.slug}>
                          <div className="flex items-center justify-between mb-1">
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                              {prize.emoji} {prize.name}
                            </span>
                            <span
                              style={{
                                fontFamily: 'var(--font-syne)',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                color: prize.maxQty && count >= prize.maxQty ? '#f87171' : 'var(--primary)',
                              }}
                            >
                              {count}{prize.maxQty ? `/${prize.maxQty}` : ''}
                            </span>
                          </div>
                          {prize.maxQty && (
                            <div
                              style={{
                                height: 4,
                                background: 'rgba(71,247,173,0.1)',
                                borderRadius: 2,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${pct}%`,
                                  background: pct >= 100 ? '#f87171' : 'var(--primary)',
                                  borderRadius: 2,
                                  transition: 'width 0.5s ease',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Allowlist tab ── */}
            {tab === 'allowlist' && (
              <div className="flex flex-col gap-4">
                <div className="card p-4">
                  <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Allow personal emails
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Add specific personal email addresses that should bypass the business email restriction.
                  </p>
                  <form onSubmit={handleAddAllowlist} className="flex flex-col gap-3">
                    <div>
                      <label className="input-label" style={{ fontFamily: 'var(--font-syne)' }}>Email address</label>
                      <input
                        className="input"
                        type="email"
                        placeholder="someone@gmail.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                        style={{ fontFamily: 'var(--font-instrument)' }}
                      />
                    </div>
                    <div>
                      <label className="input-label" style={{ fontFamily: 'var(--font-syne)' }}>Note (optional)</label>
                      <input
                        className="input"
                        type="text"
                        placeholder="e.g. VIP guest, speaker"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        style={{ fontFamily: 'var(--font-instrument)' }}
                      />
                    </div>
                    {allowlistError && (
                      <p style={{ fontSize: '0.8rem', color: '#f87171' }}>{allowlistError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={allowlistLoading}
                      style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'var(--secondary-dark)', cursor: 'pointer', opacity: allowlistLoading ? 0.6 : 1 }}
                    >
                      {allowlistLoading ? 'Adding…' : '+ Add Email'}
                    </button>
                  </form>
                </div>

                {allowlist.length === 0 ? (
                  <div className="card p-6 text-center">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No emails allowlisted yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {allowlist.map((entry) => (
                      <div key={entry.id} className="card p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{entry.email}</p>
                          {entry.note && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.note}</p>}
                        </div>
                        <button
                          onClick={() => handleRemoveAllowlist(entry.id)}
                          style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#f87171', cursor: 'pointer', flexShrink: 0 }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
