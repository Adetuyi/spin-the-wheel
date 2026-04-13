'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LandingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')

  const [form, setForm] = useState({
    email: '',
    phone: '',
    company_name: '',
    role: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.email || !form.phone) {
      setError('Email and phone number are required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, referred_by_code: refCode ?? null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      router.push('/spin')
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-10 relative"
      style={{ fontFamily: 'var(--font-instrument), sans-serif' }}
    >
      {/* Background decorative elements */}
      <div
        className="fixed top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(71,247,173,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div
        className="fixed bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(21,56,83,0.9) 0%, transparent 70%)',
          filter: 'blur(50px)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      {/* Geometric grid lines */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(71,247,173,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(71,247,173,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo + header */}
        <div
          className="text-center mb-8"
          style={{ animation: 'fadeUp 0.5s ease forwards', opacity: 0 }}
        >
          <div className="flex justify-center mb-5">
            <div
              className="relative"
              style={{
                padding: '12px 20px',
                background: 'rgba(21,56,83,0.5)',
                borderRadius: '14px',
                border: '1px solid rgba(71,247,173,0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Image
                src="/logo.webp"
                alt="Chekkit"
                width={120}
                height={40}
                style={{ objectFit: 'contain', height: 36, width: 'auto' }}
                priority
              />
            </div>
          </div>

          <div
            className="badge badge-primary mb-4 mx-auto"
            style={{ width: 'fit-content' }}
          >
            🎉 Pharma West Africa 2025
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: 'clamp(1.8rem, 6vw, 2.4rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              marginBottom: '10px',
            }}
          >
            Spin &amp; Win
            <br />
            <span className="glow-text">Exclusive Rewards</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Enter your details below to play. <br />
            One spin guaranteed. Refer a colleague for another.
          </p>
        </div>

        {/* Form card */}
        <div
          className="card p-6"
          style={{ animation: 'fadeUp 0.5s ease 0.15s forwards', opacity: 0 }}
        >
          {refCode && (
            <div
              className="mb-5 p-3 rounded-xl text-sm text-center"
              style={{
                background: 'rgba(71,247,173,0.1)',
                border: '1px solid rgba(71,247,173,0.3)',
                color: 'var(--primary)',
              }}
            >
              🎁 Referral applied! You&apos;ll get your free spin.
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="input-label" style={{ fontFamily: 'var(--font-syne)' }}>
                Business Email *
              </label>
              <input
                className="input"
                style={{ fontFamily: 'var(--font-instrument)' }}
                type="email"
                name="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="input-label" style={{ fontFamily: 'var(--font-syne)' }}>
                Phone Number *
              </label>
              <input
                className="input"
                style={{ fontFamily: 'var(--font-instrument)' }}
                type="tel"
                name="phone"
                placeholder="+234 800 000 0000"
                value={form.phone}
                onChange={handleChange}
                required
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="input-label" style={{ fontFamily: 'var(--font-syne)' }}>
                Company Name
              </label>
              <input
                className="input"
                style={{ fontFamily: 'var(--font-instrument)' }}
                type="text"
                name="company_name"
                placeholder="Your company"
                value={form.company_name}
                onChange={handleChange}
                autoComplete="organization"
              />
            </div>

            <div>
              <label className="input-label" style={{ fontFamily: 'var(--font-syne)' }}>
                Your Role
              </label>
              <select
                className="input"
                style={{ fontFamily: 'var(--font-instrument)' }}
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="">Select your role</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Distributor">Distributor</option>
                <option value="Manufacturer">Manufacturer</option>
                <option value="Retailer">Retailer</option>
                <option value="Regulator">Regulator</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {error && (
              <div
                className="text-sm p-3 rounded-xl text-center"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary mt-2"
              style={{ fontFamily: 'var(--font-syne)' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Setting up your spin…
                </>
              ) : (
                <>
                  🎰 Play Now
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prize preview strip */}
        <div
          className="mt-6"
          style={{ animation: 'fadeUp 0.5s ease 0.3s forwards', opacity: 0 }}
        >
          <p
            className="text-center text-xs mb-3"
            style={{
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-syne)',
            }}
          >
            Prizes up for grabs
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {PRIZE_PREVIEWS.map((p) => (
              <span
                key={p}
                className="text-xs px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(21,56,83,0.7)',
                  border: '1px solid rgba(71,247,173,0.15)',
                  color: 'var(--text-secondary)',
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-instrument)' }}
        >
          Powered by Chekkit · Pharma West Africa 2025
        </p>
      </div>
    </div>
  )
}

const PRIZE_PREVIEWS = [
  '📱 Airtime ₦500',
  '💳 Airtime ₦1,000',
  '🏷️ 100K MAS Label',
  '🚀 Chektrace Pilot',
  '📒 Notepad',
  '🖊️ Smart Pen',
  '🔑 Key Holder',
]

function SpinnerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingContent />
    </Suspense>
  )
}
