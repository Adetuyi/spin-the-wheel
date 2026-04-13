'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Invalid password.')
        return
      }
      router.push('/admin/dashboard')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4"
      style={{ fontFamily: 'var(--font-instrument), sans-serif' }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(71,247,173,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(71,247,173,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div
        className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10"
        style={{ animation: 'fadeUp 0.5s ease forwards', opacity: 0 }}
      >
        <div
          style={{
            padding: '10px 18px',
            background: 'rgba(21,56,83,0.5)',
            borderRadius: '14px',
            border: '1px solid rgba(71,247,173,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Image src="/logo.webp" alt="Chekkit" width={110} height={36} style={{ objectFit: 'contain', height: 34, width: 'auto' }} />
        </div>

        <div className="text-center">
          <h1
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '1.6rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              marginBottom: '6px',
            }}
          >
            Admin Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Staff access only
          </p>
        </div>

        <div className="card p-6 w-full">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="input-label" style={{ fontFamily: 'var(--font-syne)' }}>
                Admin Password
              </label>
              <input
                className="input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ fontFamily: 'var(--font-instrument)' }}
              />
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
              className="btn-primary"
              style={{ fontFamily: 'var(--font-syne)' }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : '→ Sign In'}
            </button>
          </form>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Chekkit · Pharma West Africa 2025
        </p>
      </div>
    </div>
  )
}
