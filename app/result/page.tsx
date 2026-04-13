'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { PRIZES, getPrizeBySlug } from '@/lib/prizes'

// ── Confetti ──────────────────────────────────────────────────────────────────

interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
  shape: 'rect' | 'circle'
}

function useConfetti(active: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<ConfettiParticle[]>([])
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#47F7AD', '#2DD4BF', '#F59E0B', '#8B5CF6', '#FF6B6B', '#ffffff']

    for (let i = 0; i < 120; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current = particlesRef.current.filter((p) => p.opacity > 0)

      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.06
        p.rotation += p.rotationSpeed
        if (p.y > canvas.height * 0.7) p.opacity -= 0.02

        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color

        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        }
        ctx.restore()
      }

      if (particlesRef.current.length > 0) {
        animRef.current = requestAnimationFrame(draw)
      }
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [active])

  return canvasRef
}

// ── Referral copy ─────────────────────────────────────────────────────────────

function useCopyReferral() {
  const [copied, setCopied] = useState(false)
  const copy = async (code: string) => {
    const url = `${window.location.origin}/?ref=${code}`
    await navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }
  return { copied, copy }
}

// ── Result content ────────────────────────────────────────────────────────────

function ResultContent() {
  const searchParams = useSearchParams()
  const prizeSlug = searchParams.get('prize') ?? ''
  const prize = getPrizeBySlug(prizeSlug)
  const router = useRouter()

  const isWin = prize && prize.slug !== 'no_prize' && prize.slug !== 'spin_again'
  const isSpinAgain = prize?.slug === 'spin_again'
  const isNoWin = !prize || prize.slug === 'no_prize'

  const canvasRef = useConfetti(!!isWin)
  const { copied, copy } = useCopyReferral()

  const [referralCode, setReferralCode] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => setReferralCode(d.referralCode ?? null))
      .catch(() => {})
  }, [])

  // Redirect spin_again back to spin page
  useEffect(() => {
    if (isSpinAgain) {
      setTimeout(() => router.push('/spin'), 2000)
    }
  }, [isSpinAgain, router])

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ fontFamily: 'var(--font-instrument), sans-serif' }}
    >
      {/* Confetti canvas */}
      {isWin && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 50 }}
        />
      )}

      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: isWin
            ? 'radial-gradient(ellipse at 50% 50%, rgba(71,247,173,0.12) 0%, transparent 65%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(21,56,83,0.5) 0%, transparent 65%)',
        }}
      />

      <div className="w-full max-w-sm flex flex-col items-center gap-6 relative z-10">

        {/* Logo */}
        <div
          style={{
            padding: '8px 14px',
            background: 'rgba(21,56,83,0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(71,247,173,0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Image src="/logo.webp" alt="Chekkit" width={90} height={30} style={{ objectFit: 'contain', height: 28, width: 'auto' }} />
        </div>

        {/* Prize card */}
        <div
          className="w-full text-center"
          style={{ animation: 'fadeUp 0.5s ease forwards', opacity: 0 }}
        >
          {isNoWin ? (
            <NoWinCard />
          ) : isSpinAgain ? (
            <SpinAgainCard />
          ) : (
            <WinCard prize={prize!} />
          )}
        </div>

        {/* Action buttons */}
        {isWin && (
          <div
            className="w-full flex flex-col gap-3"
            style={{ animation: 'fadeUp 0.5s ease 0.2s forwards', opacity: 0 }}
          >
            {/* Claim instruction */}
            <div
              className="card p-4 text-center"
              style={{ background: 'rgba(71,247,173,0.08)', borderColor: 'rgba(71,247,173,0.25)' }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-syne)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--primary)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                How to claim
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Show this screen to a <strong>Chekkit staff member</strong> at the booth to collect your prize.
              </p>
            </div>

            {/* Referral CTA */}
            {referralCode && (
              <div className="card p-4">
                <p
                  style={{
                    fontFamily: 'var(--font-syne)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '8px',
                  }}
                >
                  🎁 Get a bonus spin
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>
                  Refer a colleague — they spin, you get another turn.
                </p>
                <button
                  onClick={() => copy(referralCode)}
                  className="btn-ghost"
                  style={{ fontFamily: 'var(--font-syne)', fontSize: '0.85rem', padding: '11px 20px' }}
                >
                  {copied ? '✓ Link Copied!' : '🔗 Copy Referral Link'}
                </button>
              </div>
            )}
          </div>
        )}

        {isNoWin && referralCode && (
          <div
            className="w-full flex flex-col gap-3"
            style={{ animation: 'fadeUp 0.5s ease 0.2s forwards', opacity: 0 }}
          >
            <div className="card p-4">
              <p
                style={{
                  fontFamily: 'var(--font-syne)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '8px',
                }}
              >
                Don&apos;t give up!
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>
                Refer a colleague and earn another spin!
              </p>
              <button
                onClick={() => copy(referralCode)}
                className="btn-primary"
                style={{ fontFamily: 'var(--font-syne)', fontSize: '0.85rem', padding: '11px 20px' }}
              >
                {copied ? '✓ Link Copied!' : '🔗 Copy Referral Link'}
              </button>
            </div>
          </div>
        )}

        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
          Powered by Chekkit · Pharma West Africa 2025
        </p>
      </div>
    </div>
  )
}

function WinCard({ prize }: { prize: { name: string; emoji: string; color: string } }) {
  return (
    <div
      className="card p-8 flex flex-col items-center gap-4"
      style={{
        borderColor: 'rgba(71,247,173,0.4)',
        background: 'rgba(21,56,83,0.7)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shimmer overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, transparent 40%, rgba(71,247,173,0.06) 50%, transparent 60%)',
          backgroundSize: '200% 200%',
          animation: 'shimmer 3s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          fontSize: '5rem',
          lineHeight: 1,
          animation: 'float 3s ease-in-out infinite',
        }}
      >
        {prize.emoji}
      </div>
      <div>
        <p
          style={{
            fontFamily: 'var(--font-syne)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--primary)',
            marginBottom: '6px',
          }}
        >
          🎉 Congratulations!
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-syne)',
            fontSize: 'clamp(1.6rem, 6vw, 2rem)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          You won a
          <br />
          <span className="glow-text">{prize.name}!</span>
        </h2>
      </div>
    </div>
  )
}

function NoWinCard() {
  return (
    <div className="card p-8 flex flex-col items-center gap-4" style={{ borderColor: 'rgba(71,247,173,0.1)' }}>
      <div style={{ fontSize: '4rem', lineHeight: 1 }}>😢</div>
      <div>
        <p
          style={{
            fontFamily: 'var(--font-syne)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '6px',
          }}
        >
          Better luck next time
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-syne)',
            fontSize: '1.8rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          Ouch! Bye 👋
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '8px' }}>
          Refer a colleague to get another shot!
        </p>
      </div>
    </div>
  )
}

function SpinAgainCard() {
  return (
    <div className="card p-8 flex flex-col items-center gap-4" style={{ borderColor: 'rgba(71,247,173,0.3)' }}>
      <div style={{ fontSize: '4rem', lineHeight: 1 }}>🔁</div>
      <div>
        <p
          style={{
            fontFamily: 'var(--font-syne)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--primary)',
            marginBottom: '6px',
          }}
        >
          Lucky you!
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-syne)',
            fontSize: '1.8rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
          }}
        >
          Spin Again!
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '8px' }}>
          Sending you back to the wheel…
        </p>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  )
}
